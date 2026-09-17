# Feature: Payment System & Cryptographic Verification

## 1. Purpose
Implements a 20% token reservation model powered by Razorpay. Guests pay a 20% deposit online to lock in their dates, while the remaining 80% balance is settled on-site upon hotel arrival. Ensures financial integrity through server-side HMAC-SHA256 signature verification.

---

## 2. Workflow
1. **Order Initiation**:
   - `POST /listings/:id/book/initiate` calculates the final payable amount.
   - Computes 20% token: `tokenAmount = round(finalTotalPrice * 0.20)`.
   - Converts to paise (`tokenAmount * 100`) and calls `razorpay.orders.create({ amount, currency: "INR" })`.
2. **Checkout Presentation**:
   - Backend returns `order.id` and public `RAZORPAY_KEY_ID`.
   - Frontend injects Razorpay Checkout Modal (`window.Razorpay`).
3. **Transaction Execution**:
   - Customer pays via UPI, Debit/Credit Card, or Net Banking.
   - Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
4. **Server Verification**:
   - Frontend forwards credentials to `POST /listings/:id/book/verify`.
   - Server recomputes:
     ```javascript
     const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
     hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
     const generated_signature = hmac.digest("hex");
     ```
   - If `generated_signature !== razorpay_signature`, the request is rejected with `400 Bad Request`.
5. **Settlement Allocation**:
   - `payment.amount` is recorded as the 20% paid token with status `paid`.
   - The remaining 80% is displayed on the invoice and host check-in scanner as **Balance Due**.

---

## 3. Components Involved
- `frontend/src/pages/BookingNew.jsx`: Initializes Razorpay modal with callbacks.
- `Backend/config/razorpay.js`: Instantiates `new Razorpay(...)` with secret keys.
- `Backend/controllers/bookings.js`: Order creation and HMAC signature verification.

---

## 4. APIs Involved
- `POST /listings/:id/book/initiate`: Generates Razorpay Order.
- `POST /listings/:id/book/verify`: Cryptographic verification & booking confirmation.

---

## 5. Database Collections
- **`bookings`**: Stores `payment.razorpayOrderId`, `payment.razorpayPaymentId`, `payment.amount`, and `payment.status`.

---

## 6. External Services
- **Razorpay Payments API**: Financial transactions and order creation.

---

## 7. Important Implementation Details
- **Tamper Prevention**: Pricing is **never** accepted from the client request body. The server re-computes nights, extra guest fees, pet fees, GST, and discounts independently inside `confirmBooking` to ensure absolute pricing fidelity.
- **Paise Conversion**: Razorpay operates in the smallest currency sub-unit (paise for INR). All amounts are multiplied by 100 before order creation.

---

## 8. Known Limitations
- Currently configured for INR currency transactions. Multi-currency support can be toggled via Razorpay International settings.
