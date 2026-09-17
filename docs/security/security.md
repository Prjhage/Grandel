# Grandel - Security Architecture & Implementation Guide

This document details the actual security controls, cryptographic protections, and threat mitigations implemented across the Grandel platform.

---

## 📑 Security Controls Index
1. [Authentication & Token Verification](#1-authentication--token-verification)
2. [Authorization & Role-Based Access Control (RBAC)](#2-authorization--role-based-access-control-rbac)
3. [Password, Secret & PII Handling](#3-password-secret--pii-handling)
4. [Session Hardening & Cross-Origin Cookies](#4-session-hardening--cross-origin-cookies)
5. [Network & HTTP Header Protection](#5-network--http-header-protection)
6. [Injection Defense & Parameter Sanitation](#6-injection-defense--parameter-sanitation)
7. [API Rate Limiting & Denial-of-Service Defense](#7-api-rate-limiting--denial-of-service-defense)
8. [File Upload & Cloud Storage Security](#8-file-upload--cloud-storage-security)
9. [Payment Integrity & Cryptographic Signatures](#9-payment-integrity--cryptographic-signatures)
10. [Hardware & QR Verification Security](#10-hardware--qr-verification-security)

---

## 1. Authentication & Token Verification

Grandel uses a hybrid identity management model:
- **Firebase Web SDK**: Handles client-side identity challenges (Google OAuth and Email/Password). Upon success, Firebase generates a cryptographic JSON Web Token (JWT) ID token signed with RS256.
- **Firebase Admin SDK (`config/firebaseAdmin.js`)**: Server-side middleware verifies the token signature against Google's public x509 certs. If the token is forged, expired, or tampered with, the request is immediately aborted with `401 Unauthorized`.
- **Passport.js Session Layer**: After cryptographic token verification, the server initializes a local session via `req.login`, eliminating the need to pass tokens on every subsequent request.

---

## 2. Authorization & Role-Based Access Control (RBAC)

Grandel implements granular route guards in `Backend/middleware.js`:

### Host Privilege Verification
```javascript
if (req.user.role !== "host") {
  return res.status(403).json({ success: false, message: "Host access only" });
}
```
Non-host accounts are strictly blocked from accessing `/profile/host`, updating booking statuses, or viewing property analytics.

### Property Ownership Guard (`isOwner`)
Ensures only the creator of a property can edit, update images, or delete the listing:
```javascript
if (!listing.Owner || !currentUser || !listing.Owner.equals(currentUser._id)) {
  return res.status(403).json({ message: "You do not have permission to do that" });
}
```

### Review Author Guard (`isAuthor`)
Guarantees that only the original author of a review can delete it.

---

## 3. Password, Secret & PII Handling

- **Password Hashing**: Passwords managed through `passport-local-mongoose` are hashed using PBKDF2 with SHA-256 and unique per-user salts.
- **Phone Number Anonymization**: Mobile numbers collected during signup are salted and hashed using `bcrypt.hash(phone, 10)`. The plain text phone number is never stored in the database. Only `phoneLast4` is preserved for user verification.
- **Ephemeral Password Reset Tokens**: Password reset tokens are generated using cryptographically strong pseudo-random bytes (`crypto.randomBytes(20).toString("hex")`) and expire after exactly 1 hour.
- **Environment Variables**: Zero API secrets, private keys, or database connection URIs are hardcoded. All keys are loaded from `.env` via `dotenv` and ignored in `.gitignore`.

---

## 4. Session Hardening & Cross-Origin Cookies

Because Grandel deploys its frontend on Vercel (`grandel.vercel.app`) and backend on Render (`grandel.onrender.com`), sessions are hardened against cross-site leakage and MITM attacks:
- **`httpOnly: true`**: Previews cookie access from client JavaScript, mitigating Cross-Site Scripting (XSS) session theft.
- **`secure: true`**: Enforces transmission strictly over HTTPS encrypted connections.
- **`sameSite: 'none'`**: Permits cross-origin credential sharing between Vercel and Render while relying on CORS and Origin headers for origin validation.
- **`app.set("trust proxy", 1)`**: Configures Express to trust the reverse proxy SSL termination headers provided by Render.

---

## 5. Network & HTTP Header Protection

- **Helmet (`app.use(helmet())`)**: Sets essential HTTP security headers, including `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` (clickjacking defense), and `Strict-Transport-Security` (HSTS).
- **CORS Whitelist**: Strictly configured to reject unauthorized origins:
  ```javascript
  const corsOptions = {
    origin: ['https://grandel.vercel.app', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  };
  ```

---

## 6. Injection Defense & Parameter Sanitation

### Custom NoSQL Operator Sanitizer
Express 5 compatible recursive middleware scans all request vectors (`body`, `params`, `query`) and strips keys starting with `$`:
```javascript
const sanitize = (obj) => {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (key.startsWith('$')) {
        delete obj[key];
      } else {
        sanitize(obj[key]);
      }
    });
  }
};
```
This guarantees that MongoDB operator injection payloads (e.g., `{ "$gt": "" }`) cannot bypass authentication checks.

### HTTP Parameter Pollution Defense (`hpp`)
`app.use(hpp())` eliminates array-pollution attacks where attackers submit multiple query parameters of the same name to override single-value assumptions.

---

## 7. API Rate Limiting & Denial-of-Service Defense

- **Global Rate Limiter**: Configured via `express-rate-limit` allowing 300 requests per 15-minute window per IP.
- **AI Chatbot Rate Limiter**: Chatbot endpoint `/api/chatbot/chat` is restricted to **10 requests per minute per IP** to prevent quota exhaustion attacks on the Groq LLM API.

---

## 8. File Upload & Cloud Storage Security

- **Multer Memory Streaming**: Uploaded image buffers are streamed directly to Cloudinary using `multer-storage-cloudinary` without saving files to the local container disk.
- **MIME Type Validation**: Only standard image extensions (JPEG, PNG, WebP) are processed. Executable or binary file types are blocked.
- **Count Limits**: Enforces strict boundaries: `maxCount: 1` for main cover image and `maxCount: 5` for gallery photos.

---

## 9. Payment Integrity & Cryptographic Signatures

To ensure customers cannot tamper with booking amounts, discounts, or payment statuses:
1. **Server-Side Price Calculation**: All pricing math (nights, extra guest fees, pet fees, 18% GST) is calculated exclusively on the server. The client never supplies the payable amount.
2. **HMAC-SHA256 Verification**:
   ```javascript
   const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
   hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
   const generated_signature = hmac.digest("hex");

   if (generated_signature !== razorpay_signature) {
     return res.status(400).json({ success: false, message: "Payment verification failed" });
   }
   ```
   No booking record is saved unless Razorpay's cryptographic proof is verified.

---

## 10. Hardware & QR Verification Security

- **Host-to-Listing Verification**: When a host scans a QR code, the backend verifies that the scanning host actually owns the property:
  ```javascript
  if (booking.listing.Owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: This booking belongs to another property."
    });
  }
  ```
- **Camera Secure Contexts**: In compliance with W3C standards, `html5-qrcode` requires an encrypted context (HTTPS or localhost) to access user media capture devices.
