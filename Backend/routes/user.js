const express = require("express");
// const { model } = require("mongoose");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
const userController = require("../controllers/users.js");

//router .routes for signup
router
  .route("/signup")
  .post(wrapAsync(userController.firebaseRegister)); // Firebase signup logic

//router. routes for login
router
  .route("/login")
  // The passport.authenticate middleware is removed as Firebase handles authentication.
  .post(saveRedirectUrl, wrapAsync(userController.firebaseLogin)); // Firebase login logic

//current user info (for session persistence)
router.get("/current-user", (req, res) => {
  res.json({ user: req.user || null });
});

//logout
router.get("/logout", userController.logout);

//wishlist
router.post(
  "/wishlist/:id",
  isLoggedIn,
  wrapAsync(userController.toggleWishlist),
);

router.get("/wishlist", isLoggedIn, wrapAsync(userController.getWishlist));

//profile
router.get("/profile", isLoggedIn, wrapAsync(userController.profile));

//profile photo upload
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router.post(
  "/profile/photo",
  isLoggedIn,
  upload.single("avatar"),
  wrapAsync(userController.updateProfilePhoto),
);

const Listing = require("../models/listing");
const Booking = require("../models/booking");

/* ================= HOST DASHBOARD ================= */

router.get(
  "/profile/host",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    // 🔐 Only hosts allowed
    if (req.user.role !== "host") {
      return res.status(403).json({ success: false, message: "Host access only" });
    }

    // 🏠 Get host listings
    const listings = await Listing.find({ Owner: req.user._id });
    const listingIds = listings.map((l) => l._id);

    // 📦 Get all bookings for those listings
    const bookings = await Booking.find({
      listing: { $in: listingIds },
    })
      .populate("user", "username email phoneLast4")
      .populate("listing", "title");

    // 📊 Categorize bookings
    const upcoming = bookings.filter((b) => b.status === "pending");
    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const cancelled = bookings.filter((b) => b.status === "cancelled");
    const completed = bookings.filter((b) => b.status === "completed");

    res.json({
      upcoming,
      confirmed,
      cancelled,
      completed,
      listings
    });
  }),
);

/* ================= UPDATE BOOKING STATUS ================= */

router.post(
  "/profile/host/bookings/:id/status",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    // 🔐 Only hosts allowed
    if (req.user.role !== "host") {
      return res.status(403).json({ success: false, message: "Host access only" });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    // Find booking and verify ownership
    const booking = await Booking.findById(id).populate("listing");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Check if user owns the listing
    if (!booking.listing.Owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Unauthorized action" });
    }

    // Update status
    booking.status = status;
    await booking.save();

    res.json({ success: true, message: `Status updated to ${status}` });
  }),
);

module.exports = router;
