# Grandel - AI-Powered Hotel Booking Platform

Grandel is a modern, full-stack travel booking application designed to provide users with a seamless experience for finding and booking unique stays. It combines powerful search capabilities with AI-driven travel assistance.

## 🚀 Key Features

-   **Advanced Stay Search**: Discover unique accommodations using a map-integrated search interface powered by Leaflet.
-   **AI Travel Assistant**: Integrated chatbot powered by Google Gemini/Groq for personalized travel recommendations and assistance.
-   **Secure Booking System**: Complete booking workflow with Razorpay payment gateway integration.
-   **Host Dashboard**: Manage property listings, bookings, and reviews in a comprehensive host interface.
-   **Secure Authentication**: Multi-layered security using Passport.js for local auth and Firebase for social/cloud identity.
-   **Dynamic Media Management**: Image uploads and storage handled efficiently through Cloudinary.
-   **PDF Invoicing**: Automated receipt generation for successful bookings.

## 🛠️ Tech Stack

### Frontend
-   **Framework**: [React](https://reactjs.org/) (Vite)
-   **Styling**: [Bootstrap 5](https://getbootstrap.com/), CSS
-   **Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
-   **API Client**: [Axios](https://axios-http.com/)
-   **Routing**: [React Router v7](https://reactrouter.com/)

### Backend
-   **Runtime**: [Node.js](https://nodejs.org/) (v22+)
-   **Framework**: [Express.js](https://expressjs.com/)
-   **Database**: [MongoDB](https://www.mongodb.com/) (via Mongoose)
-   **AI Engines**: [Google Generative AI](https://ai.google.dev/), [Groq SDK](https://groq.ai/)
-   **Payment Gateway**: [Razorpay](https://razorpay.com/)
-   **Security**: [Helmet](https://helmetjs.github.io/), [Express-rate-limit](https://github.com/nfriedly/express-rate-limit), [HPP](https://github.com/ictv/hpp)
-   **Storage**: [Cloudinary](https://cloudinary.com/)
  
## ScreenShots
### Home Page 
<img width="1906" height="910" alt="Screenshot 2026-02-19 145139" src="https://github.com/user-attachments/assets/13ab7186-6d7b-4f9d-9925-68f9cc724598" />

### Listings Page
<img width="1906" height="910" alt="image" src="https://github.com/user-attachments/assets/903e82a0-2f90-4591-ad6d-b8bf8acf36cc" />

### Profile Page
<img width="1906" height="910" alt="image" src="https://github.com/user-attachments/assets/1507071e-5e0d-4d89-9df9-9a1aa4efeee3" />

### Show Listing Page
<img width="1906" height="910" alt="image" src="https://github.com/user-attachments/assets/63b05274-4f22-4bfa-b384-787c2b251b8b" />

## User WorkFlow Diagram
<img width="600" height="900" alt="user workflow diagram" src="https://github.com/user-attachments/assets/42c16143-ff71-4c87-974b-0bdd7e2b70b2" />

## 📂 Project Structure

```text
Grandel/
├── Backend/                # Node/Express server
│   ├── config/             # Database and API configurations
│   ├── controllers/        # Business logic for routes
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API endpoints
│   ├── services/           # External service integrations (AI, Email, etc.)
│   └── app.js              # Server entry point
├── frontend/               # React/Vite application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application views/screens
│   │   ├── config/         # Frontend configurations
│   │   └── App.jsx         # Main application component
└── render.yaml             # Deployment configuration
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v22 or higher)
- MongoDB account (Atlas or Local)
- API Keys for: Cloudinary, Razorpay, Google AI, and Firebase

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your credentials:
   ```env
   # Example .env
   MONGODB_URI=your_mongodb_uri
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_KEY=your_key
   CLOUDINARY_SECRET=your_secret
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   GEMINI_API_KEY=your_gemini_api_key
   SECRET=your_session_secret
   ```
4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   VITE_FIREBASE_API_KEY=your_firebase_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

