# Grandel - Test Cases Specification

This catalog documents the functional and non-functional test cases for Grandel.

---

## 📑 Test Suites
- [Suite 1: Authentication & Authorization (TC-01 to TC-05)](#suite-1-authentication--authorization)
- [Suite 2: Property Listings & Discovery (TC-06 to TC-09)](#suite-2-property-listings--discovery)
- [Suite 3: Booking Engine & Pricing (TC-10 to TC-13)](#suite-3-booking-engine--pricing)
- [Suite 4: Payments & Cryptography (TC-14 to TC-16)](#suite-4-payments--cryptography)
- [Suite 5: QR Invoicing & Verification (TC-17 to TC-19)](#suite-5-qr-invoicing--verification)
- [Suite 6: Host Operations & Reviews (TC-20 to TC-22)](#suite-6-host-operations--reviews)
- [Suite 7: AI Travel Assistant & Chatbot (TC-23 to TC-25)](#suite-7-ai-travel-assistant--chatbot)

---

## Suite 1: Authentication & Authorization

### TC-01: User Registration via Email & Password
- **Module**: Auth
- **Preconditions**: User is on `/signup`. Email is not yet registered.
- **Steps**:
  1. Input unique email, username, password, and phone number.
  2. Click "Sign Up".
- **Expected Result**: User document created in MongoDB. Password salted/hashed. Session cookie returned. User redirected to dashboard with `currUser` populated.
- **Status**: Passed ✅

### TC-02: User Registration Duplicate Email Rejection
- **Module**: Auth
- **Preconditions**: Email `john@example.com` already exists in MongoDB.
- **Steps**:
  1. Submit registration with `john@example.com`.
- **Expected Result**: Backend returns `409 Conflict` with message "Email is already registered. Please log in."
- **Status**: Passed ✅

### TC-03: Firebase Social Login (Google OAuth)
- **Module**: Auth
- **Preconditions**: User clicks "Continue with Google".
- **Steps**:
  1. Complete Google popup authentication.
  2. Firebase issues ID Token.
  3. Client posts ID Token to `POST /firebase-login`.
- **Expected Result**: Server verifies token with Firebase Admin SDK, retrieves or links MongoDB user, and sets session cookie.
- **Status**: Passed ✅

### TC-04: Session Persistence Across Page Reloads
- **Module**: Auth
- **Preconditions**: User logged in.
- **Steps**:
  1. Hard refresh the page (`Ctrl + F5`).
  2. Client calls `GET /current-user`.
- **Expected Result**: Response returns `200 OK` with user profile. Navbar shows logged-in state without flicker.
- **Status**: Passed ✅

### TC-05: Password Reset Token Expiry
- **Module**: Auth
- **Preconditions**: User generated a reset token.
- **Steps**:
  1. Request reset link via `/forgot-password`.
  2. Attempt to use link after 61 minutes.
- **Expected Result**: Server returns `400 Bad Request` with message "Password reset token is invalid or has expired."
- **Status**: Passed ✅

---

## Suite 2: Property Listings & Discovery

### TC-06: Create Property with Multi-Image Upload
- **Module**: Listings
- **Preconditions**: User is logged in as Host.
- **Steps**:
  1. Fill title, category (`mountain`), price (3500), location, and room capacity.
  2. Select 1 main image and 3 gallery images.
  3. Click "Submit Listing".
- **Expected Result**: Multer uploads files to Cloudinary. Listing saved in MongoDB with Cloudinary URLs. Redirects to `/listings`.
- **Status**: Passed ✅

### TC-07: Geospatial Search via Coordinates ($near)
- **Module**: Search
- **Preconditions**: Database contains listings in Goa [73.8567, 15.2993] and Delhi [77.1025, 28.7041].
- **Steps**:
  1. Query `GET /listings?lat=15.2993&lng=73.8567`.
- **Expected Result**: Returns Goa listings sorted by spherical distance within 50km; Delhi listings are omitted.
- **Status**: Passed ✅

### TC-08: Cascade Deletion of Listing Reviews & Bookings
- **Module**: Listings
- **Preconditions**: Listing `L1` has 2 reviews and 1 booking.
- **Steps**:
  1. Listing owner sends `DELETE /listings/L1`.
- **Expected Result**: `L1` document deleted. Mongoose `findOneAndDelete` post-hook deletes the 2 reviews and 1 booking.
- **Status**: Passed ✅

### TC-09: Category Filtering Tab
- **Module**: Listings
- **Preconditions**: User clicks "Trending" category icon on home feed.
- **Steps**:
  1. Click category tab.
- **Expected Result**: `GET /listings/filter?category=trending` returns only listings with matching category.
- **Status**: Passed ✅

---

## Suite 3: Booking Engine & Pricing

### TC-10: Booking Date Collision Prevention
- **Module**: Booking
- **Preconditions**: Property booked from Oct 10 to Oct 15 (`confirmed`).
- **Steps**:
  1. Second user requests booking from Oct 12 to Oct 16.
- **Expected Result**: Overlap detected. Date is shown as unavailable; booking initiation is rejected.
- **Status**: Passed ✅

### TC-11: Price Calculation with Extra Guests and Pets
- **Module**: Booking
- **Preconditions**: Price = ₹2000/night, 2 nights, 4 paying guests (freeGuests: 3, charge: ₹500), 1 pet (charge: ₹300).
- **Steps**:
  1. Calculate pricing:
     - Base: $2 \times 2000 = ₹4000$
     - Extra guest: $(4 - 3) \times 500 \times 2 = ₹1000$
     - Pet: $1 \times 300 \times 2 = ₹600$
     - Subtotal: $4000 + 1000 + 600 = ₹5600$
     - GST (18%): $5600 \times 0.18 = ₹1008$
     - Total: ₹6608
- **Expected Result**: Server computes subtotal: ₹5600, GST: ₹1008, Total: ₹6608.
- **Status**: Passed ✅

### TC-12: Daily Early Bird 20% Discount
- **Module**: Booking
- **Preconditions**: Property has 20% discount configured. No bookings exist for today.
- **Steps**:
  1. First user books today.
- **Expected Result**: Server applies 20% discount on subtotal and records `discountApplied: true`. Second booking on same day pays full price.
- **Status**: Passed ✅

### TC-13: Guest Booking Cancellation
- **Module**: Booking
- **Preconditions**: Guest has active booking.
- **Steps**:
  1. Guest clicks "Cancel Booking" on `/profile`.
- **Expected Result**: `DELETE /bookings/:id` removes booking record; dates become available immediately.
- **Status**: Passed ✅

---

## Suite 4: Payments & Cryptography

### TC-14: Razorpay 20% Token Amount Calculation
- **Module**: Payments
- **Preconditions**: Total booking price is ₹10,000.
- **Steps**:
  1. Call `POST /listings/:id/book/initiate`.
- **Expected Result**: Razorpay order created with `amount: 200000` (paise equivalent of ₹2000 = 20%).
- **Status**: Passed ✅

### TC-15: HMAC-SHA256 Signature Verification Success
- **Module**: Payments
- **Preconditions**: Valid `order_id` and `payment_id` with authentic signature generated by Razorpay.
- **Steps**:
  1. Send payload to `POST /listings/:id/book/verify`.
- **Expected Result**: Signature matches `crypto.createHmac("sha256", secret).update(order_id + "|" + payment_id).digest("hex")`. Booking saved with `payment.status: 'paid'`.
- **Status**: Passed ✅

### TC-16: Tampered Payment Signature Rejection
- **Module**: Payments
- **Preconditions**: Attacker alters `razorpay_signature` in request payload.
- **Steps**:
  1. Submit tampered signature to verify route.
- **Expected Result**: Backend returns `400 Bad Request` with message "Payment verification failed". No booking is created.
- **Status**: Passed ✅

---

## Suite 5: QR Invoicing & Verification

### TC-17: Branded PDF Invoice Generation with Barcode
- **Module**: Invoicing
- **Preconditions**: Confirmed booking exists.
- **Steps**:
  1. Call `GET /bookings/:id/pdf`.
- **Expected Result**: Streams valid PDF document with grandel logo, financial breakdown, token paid, balance due, and scannable `bwip-js` QR barcode.
- **Status**: Passed ✅

### TC-18: Host Camera QR Check-in Success
- **Module**: QR Scanner
- **Preconditions**: Host is logged in and owns the property.
- **Steps**:
  1. Host opens `/profile/host/scanner`.
  2. Scans guest invoice QR code.
- **Expected Result**: Decodes `bookingId`. `GET /bookings/verify/:id` validates ownership and displays guest details, dates, and balance due (80%).
- **Status**: Passed ✅

### TC-19: Unauthorized Host QR Check-in Rejection
- **Module**: QR Scanner
- **Preconditions**: Host B attempts to scan a booking belonging to Host A's property.
- **Steps**:
  1. Host B scans Host A's booking QR code.
- **Expected Result**: Server returns `403 Forbidden` with "Unauthorized: This booking belongs to another property."
- **Status**: Passed ✅

---

## Suite 6: Host Operations & Reviews

### TC-20: Host Dashboard Aggregates Calculation
- **Module**: Host Operations
- **Preconditions**: Host owns 3 listings with 15 total reviews.
- **Steps**:
  1. Load `/profile/host`.
- **Expected Result**: MongoDB aggregation correctly computes total listings, cumulative earnings, pending bookings, and weighted average rating.
- **Status**: Passed ✅

### TC-21: Review Submission & Atomic Rating Update
- **Module**: Reviews
- **Preconditions**: Listing currently has 4.0 rating with 2 reviews.
- **Steps**:
  1. Guest submits 5-star review.
- **Expected Result**: Formula: $((4.0 \times 2) + 5) / 3 = 4.33$. Listing `avgRating` updated to 4.33, `ratingCount` updated to 3. Listing cache flushed.
- **Status**: Passed ✅

### TC-22: Prevent Non-Author from Deleting Review
- **Module**: Reviews
- **Preconditions**: Review authored by User A.
- **Steps**:
  1. User B sends `DELETE /listings/:id/reviews/:reviewId`.
- **Expected Result**: Returns `403 Forbidden` ("You did not write this review").
- **Status**: Passed ✅

---

## Suite 7: AI Travel Assistant & Chatbot

### TC-23: Live Inventory Grounding in Chat Responses
- **Module**: Chatbot
- **Preconditions**: User asks "What stays do you have in Goa?".
- **Steps**:
  1. Send message to `POST /api/chatbot/chat`.
- **Expected Result**: Groq Llama-3 retrieves live Goa properties from database context, lists prices, and appends `[RESERVE:{"id":...}]` action buttons.
- **Status**: Passed ✅

### TC-24: Graceful Handling for Missing Locations
- **Module**: Chatbot
- **Preconditions**: User asks for stays in a city with zero current inventory (e.g., Tokyo).
- **Steps**:
  1. Send query "Show me hotels in Tokyo".
- **Expected Result**: Bot responds: "We don't have listings in Tokyo yet, but here are our top-rated properties elsewhere!" and recommends available platform stays without hallucinating fake Tokyo hotels.
- **Status**: Passed ✅

### TC-25: Chatbot Rate Limiting
- **Module**: Chatbot
- **Preconditions**: Single IP sends 11 chat requests within 60 seconds.
- **Steps**:
  1. Send rapid requests in succession.
- **Expected Result**: 11th request receives HTTP 429: "You're sending too many messages. Please take a breather! 🧘".
- **Status**: Passed ✅
