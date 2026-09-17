# Grandel - Troubleshooting & Known Issues Guide

This document captures real engineering problems encountered during the design, implementation, and deployment of the Grandel platform, complete with diagnostic investigations, root causes, and definitive resolutions.

---

## 📑 Issue Index
1. [Firebase Authentication UID Mismatch & Account Linking](#1-firebase-authentication-uid-mismatch--account-linking)
2. [Cross-Origin Session Cookie Drop (Render + Vercel)](#2-cross-origin-session-cookie-drop-render--vercel)
3. [QR Scanner Camera Initialization Failure on Mobile LAN](#3-qr-scanner-camera-initialization-failure-on-mobile-lan)
4. [MongoDB Geospatial Query Failure ($near without 2dsphere Index)](#4-mongodb-geospatial-query-failure-near-without-2dsphere-index)
5. [Vercel SPA Rewrite Breaking Static CSS/JS Assets](#5-vercel-spa-rewrite-breaking-static-cssjs-assets)
6. [Razorpay Token Amount Discrepancy (Paise vs Rupees)](#6-razorpay-token-amount-discrepancy-paise-vs-rupees)
7. [Render Free-Tier Cold Starts & 15-Minute Inactivity Spindown](#7-render-free-tier-cold-starts--15-minute-inactivity-spindown)
8. [Booking Blocked When n8n Webhook Was Unreachable](#8-booking-blocked-when-n8n-webhook-was-unreachable)
9. [Joi Validation Error on Multipart Form Data](#9-joi-validation-error-on-multipart-form-data)
10. [Review Recalculation NaN on Last Review Deletion](#10-review-recalculation-nan-on-last-review-deletion)

---

## 1. Firebase Authentication UID Mismatch & Account Linking

### Problem
Users who initially registered with email and password were unable to log in when using "Continue with Google" with the same email address. The system attempted to create a duplicate user and threw a duplicate key error on MongoDB (`E11000 duplicate key error collection: users index: email_1`).

### Investigation
Inspected `Backend/controllers/users.js` and `Backend/routes/auth.js`. The registration logic was indexing users strictly by `firebaseUid`. When a user authenticated via Google OAuth, Firebase generated a new UID that didn't match the existing database record for that email.

### Root Cause
The database lacked an automatic account reconciliation step between Firebase social UIDs and existing email records.

### Resolution
Updated `routes/auth.js` (`/firebase-login`) with a three-step account lookup:
```javascript
// 1. Check if user exists by Firebase UID
let user = await User.findOne({ firebaseUid: uid });

// 2. If not found, link existing account by verified email
if (!user) {
  user = await User.findOne({ email: email });
  if (user) {
    user.firebaseUid = uid;
    await user.save();
  }
}

// 3. Only create a brand new account if neither exists
if (!user) {
  user = new User({ username, email, firebaseUid: uid });
  await user.save();
}
```

---

## 2. Cross-Origin Session Cookie Drop (Render + Vercel)

### Problem
After successfully logging in, subsequent API requests from the frontend (`https://grandel.vercel.app`) to the backend (`https://grandel.onrender.com`) resulted in `401 Unauthorized`. The user appeared logged out immediately after refreshing.

### Investigation
Inspected network requests in DevTools. The browser set-cookie header was flagged with a warning:
> "This Set-Cookie header didn't specify a 'SameSite' attribute and was blocked because it came from a cross-site response."

### Root Cause
Default cookies without `SameSite=None` and `Secure=true` are blocked by modern browsers on cross-domain setups (e.g., `.vercel.app` requesting `.onrender.com`). Furthermore, because Render sits behind reverse proxies, Express did not recognize incoming connections as secure HTTPS.

### Resolution
1. Added `app.set("trust proxy", 1);` in `Backend/app.js`.
2. Hardened session configuration in `Backend/app.js`:
```javascript
const isProd = process.env.NODE_ENV === 'production';

app.use(session({
  store: MongoStore.create({ mongoUrl: dburl, crypto: { secret: process.env.SECRET } }),
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  proxy: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProd || process.env.FORCE_SECURE_COOKIES === 'true',
    sameSite: isProd ? 'none' : 'lax',
  },
}));
```

---

## 3. QR Scanner Camera Initialization Failure on Mobile LAN

### Problem
When testing the check-in QR scanner (`HostScanner.jsx`) on a mobile phone connected to the same Wi-Fi network (`http://192.168.1.15:5173`), the camera failed to open with error:
`NotAllowedError: Camera access is only supported over secure contexts (HTTPS) or localhost`.

### Investigation
Inspected browser security specifications for WebRTC / MediaDevices APIs (`navigator.mediaDevices.getUserMedia`).

### Root Cause
Modern browsers (Chrome, Safari) strictly disable camera and microphone access on insecure origins (`http://`), granting exceptions only to `http://localhost` and `http://127.0.0.1`.

### Resolution
1. Configured local Vite dev server with `@vitejs/plugin-basic-ssl` or used ngrok/tunneling for secure mobile hardware testing.
2. In `frontend/src/config/axios.js`, added intelligent IP detection so mobile connections automatically routed to the correct backend host:
```javascript
const hostname = window.location.hostname;
const isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
if (isIP) {
  baseURL = `http://${hostname}:8080`;
}
```

---

## 4. MongoDB Geospatial Query Failure ($near without 2dsphere Index)

### Problem
Performing a search by user coordinates or selecting "Current Location" caused the backend to crash with error:
`MongoServerError: unable to find index for $geoNear query`.

### Investigation
Inspected `Backend/models/listing.js` and MongoDB Atlas indexes. While `listingSchema.index({ geometry: "2dsphere" })` was declared in schema code, MongoDB had not built the index on the remote Atlas collection after new seed documents were loaded.

### Root Cause
Mongoose does not automatically build indexes in production unless explicitly commanded or when connection sync is enforced.

### Resolution
Added explicit index synchronization during database initialization in `Backend/app.js`:
```javascript
main().then(async () => {
  console.log("Connected to DB");
  try {
    await Listing.syncIndexes();
    console.log("Geospatial 2dsphere indexes synchronized.");
  } catch (indexErr) {
    console.error("Index Sync Warning:", indexErr.message);
  }
});
```

---

## 5. Vercel SPA Rewrite Breaking Static CSS/JS Assets

### Problem
When deploying the frontend to Vercel, visiting deep routes (e.g. `/listings/6640c49...`) and refreshing resulted in a blank screen with console errors:
`Uncaught SyntaxError: Unexpected token '<'` for bundle JS and CSS files.

### Investigation
Examined `vercel.json` rewrites and commit history (`fix: vercel.json rewrite not intercepting static CSS/assets`). The SPA rewrite rule was redirecting requests for `/assets/index.js` to `/index.html`.

### Root Cause
A catch-all rewrite rule `[{ "source": "/(.*)", "destination": "/index.html" }]` was matching static files before they could be served from the Vite build directory.

### Resolution
Refined `vercel.json` to exclude static assets or configured clean filesystem matching so that existing files in `/assets/` are served with static MIME types before fallback:
```json
{
  "rewrites": [
    {
      "source": "/((?!assets/|images/|.*\\..*).*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 6. Razorpay Token Amount Discrepancy (Paise vs Rupees)

### Problem
Razorpay checkout popup displayed amounts 100x smaller than intended (e.g., charging ₹47 instead of ₹4,700 for the 20% deposit).

### Investigation
Traced data flow in `controllers/bookings.js` (`initiateBooking`). The calculated token amount was `4720` (in Rupees).

### Root Cause
Razorpay API expects payment amounts in the smallest currency sub-unit (**paise** for INR). Passing `4720` directly meant 4,720 paise (₹47.20).

### Resolution
Multiplied the integer amount by 100 when creating the Razorpay order:
```javascript
const tokenAmount = Math.round(finalTotalPrice * 0.20);
const options = {
  amount: tokenAmount * 100, // Converted to paise
  currency: "INR",
  receipt: `receipt_${Date.now()}`
};
const order = await razorpay.orders.create(options);
```

---

## 7. Render Free-Tier Cold Starts & 15-Minute Inactivity Spindown

### Problem
When users loaded Grandel after a period of inactivity, API calls hung for 50-60 seconds before responding, causing frontend splash timeouts.

### Investigation
Render's free tier automatically spins down web services after 15 minutes of zero incoming HTTP traffic.

### Root Cause
Platform hosting resource hibernation on inactivity.

### Resolution
Implemented a server-side self-ping keep-alive heartbeat in `Backend/app.js`:
```javascript
if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
  const selfUrl = `${process.env.RENDER_EXTERNAL_URL}/api/health`;
  // Ping every 14 minutes to prevent Render 15-minute idle spin down
  setInterval(async () => {
    try {
      const response = await fetch(selfUrl);
      console.log(`[KEEP-ALIVE] Ping status: ${response.status}`);
    } catch (err) {
      console.error(`[KEEP-ALIVE] Ping failed: ${err.message}`);
    }
  }, 14 * 60 * 1000);
}
```

---

## 8. Booking Blocked When n8n Webhook Was Unreachable

### Problem
When the n8n automation server was stopped or experiencing network lag, guests clicking "Confirm Booking" received a `500 Internal Server Error`, despite their payment having succeeded on Razorpay.

### Investigation
Inspected `Backend/controllers/bookings.js` (`confirmBooking`). The `await n8nService.sendBookingConfirmation(...)` was executing directly inside the main transaction block without an isolated catch handler.

### Root Cause
An auxiliary notification failure was propagating upwards and aborting the primary booking confirmation response.

### Resolution
Isolated all external notification calls in independent `try/catch` blocks so webhook failures log warnings but do not fail the customer's reservation:
```javascript
/* ================= NOTIFICATIONS (NON-BLOCKING) ================= */
try {
  if (listing.Owner && listing.Owner.email) {
    await n8nService.sendBookingConfirmation(listing.Owner.email, bookingData, 'host_notification');
  }
} catch (n8nError) {
  console.error("n8n Notification Error (Logged, Non-fatal):", n8nError.message);
}
// Booking confirmation still succeeds
res.json({ success: true, message: "Booking confirmed!", bookingId: booking._id });
```

---

## 9. Joi Validation Error on Multipart Form Data

### Problem
Submitting the property creation form with images returned `400 Bad Request: "listing" is required`, even though all form fields were filled.

### Investigation
Logged `req.body` in `middleware.js` before validation. Because fields were sent as `FormData` using bracket keys (e.g. `listing[title]`, `listing[price]`), Express received flattened string keys instead of a nested JavaScript object.

### Root Cause
Joi schema expected `{ listing: { title, price } }`, but received `{ 'listing[title]': 'Villa', 'listing[price]': '5000' }`.

### Resolution
Built a custom recursive `unflattenBody` pre-processor in `Backend/middleware.js`:
```javascript
const unflattenBody = (body) => {
  const newBody = {};
  for (const key in body) {
    let val = body[key];
    if (val === "true") val = true;
    if (val === "false") val = false;
    set(newBody, key, val);
  }
  return newBody;
};

module.exports.validateListing = (req, res, next) => {
  const body = unflattenBody(req.body);
  const { error } = listingSchema.validate(body);
  if (error) throw new ExpressError(error.details.map(el => el.message).join(","), 400);
  req.body = body;
  next();
};
```

---

## 10. Review Recalculation NaN on Last Review Deletion

### Problem
When the only review on a listing was deleted, the property's `avgRating` became `null` / `NaN`, breaking frontend rating badge rendering.

### Investigation
Inspected `controllers/reviews.js` (`destroyReview`). The formula divided total stars by `listing.reviews.length`. When the last review was removed, `reviews.length` was 0, resulting in `0 / 0 = NaN`.

### Root Cause
Lack of a zero-reviews boundary condition check.

### Resolution
Added an explicit check in `controllers/reviews.js`:
```javascript
if (listing.reviews.length === 0) {
  listing.avgRating = 0;
  listing.ratingCount = 0;
} else {
  const total = listing.reviews.reduce((sum, r) => sum + r.rating, 0);
  listing.ratingCount = listing.reviews.length;
  listing.avgRating = total / listing.ratingCount;
}
await listing.save();
```
