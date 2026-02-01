const express = require("express");
const {
  chatWithSupport,
  getChatHistory,
} = require("../controllers/chatbot.js");

const router = express.Router();

// Chat with support bot
router.post("/chat", chatWithSupport);

// Get chat history (optional - for logged-in users)
router.get("/history", getChatHistory);

module.exports = router;
