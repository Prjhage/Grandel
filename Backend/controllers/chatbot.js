const Groq = require("groq-sdk");
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const User = require("../models/user.js");
require("dotenv").config();

// 🔑 Initialize Groq
let groq;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
} else {
  console.warn("Warning: GROQ_API_KEY is missing. Chatbot feature will be disabled.");
}

module.exports.chatWithSupport = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!message) {
      return res.status(400).json({
        reply: "Please ask me something! How can I help you with your stay? 🏡",
      });
    }

    // =================================================
    // 1️⃣ DATA GATHERING (Context Creation)
    // =================================================

    // A. Fetch All Active Listings (for intelligence)
    const listings = await Listing.find({})
      .select("title location country price category reviews avgRating numRooms guestsPerRoom");

    const listingsContext = listings
      .map(
        (l) =>
          `- [ID: ${l._id}] ${l.title} in ${l.location}, ${l.country}: ₹${l.price}/night | Category: ${l.category} | ⭐ ${(l.avgRating || 0).toFixed(1)} (${l.reviews?.length || 0} reviews) | Rooms: ${l.numRooms}, Max Guests/Room: ${l.guestsPerRoom}`,
      )
      .join("\n");

    // B. Fetch User's Recent Booking
    let bookingContext =
      "No active bookings. You can explore our listings and make a reservation!";
    let userContext = "Guest user";

    if (userId) {
      const user = await User.findById(userId).select("username email role");
      userContext = `${user?.username} (${user?.role || "guest"})`;

      const lastBooking = await Booking.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .populate("listing", "title location price");

      if (lastBooking) {
        const status =
          lastBooking.orderStatus || lastBooking.bookingStatus || "Pending";
        const checkIn = new Date(lastBooking.startDate).toLocaleDateString();
        const checkOut = new Date(lastBooking.endDate).toLocaleDateString();
        bookingContext = `Recent Booking: ${lastBooking.listing?.title} in ${lastBooking.listing?.location} | Check-in: ${checkIn}, Check-out: ${checkOut} | Status: ${status} | Total: ₹${lastBooking.totalPrice}`;
      }
    }

    // =================================================
    // 2️⃣ BRAIN CONFIGURATION (Groq Llama-3)
    // =================================================

    const systemPrompt = `
You are 'Grandal Assistant' 🏡, the official travel support bot for the Grandel booking platform.

--- 
### 📋 REAL-TIME DATA (USE THIS!):
The following data is LIVE from our database. Use it to answer user questions about listings, ratings, and prices.

[USER INFO]: ${userContext}
[RECENT BOOKING]: ${bookingContext}

[AVAILABLE LISTINGS]:
${listingsContext || "No listings currently available."}
---

🎯 YOUR GOALS:
1. **Search Protocol**: 
   - First, scan [AVAILABLE LISTINGS] for the user's requested location or criteria.
   - If found, recommend them immediately. Be specific about their Price, Location, and Star Rating (⭐).
   - If NO listings match the requested location exactly, explicitly say: "We don't have listings in [City] yet, but here are our top-rated properties elsewhere!" and show the best ones from the list.
2. **Trigger Booking**: When a user picks a place, append exactly this at the end:
   [RESERVE:{"id":"LISTING_ID","title":"LISTING_TITLE","price":LISTING_PRICE,"maxRooms":LISTING_MAX_ROOMS,"maxGuests":LISTING_MAX_GUESTS}]

🎯 RESPONSE RULES:
1. **Data Accuracy**: NEVER say "I don't see listings" if they are present in the [AVAILABLE LISTINGS] list.
2. **Concise & Friendly**: Use emojis 🎨. Keep it under 4 sentences.
3. **No Hallucinations**: Only discuss listings from the provided data.
`;

    // 🚀 Call Groq API
    let chatCompletion;
    if (groq) {
      chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        max_tokens: 500,
      });
    } else {
      console.warn("Chatbot request skipped: Groq is not initialized.");
    }

    let reply =
      "I'm having trouble connecting right now. Please try again in a moment! 🌐";

    if (
      chatCompletion &&
      chatCompletion.choices &&
      chatCompletion.choices.length > 0
    ) {
      const choice = chatCompletion.choices[0];
      if (choice && choice.message && choice.message.content) {
        reply = choice.message.content;
      }
    }

    // =================================================
    // 3️⃣ SEND RESPONSE
    // =================================================
    res.json({ reply: reply.trim() });
  } catch (error) {
    console.error("🏡 Support Bot Error:", error.message);
    res.status(500).json({
      reply:
        "Our support team is temporarily unavailable. Please try again later or contact us directly! 📧",
    });
  }
};

// Optional: Get Chat History (if you want to store conversations)
module.exports.getChatHistory = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Please login to view chat history" });
    }

    // TODO: Implement if you add database storage for chats
    res.json({ message: "Chat history feature coming soon!" });
  } catch (error) {
    res.status(500).json({ message: "Error fetching chat history" });
  }
};
