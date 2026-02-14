const fs = require('fs');
const path = require('path');
const logFile = fs.createWriteStream(path.join(__dirname, 'debug.log'), { flags: 'a' });
const logStdout = process.stdout;

console.log = function (d) {
  logFile.write(`[LOG] ${new Date().toISOString()} ${d}\n`);
  logStdout.write(d + '\n');
};
console.error = function (d) {
  logFile.write(`[ERR] ${new Date().toISOString()} ${d}\n`);
  logStdout.write(d + '\n');
};
console.warn = function (d) {
  logFile.write(`[WRN] ${new Date().toISOString()} ${d}\n`);
  logStdout.write(d + '\n');
};

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
app.set("trust proxy", 1); // Trust proxy for secure cookies on Render
const cors = require("cors");

// =================================================
// CORS CONFIGURATION (MUST BE AT THE TOP)
// =================================================
const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
// Ensure no trailing slash in the env variable to prevent mismatch
const cleanFrontendURL = frontendURL.replace(/\/$/, "");

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

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

const sessionOptions = {
  store: store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  proxy: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // one week for milliseconds
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

// API Route for Featured Listings
app.get("/api/featured", async (req, res) => {
  try {
    // Fetch top 6 featured listings with optimized query
    const featuredListings = await Listing.find()
      .limit(6)
      .select('title image price location reviews')
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

    res.json({ featuredListings: listingsWithRating });
  } catch (error) {
    console.log("Error fetching featured listings:", error);
    res.status(500).json({ featuredListings: [] });
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
});
