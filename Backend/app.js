require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");

// =================================================
// CORS CONFIGURATION (MUST BE AT THE TOP)
// =================================================
const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: [
    frontendURL,
    "https://grandel.vercel.app", // Explicitly allow your Vercel app
    "http://localhost:5173"       // Allow local development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
const admin = require("firebase-admin");

// Construct the service account object from environment variables
// Ensure these variables are set in your .env file
const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  // The private key from .env needs to have its newlines restored
  private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") : undefined,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

// Prevent Firebase re-initialization on dev reloads
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    console.error("Firebase initialization failed (check .env):", e.message);
  }
}
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
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // one week for milliseconds
    maxAge: 7 * 24 * 60 * 60 * 1000,
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
  .then(() => {
    console.log("Connected to DB");
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
    // Fetch top 6 featured listings (highest rated or recently added)
    const featuredListings = await Listing.find()
      .limit(6)
      .populate("reviews")
      .exec();

    // Calculate average rating for each listing
    const listingsWithRating = featuredListings.map((listing) => {
      const avgRating =
        listing.reviews && listing.reviews.length > 0
          ? listing.reviews.reduce((sum, review) => sum + review.rating, 0) /
          listing.reviews.length
          : 0;
      return {
        ...listing.toObject(),
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
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
