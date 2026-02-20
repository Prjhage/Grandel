const Booking = require("../models/booking");
const Listing = require("../models/listing");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const { getTravelSuggestions } = require("../services/geminiService");
const { getWeather } = require("../services/weatherService");
const { getImage } = require("../services/imageService");
const n8nService = require("../services/n8nService");
const { generateBookingPDF } = require("../utils/generateBookingPDF");


/* ================= SHOW BOOKING FORM ================= */
module.exports.renderBookingForm = async (req, res) => {
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
};

/* ================= INITIATE BOOKING (CREATE ORDER) ================= */
module.exports.initiateBooking = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
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
        } = req.body;

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (!startDate || !endDate || end <= start) {
            return res.status(400).json({ success: false, message: "Invalid booking dates" });
        }

        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        /* ================= PRICING LOGIC ================= */
        const adultCount = Number(adults) || 0;
        const childCount = Number(children) || 0;
        const animalCount = Number(animals) || 0;
        const totalGuests = adultCount + childCount;

        const pricePerNight = listing.price;
        const basePrice = nights * pricePerNight;

        const freeGuests = listing.freeGuests || 3;
        const extraGuests = Math.max(0, totalGuests - freeGuests);
        const extraGuestFee = extraGuests * (listing.extraGuestChargePerNight || 500) * nights;

        const animalFee = animalCount > 0 ? animalCount * (listing.petChargePerNight || 300) * nights : 0;

        const subtotal = basePrice + extraGuestFee + animalFee;
        const gst = Math.round(subtotal * 0.18);
        const totalPrice = subtotal + gst;

        /* ================= DISCOUNT LOGIC ================= */
        const discountPercent = listing.discount || 0;
        let discountAmount = 0;
        let finalTotalPrice = totalPrice;

        if (discountPercent > 0) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const bookedToday = await Booking.findOne({
                listing: listing._id,
                createdAt: { $gte: todayStart },
                status: { $ne: "cancelled" }
            });

            if (!bookedToday) {
                discountAmount = Math.round(subtotal * discountPercent / 100);
                finalTotalPrice = totalPrice - discountAmount;
            }
        }

        /* ================= RAZORPAY ORDER (20%) ================= */
        const tokenAmount = Math.round(finalTotalPrice * 0.20);
        const options = {
            amount: tokenAmount * 100, // amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                listingId: listing._id.toString(),
                userId: req.user._id.toString(),
            }
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            order,
            key: process.env.RAZORPAY_KEY_ID,
            tokenAmount,
            totalPrice: finalTotalPrice,
        });

    } catch (err) {
        console.error("Initiate Booking Error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


/* ================= CONFIRM BOOKING (VERIFY & SAVE) ================= */
module.exports.confirmBooking = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingDetails // All the form data
        } = req.body;

        const listing = await Listing.findById(req.params.id).populate("Owner");
        if (!listing) return res.status(404).json({ success: false, message: "Listing not found" });

        /* ================= VERIFY SIGNATURE ================= */
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest("hex");

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        /* ================= RE-CALCULATE DATA FOR SAFETY ================= */
        // (We repeat the logic to ensure data integrity)
        const {
            startDate,
            endDate,
            adults = 1,
            children = 0,
            infants = 0,
            animals = 0,
        } = bookingDetails;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        const adultCount = Number(adults) || 0;
        const childCount = Number(children) || 0;
        const animalCount = Number(animals) || 0;
        const totalGuests = adultCount + childCount;

        const pricePerNight = listing.price;
        const basePrice = nights * pricePerNight;
        const freeGuests = listing.freeGuests || 3;
        const extraGuests = Math.max(0, totalGuests - freeGuests);
        const extraGuestFee = extraGuests * (listing.extraGuestChargePerNight || 500) * nights;
        const animalFee = animalCount > 0 ? animalCount * (listing.petChargePerNight || 300) * nights : 0;

        const subtotal = basePrice + extraGuestFee + animalFee;
        const gst = Math.round(subtotal * 0.18);
        const totalPrice = subtotal + gst;

        let finalTotalPrice = totalPrice;
        let discountAmount = 0;
        let discountApplied = false;

        // Apply discount if applicable
        if (listing.discount > 0) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const bookedToday = await Booking.findOne({
                listing: listing._id,
                createdAt: { $gte: todayStart },
                status: { $ne: "cancelled" }
            });

            if (!bookedToday) {
                discountAmount = Math.round(subtotal * listing.discount / 100);
                finalTotalPrice = totalPrice - discountAmount;
                discountApplied = true;
            }
        }

        /* ================= WEATHER & AI (Async - Optional fail-safe) ================= */
        let weatherData = { temp: "N/A", condition: "N/A", humidity: "N/A" };
        try {
            const w = await getWeather(listing.location);
            if (w) weatherData = w;
        } catch (e) { }

        let aiResponse = { places: [], food: [], plan: [] };
        try {
            const aiData = await getTravelSuggestions(listing.location, nights);
            if (aiData) {
                aiResponse.places = aiData.places || [];
                aiResponse.food = aiData.food || [];
                aiResponse.plan = aiData.plan || [];
            }
        } catch (e) { }

        // Budget Calculation
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
            totalPrice: finalTotalPrice,
            discountApplied,
            discountAmount,
            guests: {
                adults: adultCount,
                children: childCount,
                infants,
                animals: animalCount,
            },
            travelCompanion: {
                weather: weatherData,
                plan: aiResponse.plan,
                budget,
            },
            status: "pending", // Payment successful, now awaiting host
            payment: {
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                amount: Math.round(finalTotalPrice * 0.20), // Token amount
                status: 'paid'
            }
        });

        await booking.save();

        /* ================= NOTIFICATIONS ================= */
        try {
            // 1. Notify the Host (New Booking Alert)
            if (listing.Owner && listing.Owner.email) {
                await n8nService.sendBookingConfirmation(listing.Owner.email, {
                    id: booking._id,
                    listingName: listing.title,
                    startDate: booking.startDate,
                    endDate: booking.endDate,
                    totalPrice: booking.totalPrice,
                    location: listing.location,
                    guestName: req.user.username,
                    guestEmail: req.user.email
                }, 'host_notification');
            }

            // 2. Notify the Guest (Request Received)
            if (req.user && req.user.email) {
                await n8nService.sendBookingConfirmation(req.user.email, {
                    id: booking._id,
                    listingName: listing.title,
                    startDate: booking.startDate,
                    endDate: booking.endDate,
                    totalPrice: booking.totalPrice,
                    location: listing.location,
                    hostName: listing.Owner?.username || 'Host'
                }, 'guest_request');
            }
        } catch (n8nError) {
            console.error("n8n Notification Error:", n8nError.message);
        }

        res.json({ success: true, message: "Booking confirmed!", bookingId: booking._id });

    } catch (err) {
        console.error("Confirm Booking Error:", err);
        res.status(500).json({ success: false, message: "Booking confirmation failed" });
    }
};

/* ================= BOOKING PDF ================= */
module.exports.generatePDF = async (req, res) => {
    const booking = await Booking.findById(req.params.id).populate({
        path: "listing",
        populate: { path: "Owner" },
    });

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found" });
    }

    await generateBookingPDF({
        res,
        bookingId: booking._id,
        user: req.user,
        owner: booking.listing.Owner,
        listing: booking.listing,
        booking,
    });
};

/* ================= CANCEL BOOKING ================= */
module.exports.cancelBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking || !booking.user.equals(req.user._id)) {
        return res.status(403).json({ success: false, message: "Unauthorized action" });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Booking cancelled" });
};

/* ================= VERIFY BOOKING (SCANNER) ================= */
module.exports.verifyBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id)
            .populate("user", "username email avatar")
            .populate({
                path: "listing",
                select: "title location Owner image"
            });

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (!booking.listing) {
            return res.status(404).json({ success: false, message: "Associated listing not found" });
        }

        if (!booking.listing.Owner) {
            return res.status(403).json({ success: false, message: "Listing owner not found. Contact support." });
        }

        // 🔐 SECURITY CHECK: Does this host own the listing?
        const ownerId = booking.listing.Owner.toString();
        const requesterId = req.user._id.toString();

        console.log("--- QR Verification Debug ---");
        console.log("Owner ID (string):", ownerId);
        console.log("Requester ID (string):", requesterId);

        if (ownerId !== requesterId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: This booking belongs to another property."
            });
        }

        // Calculate balance due (80%)
        const tokenPaid = Math.round(booking.totalPrice * 0.20);
        const balanceDue = booking.totalPrice - tokenPaid;

        res.json({
            success: true,
            booking: {
                id: booking._id,
                status: booking.status,
                startDate: booking.startDate,
                endDate: booking.endDate,
                guest: booking.user,
                listingTitle: booking.listing.title,
                totalPrice: booking.totalPrice,
                tokenPaid,
                balanceDue,
                guests: booking.guests
            }
        });

    } catch (err) {
        console.error("Verify Booking Error:", err);
        res.status(500).json({ success: false, message: "Verification failed due to a server error" });
    }
};
