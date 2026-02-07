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

    // A. Fetch Featured Listings (Top 20 available)
    const listings = await Listing.find({ countInStock: { $gt: 0 } })
      .select("title location country price category reviews avgRating")
      .limit(20);

    const listingsContext = listings
      .map(
        (l) =>
          `- ${l.title} in ${l.location}, ${l.country}: ₹${l.price}/night (${l.category}) ⭐ ${(l.avgRating || 0).toFixed(1)} (${l.reviews?.length || 0} reviews)`,
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
You are 'Grandel Assistant' 🏡, a friendly and helpful travel support chatbot for the Grandel accommodation booking platform.

🎯 YOUR ROLE:
- Help guests find perfect places to stay
- Answer questions about bookings and reservations
- Provide travel tips and recommendations
- Guide users on HOW TO USE the website features
- Handle common customer support queries

📋 CONTEXT DATA:
[USER INFO]: ${userContext}
[RECENT BOOKING]: ${bookingContext}

[AVAILABLE LISTINGS]:
${listingsContext}

🎯 ACTUAL FEATURES IN GRANDEL:

**FOR HOSTS/PROPERTY OWNERS:**
1. "How do I list my property?" / "How to become a host?" 
   → Reply: "Click 'Create Listing' button → Fill in property title, location, description, price → Upload property images → Select amenities → Add house rules → Submit! Your listing goes live! 🏠"

2. "How to add a new listing?"
   → "Navigate to the listings section → Click 'New Listing' → Fill in all property details like name, location, price per night → Upload at least one main image and gallery photos → Set available amenities → Create listing! ✨"

3. "Can I edit my listing?"
   → "Go to 'Host Dashboard' → Find your property → Click 'Edit' button → Update details and photos → Save changes! 📝"

4. "How to check bookings for my property?"
   → "Visit 'Host Dashboard' in your profile → See all reservations for your properties → View guest details and check-in/check-out dates ✅"

**FOR GUESTS/TRAVELERS:**
1. "How do I book a property?"
   → "Browse listings on homepage → Click on a property → Select your check-in and check-out dates → Choose number of guests (adults, children, infants) → Click 'Reserve' → Complete payment → Your booking is confirmed! 🎉"

2. "How to search for listings?"
   → "Use the search bar at the top → Filter by location (city/country) → Browse by category (beach, mountain, trending etc) → Check the price and rating → Click to view details 🔍"

3. "How to view my bookings?"
   → "Go to your Profile → Click 'My Bookings' → See all your reservations with dates, property names, and booking status 📅"

4. "How to cancel my booking?"
   → "Visit your Profile → Go to 'My Bookings' → Select the booking you want to cancel → Click 'Cancel Booking' → Cancellation will be processed 🔄"

5. "How to add property to wishlist?"
   → "While viewing a listing, click the ❤️ heart icon → It gets saved to your wishlist → Go to 'My Wishlist' to view all saved properties later! 💕"

**GENERAL HELP:**
1. "How to create an account?"
   → "Click 'Sign Up' button in the top right → Enter email and create password → Verify your email → Account created! You can also sign up with Google! 👋"

2. "How to login?"
   → "Click 'Login' in top-right corner → Enter your email and password → Login successful! Or use Google sign-in for quick access 🔐"

3. "How to update my profile?"
   → "Go to your Profile → Click edit icon → Update your avatar, bio, and preferences → Save changes ⚙️"

4. "What are the amenities?"
   → "Properties can have amenities like WiFi, Kitchen, Pool, TV, Parking, Garden view, Lake access, Lift, Gym, etc. Check individual listings for their specific amenities! 🏊"

5. "How to contact support?"
   → "Use this chat for immediate help! I'm available 24/7. For urgent matters, check the Help Center in the footer 🤝"

🎯 RESPONSE RULES:
1. **Be Specific**: Give clear step-by-step instructions
2. **Use Emojis**: Make it visual and friendly 🎨
3. **Exact Button Names**: Tell them exactly what button to click
4. **Feature-Focused**: Only mention features that actually exist
5. **Short & Clear**: 2-3 sentences max, use line breaks for steps
6. **Friendly Tone**: Be warm and encouraging

📌 BOOKING QUERIES:
- If user asks about their booking, reference their recent booking above
- Direct them to Profile → My Bookings

📌 LISTING RECOMMENDATIONS:
- ONLY recommend real listings from database
- Use actual listing titles, locations, prices
- Include ⭐ ratings

📌 OUT OF SCOPE:
- "Modify booking" → Not available, suggest cancel & rebook
- "Extend stay" → Not available, suggest new booking
- Payment issues → "Contact support"
- Policy exceptions → "Contact support"

IMPORTANT: ONLY mention features that actually exist in Grandel. Don't make up features!
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
