# Feature: AI Travel Assistant & Chatbot

## 1. Purpose
Provides an intelligent conversational assistant embedded directly in Grandel. Unlike generic FAQ bots, the Grandel AI Assistant is dynamically grounded with live database hotel inventory and real-time user context, recommending properties with live prices and ratings and appending structured actionable buttons that allow guests to reserve stays straight from the chat interface.

---

## 2. Workflow
1. **User Inquiry**:
   - Authenticated guest opens the floating chatbot widget and types a message (e.g., "Find me a beachfront villa in Goa").
2. **Context Compilation (Grounding)**:
   - Backend controller `controllers/chatbot.js` queries MongoDB:
     - Fetches all active properties with title, location, country, price, category, avgRating, and capacity.
     - Fetches current user's profile and most recent booking status.
   - Formats this data into an authoritative, hallucination-resistant `systemPrompt`.
3. **Groq Llama-3 Inference**:
   - Calls Groq Cloud API running `llama-3.3-70b-versatile` (ultra-low latency, temperature 0.6).
   - Injects structured format requirements:
     `[RESERVE:{"id":"...","title":"...","price":...,"maxRooms":...,"maxGuests":...}]`
4. **Client Render & Interaction**:
   - The React frontend parses the incoming reply.
   - Converts the `[RESERVE:...]` markup into an interactive gradient "Reserve Now" button.
   - Clicking the button routes directly to `/listings/:id/book` with pre-filled parameters.

---

## 3. Components Involved
- `frontend/src/components/Chatbot.jsx`: Floating widget, message history, markdown renderer, and reserve button parser.
- `frontend/src/components/Chatbot.css`: Glassmorphism chat drawer styling.
- `Backend/controllers/chatbot.js`: Real-time data gathering, prompt engineering, and Groq SDK caller.
- `Backend/routes/chatbot.js`: Endpoint definition with IP rate limiting.

---

## 4. APIs Involved
- `POST /api/chatbot/chat`: Processes user messages and returns AI replies (`isLoggedIn`).
- `GET /api/chatbot/history`: Reserved endpoint for persistent chat histories.

---

## 5. Database Collections
- **`listings`**: Live inventory data injected into prompt.
- **`bookings`**: Recent booking status injected to answer "Where is my booking?".
- **`users`**: User identity and greeting context.

---

## 6. External Services
- **Groq Cloud SDK (`groq-sdk`)**: High-speed inference engine hosting `llama-3.3-70b-versatile`.

---

## 7. Important Implementation Details
- **Strict Anti-Hallucination Protocol**:
  The system prompt strictly instructs the LLM:
  > "Only discuss listings from the provided data. Never say 'I don't see listings' if they are present in the list. If no listings match the requested location exactly, explicitly state that we don't have listings in that city yet, and recommend top-rated alternatives from the list."
- **Promotional Grounding**: The bot is instructed to mention the 20% Early Bird discount whenever a property qualifies as the first booking of the day.
- **Rate Limiting**: Protected with `chatLimiter` (10 requests per minute per IP) to guard against spam and quota exhaustion.

---

## 8. Known Limitations
- Message history is preserved during the active client browser session; long-term database storage across sessions can be enabled in a future update.
