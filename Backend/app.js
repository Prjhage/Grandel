require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");

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

// =================================================
// FIREBASE ADMIN SDK INITIALIZATION
// =================================================
const admin = require("firebase-admin");

// Construct the service account object from environment variables
// Ensure these variables are set in your .env file
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  // The private key from .env needs to have its newlines restored
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

// Prevent Firebase re-initialization on dev reloads
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
// =================================================

const dburl = process.env.ATLASDB_URL;

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
  .catch((err) => console.log(err));

// async function main() {
//     await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
// }

async function main() {
  await mongoose.connect(dburl);
}

// CORS Configuration for React Frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // For parsing application/json

//Home Route
app.get("/", async (req, res) => {
  try {
    const Listing = require("./models/listing.js");
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
app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
