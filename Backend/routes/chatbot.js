const express = require("express");
const {
  chatWithSupport,
  getChatHistory,
} = require("../controllers/chatbot.js");
const { isLoggedIn } = require("../middleware.js");

const router = express.Router();

// Rate Limiting
const rateLimit = require("express-rate-limit");
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: { reply: "You're sending too many messages. Please take a breather! 🧘" }
});

// Chat with support bot
router.post("/chat", isLoggedIn, chatLimiter, chatWithSupport);

// Get chat history (optional - for logged-in users)
router.get("/history", getChatHistory);

module.exports = router;
