# Grandel - REST API Documentation

This document serves as the complete technical specification of Grandel's REST API endpoints. It is optimized for developer onboarding, client integration, and AI-assisted query routing.

---

## 📑 Endpoint Categories
- [1. Authentication & Session Management](#1-authentication--session-management)
- [2. Listings & Properties](#2-listings--properties)
- [3. Bookings & Reservations](#3-bookings--reservations)
- [4. QR Verification & Check-in](#4-qr-verification--check-in)
- [5. Reviews & Ratings](#5-reviews--ratings)
- [6. User & Host Operations](#6-user--host-operations)
- [7. AI Chatbot](#7-ai-chatbot)
- [8. System Health & Utilities](#8-system-health--utilities)

---

## 1. Authentication & Session Management

### `POST /signup`
- **Purpose**: Register a new user account linked with Firebase.
- **Authentication**: None (Public).
- **Request Body**:
  ```json
  {
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
    "username": "johndoe",
    "phone": "+919876543210" // optional
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "user": {
      "_id": "6640c4921f42a15c1e091b22",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "avatar": { "url": "https://...", "filename": "firebase-profile" }
    }
  }
  ```
- **Possible Errors**:
  - `409 Conflict`: Username or Email already exists.
  - `401 / 500`: Invalid Firebase token or server error.

---

### `POST /login`
- **Purpose**: Authenticate an existing user via Firebase ID token or password credentials.
- **Authentication**: None (Public).
- **Request Body**:
  ```json
  {
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
    "email": "john@example.com",
    "password": "mySecurePassword123" // optional if idToken is supplied
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Welcome back!",
    "user": {
      "_id": "6640c4921f42a15c1e091b22",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    }
  }
  ```
- **Possible Errors**:
  - `404 Not Found`: User not found in database.
  - `401 Unauthorized`: Invalid password or expired token.

---

### `POST /firebase-login`
- **Purpose**: Synchronize Firebase Social login (Google OAuth) with MongoDB.
- **Authentication**: Bearer token (`Authorization: Bearer <idToken>`).
- **Request Headers**:
  ```http
  Authorization: Bearer <firebase_id_token>
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true
  }
  ```
- **Possible Errors**:
  - `401 Unauthorized`: Missing or invalid Bearer token.
  - `500 Internal Server Error`: Database sync failed.

---

### `GET /current-user`
- **Purpose**: Fetch the currently authenticated user from session.
- **Authentication**: None (Returns `null` if unauthenticated).
- **Response (`200 OK`)**:
  ```json
  {
    "user": {
      "_id": "6640c4921f42a15c1e091b22",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "avatar": { "url": "https://..." }
    }
  }
  ```

---

### `GET /logout`
- **Purpose**: Terminate session, destroy cookie, and clear MongoStore record.
- **Authentication**: None.
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

### `POST /forgot-password`
- **Purpose**: Generate a 1-hour secure password reset token and dispatch direct SMTP email.
- **Authentication**: None.
- **Request Body**:
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Password reset link sent to your email"
  }
  ```
- **Possible Errors**:
  - `404 Not Found`: No account associated with this email address.

---

### `POST /reset-password/:token`
- **Purpose**: Set a new password using a valid cryptographic token.
- **Authentication**: Token in route parameter.
- **Request Body**:
  ```json
  {
    "password": "NewSecurePassword123"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Password has been successfully reset. Please log in."
  }
  ```
- **Possible Errors**:
  - `400 Bad Request`: Token is invalid or has expired.

---

## 2. Listings & Properties

### `GET /listings`
- **Purpose**: Retrieve listings with faceted search, pagination, geospatial proximity, and date filtering.
- **Authentication**: None (Public).
- **Query Parameters**:
  - `q` (string): Search query (City, state, or country name).
  - `category` (string): Filter by enum category (`beach`, `mountain`, `urban`, etc.).
  - `lat`, `lng` (float): Center coordinates for 50km geospatial `$near` query.
  - `startDate`, `endDate` (YYYY-MM-DD): Filter out properties with overlapping bookings.
  - `rooms`, `guests` (number): Capacity thresholds.
  - `page` (number, default: 1), `limit` (number, default: 12).
- **Response (`200 OK`)**:
  ```json
  {
    "allListings": [
      {
        "_id": "6640c4921f42a15c1e091a11",
        "title": "Seaside Villa",
        "price": 4500,
        "location": "Goa",
        "country": "India",
        "avgRating": 4.8,
        "ratingCount": 12,
        "discount": 20,
        "image": { "url": "https://res.cloudinary.com/..." }
      }
    ],
    "totalPages": 3,
    "currentPage": 1,
    "totalListings": 32
  }
  ```

---

### `POST /listings`
- **Purpose**: Create a new property listing with image uploads.
- **Authentication**: Logged-in User.
- **Content-Type**: `multipart/form-data`.
- **Form Fields**:
  - `listing[title]`: string
  - `listing[description]`: string
  - `listing[price]`: number
  - `listing[location]`: string
  - `listing[country]`: string
  - `listing[category]`: enum
  - `listing[numRooms]`: number
  - `listing[guestsPerRoom]`: number
  - `listing[petsAllowed]`: boolean
  - `listing[petChargePerNight]`: number
  - `listing[discount]`: number (0-100)
  - `listing[image]`: File (Main cover image)
  - `listing[images]`: Array of Files (Up to 5 gallery images)
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "New Listing Created!",
    "id": "6640c4921f42a15c1e091a11"
  }
  ```
- **Possible Errors**:
  - `401 Unauthorized`: Not logged in.
  - `400 Bad Request`: Form validation or Multer upload failure.

---

### `GET /listings/:id`
- **Purpose**: Fetch complete details for a single property, populated with reviews, host profile, and AI travel companions.
- **Authentication**: None (Public).
- **Response (`200 OK`)**:
  ```json
  {
    "listing": {
      "_id": "6640c4921f42a15c1e091a11",
      "title": "Seaside Villa",
      "description": "Luxurious stay by the ocean",
      "price": 4500,
      "location": "Goa",
      "country": "India",
      "geometry": { "type": "Point", "coordinates": [73.8567, 15.2993] },
      "numRooms": 3,
      "guestsPerRoom": 2,
      "petsAllowed": true,
      "petChargePerNight": 300,
      "discount": 20,
      "Owner": {
        "_id": "6640c4921f42a15c1e091b22",
        "username": "janehost",
        "email": "jane@example.com"
      },
      "reviews": [
        {
          "_id": "6640c4921f42a15c1e091c33",
          "rating": 5,
          "comment": "Stunning view and clean rooms!",
          "author": { "username": "alex" }
        }
      ]
    }
  }
  ```
- **Possible Errors**:
  - `404 Not Found`: Listing not found.

---

### `PUT /listings/:id`
- **Purpose**: Update an existing property listing.
- **Authentication**: Logged-in Owner (`isOwner` middleware).
- **Content-Type**: `multipart/form-data`.
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Listing Updated!"
  }
  ```
- **Possible Errors**:
  - `403 Forbidden`: User is not the owner of the listing.

---

### `DELETE /listings/:id`
- **Purpose**: Delete listing and cascade delete its reviews and bookings.
- **Authentication**: Logged-in Owner (`isOwner` middleware).
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Listing Deleted"
  }
  ```

---

## 3. Bookings & Reservations

### `POST /listings/:id/book/initiate`
- **Purpose**: Compute pricing, check daily discounts, and generate a **Razorpay Order for a 20% token deposit**.
- **Authentication**: Logged-in User.
- **Request Body**:
  ```json
  {
    "startDate": "2026-10-10",
    "endDate": "2026-10-14",
    "adults": 2,
    "children": 1,
    "infants": 0,
    "animals": 1
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "order": {
      "id": "order_OD948hflkajs",
      "entity": "order",
      "amount": 472000, // token amount in paise (20% of 23,600)
      "currency": "INR",
      "receipt": "receipt_1740000000"
    },
    "key": "rzp_live_...",
    "tokenAmount": 4720,
    "totalPrice": 23600
  }
  ```
- **Possible Errors**:
  - `400 Bad Request`: Invalid dates (`endDate <= startDate`).
  - `404 Not Found`: Property does not exist.

---

### `POST /listings/:id/book/verify`
- **Purpose**: Validate Razorpay `HMAC-SHA256` signature, save booking in database, and trigger n8n notification webhooks.
- **Authentication**: Logged-in User.
- **Request Body**:
  ```json
  {
    "razorpay_order_id": "order_OD948hflkajs",
    "razorpay_payment_id": "pay_OEjlkfsd897",
    "razorpay_signature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "bookingDetails": {
      "startDate": "2026-10-10",
      "endDate": "2026-10-14",
      "adults": 2,
      "children": 1,
      "infants": 0,
      "animals": 1
    }
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Booking confirmed!",
    "bookingId": "6640d8921f42a15c1e091e99"
  }
  ```
- **Possible Errors**:
  - `400 Bad Request`: Payment signature verification mismatch.

---

### `GET /bookings/:id/pdf`
- **Purpose**: Generate and stream a PDF invoice with an embedded check-in QR barcode.
- **Authentication**: Logged-in User.
- **Headers Returned**:
  ```http
  Content-Type: application/pdf
  Content-Disposition: attachment; filename=booking-6640d8921f42a15c1e091e99.pdf
  ```

---

### `DELETE /bookings/:id`
- **Purpose**: Cancel a booking.
- **Authentication**: Logged-in Guest who booked the stay.
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Booking cancelled"
  }
  ```

---

## 4. QR Verification & Check-in

### `GET /bookings/verify/:id`
- **Purpose**: Verify a guest's check-in QR code at the property reception.
- **Authentication**: Logged-in Property Owner (`Owner.equals(req.user._id)`).
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "booking": {
      "id": "6640d8921f42a15c1e091e99",
      "status": "pending",
      "startDate": "2026-10-10T00:00:00.000Z",
      "endDate": "2026-10-14T00:00:00.000Z",
      "guest": {
        "username": "johndoe",
        "email": "john@example.com",
        "avatar": { "url": "https://..." }
      },
      "listingTitle": "Seaside Villa",
      "totalPrice": 23600,
      "tokenPaid": 4720,
      "balanceDue": 18880,
      "guests": { "adults": 2, "children": 1, "infants": 0, "animals": 1 }
    }
  }
  ```
- **Possible Errors**:
  - `403 Forbidden`: "Unauthorized: This booking belongs to another property." (Host check failure).
  - `404 Not Found`: Booking ID does not exist.

---

## 5. Reviews & Ratings

### `POST /listings/:id/reviews`
- **Purpose**: Submit a rating and review for a listing.
- **Authentication**: Logged-in User.
- **Request Body**:
  ```json
  {
    "review": {
      "rating": 5,
      "comment": "Had an incredible time! Clean, quiet, and friendly host."
    }
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Review created",
    "review": {
      "_id": "6640f1231f42a15c1e092a44",
      "rating": 5,
      "comment": "Had an incredible time!...",
      "author": "6640c4921f42a15c1e091b22"
    }
  }
  ```

---

### `DELETE /listings/:id/reviews/:reviewId`
- **Purpose**: Delete a review and recalculate the listing's average rating.
- **Authentication**: Author of the review (`isAuthor` middleware).
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Review deleted"
  }
  ```

---

## 6. User & Host Operations

### `GET /profile/host`
- **Purpose**: Fetch aggregate host metrics, listed properties, and reservation roster.
- **Authentication**: Logged-in Host (`role === 'host'`).
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "listings": [...],
    "bookings": [...],
    "stats": {
      "totalListings": 4,
      "totalBookings": 18,
      "totalEarnings": 142000,
      "pendingBookings": 2,
      "avgRating": 4.85
    }
  }
  ```

---

### `POST /profile/host/bookings/:id/status`
- **Purpose**: Update booking status (`confirmed`, `completed`, `cancelled`) and trigger n8n guest email workflows.
- **Authentication**: Logged-in Host who owns the property.
- **Request Body**:
  ```json
  {
    "status": "confirmed"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Status updated to confirmed"
  }
  ```

---

## 7. AI Chatbot

### `POST /api/chatbot/chat`
- **Purpose**: Send a message to the Grandel AI Assistant grounded with live database inventory.
- **Authentication**: Logged-in User.
- **Rate Limit**: 10 requests per minute per IP.
- **Request Body**:
  ```json
  {
    "message": "Do you have any beach villas in Goa with a pool?"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "reply": "Yes! We have the gorgeous Seaside Villa in Goa with private pool access for ₹4500/night! ⭐ 4.8 (12 reviews). [RESERVE:{\"id\":\"6640c4921f42a15c1e091a11\",\"title\":\"Seaside Villa\",\"price\":4500,\"maxRooms\":3,\"maxGuests\":6}]"
  }
  ```

---

## 8. System Health & Utilities

### `GET /api/health`
- **Purpose**: Service health-check and Render free-tier keep-alive ping.
- **Response (`200 OK`)**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-17T14:00:00.000Z"
  }
  ```

---

### `GET /api/stats`
- **Purpose**: Global platform statistics (cached with 1-hour TTL).
- **Response (`200 OK`)**:
  ```json
  {
    "totalListings": 128,
    "totalUsers": 1540
  }
  ```
