const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
  console.log(`Loaded .env from ${envPath}`);
} else {
  console.error(`ERROR: .env not found at ${envPath}`);
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
const cacheService = require("./services/cacheService");

app.set("trust proxy", 1);


// =================================================
// CORS CONFIGURATION (MUST BE AT THE TOP)
// =================================================
const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
console.log(`[INIT] Frontend URL: ${frontendURL}`);
// Ensure no trailing slash in the env variable to prevent mismatch
const cleanFrontendURL = frontendURL.replace(/\/$/, "");

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(morgan('dev'));

// =================================================
// SECURITY MIDDLEWARE
// =================================================
// Set security HTTP headers
app.use(helmet());

// Performance: Compression
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // relaxed from 100 to 300 to support high-traffic/prefetching
  message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api/", limiter);

// Custom Data Sanitization against NoSQL Injection (Express 5 compatible)
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (key.startsWith('$')) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      });
    }
  };

  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  // In Express 5, req.query is a getter. We sanitize the object it returns.
  if (req.query) sanitize(req.query);

  next();
});

// Prevent HTTP parameter pollution
app.use(hpp());

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRoutes = require("./routes/bookings");
const authRouter = require("./routes/auth.js");


const chatbotRouter = require("./routes/chatbot.js");

const session = require("express-session");
const { default: MongoStore } = require("connect-mongo");

const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");
const Listing = require("./models/listing.js");

// =================================================
// FIREBASE ADMIN SDK INITIALIZATION
// =================================================
// Initialized in config/firebaseAdmin.js
require("./config/firebaseAdmin");
// =================================================
// =================================================

const dburl = process.env.ATLASDB_URL;
if (!dburl) {
  console.error("FATAL ERROR: ATLASDB_URL is not defined. Check your Render Environment Variables.");
}

const store = MongoStore.create({
  mongoUrl: dburl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 60 * 60,
});

const isProd = process.env.NODE_ENV === 'production';

const sessionOptions = {
  store: store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  proxy: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    // 🛡️ Enhanced Mobile/Cross-Site Cookie Security
    secure: isProd || process.env.FORCE_SECURE_COOKIES === 'true',
    sameSite: isProd ? 'none' : 'lax',
  },
};

app.use(session(sessionOptions));
//passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser()); //serialize user into the session
passport.deserializeUser(User.deserializeUser()); //deserialize user into the session


// Database connection
main()
  .then(async () => {
    console.log("Connected to DB");
    try {
      // Ensure all indexes (especially geospatial) are created on startup
      await Listing.syncIndexes();
    } catch (indexErr) {
      console.error("Index Sync Warning:", indexErr.message);
    }
  })
  .catch((err) => console.log("Initial DB Connection Failed:", err));

mongoose.connection.on("error", (err) => {
  console.error("Runtime DB Error:", err);
});
mongoose.connection.on("disconnected", () => {
  console.log("DB Disconnected");
});

async function main() {
  await mongoose.connect(dburl);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // For parsing application/json

// Request Logging Middleware (Helps debug if requests reach the server)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from Origin: ${req.headers.origin}`);
  next();
});

// Root Route - Always redirect to Frontend (for browser visits)
app.get("/", (req, res) => {
  const redirectURL = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(redirectURL);
});

// API Route for Health Check (and Keep-Alive)
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Route for Featured Listings
app.get("/api/featured", async (req, res) => {
  try {
    const cacheKey = "featured_listings";
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json({ featuredListings: cachedData, fromCache: true });
    }

    // Fetch top 6 featured listings with optimized query
    const featuredListings = await Listing.find()
      .limit(6)
      .select('title image price location country reviews')
      .populate({
        path: 'reviews',
        select: 'rating'
      })
      .lean()
      .exec();

    // Calculate average rating for each listing
    const listingsWithRating = featuredListings.map((listing) => {
      const avgRating =
        listing.reviews && listing.reviews.length > 0
          ? listing.reviews.reduce((sum, review) => sum + review.rating, 0) /
          listing.reviews.length
          : 0;
      return {
        ...listing,
        avgRating: avgRating,
      };
    });

    cacheService.set(cacheKey, listingsWithRating, cacheService.TTL.FEATURED);
    res.json({ featuredListings: listingsWithRating });
  } catch (error) {
    console.log("Error fetching featured listings:", error);
    res.status(500).json({ featuredListings: [] });
  }
});

// API Route for Site Stats (total users & hotels)
app.get("/api/stats", async (req, res) => {
  try {
    const cacheKey = "site_stats";
    const cachedStats = cacheService.get(cacheKey);
    if (cachedStats) {
      return res.json({ ...cachedStats, fromCache: true });
    }

    const [totalListings, totalUsers] = await Promise.all([
      Listing.countDocuments(),
      User.countDocuments(),
    ]);

    const stats = { totalListings, totalUsers };
    cacheService.set(cacheKey, stats, cacheService.TTL.STATS);

    res.json(stats);
  } catch (error) {
    console.log("Error fetching stats:", error);
    res.status(500).json({ totalListings: 0, totalUsers: 0 });
  }
});

// NEW: Seed Route to populate DB if empty
app.get("/seed-db", async (req, res) => {
  try {
    const { data: sampleListings } = require("./init/data.js");

    // Only seed if empty to prevent duplicates
    const count = await Listing.countDocuments();
    if (count > 0) return res.send("Database already has data. Skipping seed.");

    await Listing.insertMany(sampleListings);
    res.json({ success: true, message: "Database seeded successfully with sample listings!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error seeding DB: " + error.message });
  }
});

//Routers
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/", bookingRoutes);
app.use("/", authRouter);

// 🤖 Chatbot Routes (NEW)
app.use("/api/chatbot", chatbotRouter);

app.use((err, req, res, next) => {
  console.error("Global Error Handler caught:", err.message);
  console.error(err.stack);
  let { statusCode = 500, message = "Something went wrong" } = err;

  res.status(statusCode).json({
    success: false,
    message: message
  });
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);

  // =================================================
  // SELF-PING KEEP-ALIVE (Render Free Tier)
  // =================================================
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    const selfUrl = `${process.env.RENDER_EXTERNAL_URL}/api/health`;
    console.log(`[KEEP-ALIVE] Monitoring started for: ${selfUrl}`);

    // Ping every 10 minutes to prevent Render from spinning down
    setInterval(async () => {
      try {
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const response = await fetch(selfUrl);
        if (response.ok) {
          console.log(`[KEEP-ALIVE] Self-ping successful at ${new Date().toISOString()}`);
        } else {
          console.warn(`[KEEP-ALIVE] Self-ping failed with status: ${response.status}`);
        }
      } catch (err) {
        console.error(`[KEEP-ALIVE] Error during self-ping: ${err.message}`);
      }
    }, 10 * 60 * 1000); // 10 minutes
  }
});
