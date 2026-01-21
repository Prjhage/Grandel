# 🏡 Wanderlust AI Chatbot - Setup & Usage

## 📋 Overview

The Wanderlust Support Chatbot is an AI-powered customer support assistant built with:

- **Groq API** (LLaMA 3.3 70B model)
- **Node.js + Express** backend
- **EJS** frontend integration

## ✅ What's Implemented

### Files Created:

1. **`/controllers/chatbot.js`** - Chatbot logic & Groq API integration
2. **`/routes/chatbot.js`** - API routes for chatbot
3. **`/views/partials/chatbot.ejs`** - Beautiful chat widget UI
4. **`/views/layouts/boilerplate.ejs`** - Updated to include chatbot widget

### Features:

✅ Real-time responses from AI
✅ Context-aware (knows user's recent bookings, available listings)
✅ Mobile responsive design
✅ Typing indicator animation
✅ Message history in chat
✅ Auto-scroll to latest message
✅ Minimize/Maximize toggle
✅ Beautiful gradient UI

## 🚀 Setup Instructions

### 1. Install Dependencies (if not already installed)

```bash
npm install groq-sdk
```

### 2. Update .env file

Make sure you have `GROQ_API_KEY` in your `.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Get your free Groq API key from: https://console.groq.com

### 3. Verify Installation

Your app.js should have:

```javascript
const chatbotRouter = require("./routes/chatbot.js");
// ...
app.use("/api/chatbot", chatbotRouter);
```

Your boilerplate.ejs should include:

```html
<%- include('../partials/chatbot') %>
```

## 🎯 How It Works

### Backend Flow:

1. User sends message via chatbot UI
2. **POST** request to `/api/chatbot/chat`
3. Controller gathers context:
   - Fetches available listings (max 20)
   - Gets user's recent booking (if logged in)
   - Gets user info
4. Creates system prompt with all context
5. Calls Groq API with Llama-3.3-70B model
6. Returns AI response to frontend

### Frontend Flow:

1. User types message in chat input
2. Message added to UI immediately
3. Typing indicator shown
4. Fetch request sent to backend
5. Bot response received and displayed
6. Chat scrolls to latest message

## 🗣️ What the Chatbot Can Help With

- ✅ Find accommodations by location/category
- ✅ Get booking status
- ✅ Check-in/Check-out dates
- ✅ Amenities information
- ✅ Cancellation inquiries
- ✅ Price & availability
- ✅ Travel recommendations
- ✅ General customer support

## 📱 Chat Widget Features

### User Interface:

- **Minimize/Maximize**: Click the 💬 button to toggle
- **Message Input**: Type and press Enter or click Send
- **Auto-scroll**: Chat auto-scrolls to newest messages
- **Mobile Responsive**: Full-screen on mobile devices
- **Typing Indicator**: Shows when bot is processing

### Styling:

- Gradient purple header (#667eea to #764ba2)
- Smooth animations
- Custom scrollbar
- Dark/Light mode compatible

## 🔧 Customization

### Change Chat Widget Colors

In `/views/partials/chatbot.ejs`, find:

```css
.chatbot-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Change Welcome Message

In chatbot.ejs, update:

```html
<p>👋 Hi! I'm your Wanderlust Assistant. Ask me anything...</p>
```

### Adjust Bot Personality

In `/controllers/chatbot.js`, modify the `systemPrompt`:

```javascript
const systemPrompt = `
  You are 'Wanderlust Assistant' 🏡, a friendly and helpful...
  // Customize tone, language, rules here
`;
```

### Change Model or Temperature

```javascript
const chatCompletion = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile", // Change model here
  temperature: 0.7, // Lower = more precise, Higher = more creative
  max_tokens: 400, // Max response length
});
```

## 🐛 Troubleshooting

### Issue: "GROQ_API_KEY is not defined"

**Solution**: Add API key to `.env` file

```env
GROQ_API_KEY=gsk_your_key_here
```

### Issue: Chatbot not showing up

**Solution**: Verify boilerplate.ejs includes:

```html
<%- include('../partials/chatbot') %>
```

### Issue: 500 error when sending message

**Solution**:

- Check browser console for errors
- Verify Groq API key is valid
- Check network tab for response errors
- Ensure listings exist in database

### Issue: Slow response time

**Note**: First request might take 2-3 seconds (cold start). Subsequent requests are faster.

## 📊 API Endpoint

### POST /api/chatbot/chat

**Request:**

```json
{
  "message": "Where can I stay in Goa?"
}
```

**Response:**

```json
{
  "reply": "You can check out these beautiful properties in Goa! We have beachfront villas, houseboat stays, and cozy cottages. What's your budget and preferred check-in date? 🏖️"
}
```

## 🔮 Future Enhancements

Possible additions:

- [ ] Chat history storage (MongoDB)
- [ ] User feedback on responses
- [ ] Multi-language support
- [ ] Quick action buttons
- [ ] Booking directly from chatbot
- [ ] Sentiment analysis
- [ ] Integration with support tickets

## 📝 Notes

- Chatbot requires internet connection (calls Groq API)
- Free tier of Groq has rate limits (~100-200 requests/day)
- Responses are in English
- User data is only fetched for context (not stored in chat)
- Mobile view takes full screen for better UX

## 🎉 You're All Set!

The chatbot is now live on your website! 🚀

For questions about Groq API: https://console.groq.com/docs/
For support: Check your backend logs for errors
