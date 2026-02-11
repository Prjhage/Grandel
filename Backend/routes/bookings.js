const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { generateBookingPDF } = require("../utils/generateBookingPDF");
const { getTravelSuggestions } = require("../services/geminiService");
const { getWeather } = require("../services/weatherService");
const { getImage } = require("../services/imageService");

/* ================= SHOW BOOKING FORM ================= */
router.get(
  "/listings/:id/book",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    // ✅ Read guests from query (sent from reserve card)
    const guests = {
      adults: Number(req.query.adults) || 1,
      children: Number(req.query.children) || 0,
      infants: Number(req.query.infants) || 0,
      animals: Number(req.query.animals) || 0,
    };

    // ✅ Safety: Validate against listing capacity
    const maxGuests = listing.numRooms * listing.guestsPerRoom;
    const payingGuests = guests.adults + guests.children;

    if (payingGuests > maxGuests) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxGuests} guests allowed for this property`
      });
    }

    res.json({
      listing,
      user: req.user,
      guests, // 🔥 IMPORTANT
    });
  })
);

/* ================= CREATE BOOKING ================= */
router.post(
  "/listings/:id/book",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id).populate("Owner");
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    const {
      startDate,
      endDate,
      adults = 1,
      children = 0,
      infants = 0,
      animals = 0,
      acceptGuestTerms,
    } = req.body;

    if (!acceptGuestTerms) {
      return res.status(400).json({ success: false, message: "Please accept guest terms and conditions" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!startDate || !endDate || end <= start) {
      return res.status(400).json({ success: false, message: "Invalid booking dates" });
    }

    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    /* ================= GUEST LOGIC ================= */
    // Parse values safely
    const adultCount = Number(adults) || 0;
    const childCount = Number(children) || 0;
    const infantCount = Number(infants) || 0; // NOT used in pricing
    const animalCount = Number(animals) || 0; // NOT used in guest limit

    // ✅ Only adults + children count as guests
    const totalGuests = adultCount + childCount;
    const maxGuests = listing.numRooms * listing.guestsPerRoom;

    if (totalGuests > maxGuests) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxGuests} guests allowed (excluding infants)`
      });
    }

    /* ================= PRICING ================= */
    const pricePerNight = listing.price;
    const basePrice = nights * pricePerNight;

    // ✅ Use listing's freeGuests setting
    const freeGuests = listing.freeGuests || 3;
    const extraGuests = Math.max(0, totalGuests - freeGuests);
    const extraGuestFee =
      extraGuests * (listing.extraGuestChargePerNight || 500) * nights;

    // ✅ Animals charged separately (not guests)
    const animalFee =
      animalCount > 0
        ? animalCount * (listing.petChargePerNight || 300) * nights
        : 0;

    const subtotal = basePrice + extraGuestFee + animalFee;
    const gst = Math.round(subtotal * 0.18);
    const totalPrice = subtotal + gst;

    /* ================= WEATHER ================= */
    const weatherInfo = await getWeather(listing.location);
    const weatherData = weatherInfo || {
      temp: "N/A",
      condition: "N/A",
      humidity: "N/A",
    };

    /* ================= GEMINI AI ================= */
    const aiData = await getTravelSuggestions(listing.location, nights);

    let aiResponse = {
      places: [],
      food: [],
      plan: [],
    };

    if (aiData && Array.isArray(aiData.places) && aiData.places.length > 0) {
      aiResponse.places = aiData.places;
    } else {
      aiResponse.places = ["Explore local attractions"];
    }

    if (aiData && Array.isArray(aiData.food) && aiData.food.length > 0) {
      aiResponse.food = aiData.food;
    } else {
      aiResponse.food = ["Try local cuisine"];
    }

    if (aiData && Array.isArray(aiData.plan) && aiData.plan.length > 0) {
      aiResponse.plan = aiData.plan;
    } else {
      aiResponse.plan = [`Enjoy ${listing.location}`];
    }

    /* ================= IMAGES FOR AI ================= */
    const placeImages = [];
    for (let place of aiResponse.places) {
      const img = await getImage(`${place} ${listing.location}`);
      placeImages.push({
        name: place,
        image:
          img || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      });
    }

    const foodImages = [];
    for (let food of aiResponse.food) {
      const img = await getImage(`${food} food`);
      foodImages.push({
        name: food,
        image:
          img || "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      });
    }

    /* ================= UPDATE LISTING (AI DATA) ================= */
    await Listing.findByIdAndUpdate(listing._id, {
      $set: {
        travelCompanion: {
          places: placeImages,
          food: foodImages,
        },
      },
    });

    /* ================= BUDGET ================= */
    const baseBudget = nights <= 3 ? 1800 : 1500;
    const budget = {
      food: `Rs. ${Math.round(baseBudget * 0.45)}`,
      transport: `Rs. ${Math.round(baseBudget * 0.3)}`,
      attractions: `Rs. ${Math.round(baseBudget * 0.25)}`,
      dailyTotal: `Rs. ${baseBudget}`,
    };

    /* ================= SAVE BOOKING ================= */
    const booking = new Booking({
      listing: listing._id,
      user: req.user._id,
      startDate,
      endDate,
      nights,
      pricePerNight,
      subtotal,
      gst,
      totalPrice,
      guests: {
        adults,
        children,
        infants,
        animals,
      },
      travelCompanion: {
        weather: weatherData,
        plan: aiResponse.plan,
        budget,
      },
    });

    await booking.save();

    // Securely trigger n8n booking confirmation
    try {
      const n8nService = require("../services/n8nService");
      const user = req.user;

      // 1. Send Guest Confirmation
      n8nService.sendBookingConfirmation(user.email, {
        id: booking._id,
        listingName: listing.title,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPrice: booking.totalPrice,
        location: listing.location,
        guestName: user.username
      }, 'guest_confirmation');

      // 2. Send Host Notification
      if (listing.Owner && listing.Owner.email) {
        n8nService.sendBookingConfirmation(listing.Owner.email, {
          id: booking._id,
          listingName: listing.title,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice,
          location: listing.location,
          guestName: user.username,
          guestEmail: user.email,
          guestPhone: user.phone || 'N/A'
        }, 'host_notification');
      }

      // 3. Send Guest "Thank You" (could be scheduled in n8n)
      n8nService.sendBookingConfirmation(user.email, {
        id: booking._id,
        listingName: listing.title,
        guestName: user.username
      }, 'guest_thanks');

    } catch (n8nError) {
      console.error("n8n Notification Error:", n8nError.message);
    }

    res.json({ success: true, message: "Booking confirmed", booking });

  })
);

/* ================= BOOKING PDF ================= */
router.get(
  "/bookings/:id/pdf",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const booking = await Booking.findById(req.params.id).populate({
      path: "listing",
      populate: { path: "Owner" },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    generateBookingPDF({
      res,
      bookingId: booking._id,
      user: req.user,
      owner: booking.listing.Owner,
      listing: booking.listing,
      booking,
    });
  })
);

/* ================= CANCEL BOOKING ================= */
router.delete(
  "/bookings/:id",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking || !booking.user.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Unauthorized action" });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Booking cancelled" });
  })
);

module.exports = router;
