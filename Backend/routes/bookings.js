const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");
const bookingController = require("../controllers/bookings");

// Show Booking Form
router.get(
  "/listings/:id/book",
  isLoggedIn,
  wrapAsync(bookingController.renderBookingForm)
);

// Initiate Booking (Create Razorpay Order)
router.post(
  "/listings/:id/book/initiate",
  isLoggedIn,
  wrapAsync(bookingController.initiateBooking)
);

// Confirm Booking (Verify Payment & Save)
router.post(
  "/listings/:id/book/verify",
  isLoggedIn,
  wrapAsync(bookingController.confirmBooking)
);

// Generate PDF
router.get(
  "/bookings/:id/pdf",
  isLoggedIn,
  wrapAsync(bookingController.generatePDF)
);

// Cancel Booking
router.delete(
  "/bookings/:id",
  isLoggedIn,
  wrapAsync(bookingController.cancelBooking)
);

// Verify Booking (Scanner)
router.get(
  "/bookings/verify/:id",
  isLoggedIn,
  wrapAsync(bookingController.verifyBooking)
);

// Keep the old route temporarily for backward compatibility if needed, 
// but pointing to initiate is wrong. 
// Frontend will now call /initiate and /verify. 
// Old POST /listings/:id/book is effectively replaced/deprecated.

module.exports = router;
