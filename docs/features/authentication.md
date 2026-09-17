# Feature: Authentication & Identity Management

## 1. Purpose
Provides secure, low-friction user access through dual authentication: social login via Google / Firebase and direct email-password credentials, coupled with phone number hashing, session persistence, role-based authorization (`user` vs `host`), and automated self-service password reset flows.

---

## 2. Workflow
1. **Signup/Login**:
   - User inputs credentials or selects "Continue with Google".
   - The Firebase Web Client SDK verifies credentials and issues a cryptographic JWT ID Token.
2. **Backend Token Synchronization**:
   - Client sends token to `POST /firebase-login` or `POST /signup`.
   - Backend decodes token using `firebase-admin`, locates or registers the MongoDB `User`, hashes phone numbers via `bcrypt`, and establishes a persistent session using `req.login`.
3. **Session Cookie**:
   - `express-session` issues an encrypted session cookie stored in MongoDB via `connect-mongo`.
4. **Password Reset**:
   - User requests reset -> `POST /forgot-password` generates a crypto token valid for 1 hour.
   - Nodemailer dispatches an email with a secure reset link.

---

## 3. Components Involved
- `frontend/src/pages/Login.jsx`: Login form and Firebase Google pop-up integration.
- `frontend/src/pages/Signup.jsx`: Registration form with optional phone collection.
- `frontend/src/pages/ForgotPassword.jsx`: Email submission interface for reset token.
- `frontend/src/pages/ResetPassword.jsx`: New password confirmation screen.
- `Backend/middleware/firebaseAuth.js`: Bearer token extractor and Firebase Admin validator.
- `Backend/middleware.js`: `isLoggedIn`, `saveRedirectUrl`, and ownership guards.

---

## 4. APIs Involved
- `POST /signup`: Firebase registration & user record creation.
- `POST /login`: Firebase credential verification & session initialization.
- `POST /firebase-login`: Token sync for Google OAuth users.
- `GET /current-user`: Reads active session user metadata.
- `GET /logout`: Destroys session and flushes cookie.
- `POST /forgot-password`: Generates reset token & sends email.
- `POST /reset-password/:token`: Commits new password.

---

## 5. Database Collections
- **`users`**: Stores email, username, `firebaseUid`, hashed phone numbers (`phoneHash`, `phoneLast4`), `role`, `wishlist`, and reset tokens.
- **`sessions`**: MongoStore collection containing serialized sessions.

---

## 6. External Services
- **Firebase Authentication**: Identity provider issuing ID tokens.
- **Firebase Admin SDK**: Server-side token validation.
- **Google Cloud Platform**: Firebase console and OAuth credential management.
- **Gmail SMTP (Nodemailer)**: Outbound transport for reset emails.

---

## 7. Important Implementation Details
- **Cross-Domain Session Cookie**: Configured with `sameSite: 'none'`, `secure: true`, and `trust proxy: 1` to ensure cookies survive cross-origin requests between Vercel and Render.
- **Phone Number Privacy**: Phone numbers are never stored in plain text. Full numbers are salted and hashed with `bcrypt.hash(phone, 10)`, while only `phoneLast4` is stored for user identification.

---

## 8. Known Limitations
- Social login currently supports Google via Firebase. Apple or GitHub OAuth providers can be enabled in Firebase console as future extensions.
- Session cookies require HTTPS in production environments.
