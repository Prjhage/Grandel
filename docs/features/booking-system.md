# Feature: Booking System

## 1. Purpose
Provides an intelligent reservation engine that checks calendar availability, calculates multi-tier pricing (nights, extra guests, pets, 18% GST), applies automated Early Bird discounts for the day's first reservation, prevents date overlaps, and coordinates payment initiation.

---

## 2. Workflow
1. **Date Selection**: Guest selects check-in and check-out dates on the property page or reserve card.
2. **Availability Check**: The system validates that `endDate > startDate` and ensures no existing `confirmed` or `pending` bookings collide with the requested date range (`startDate < existingEndDate && endDate > existingStartDate`).
3. **Financial Pricing**:
   - $\text{Base} = \text{pricePerNight} \times \text{nights}$
   - $\text{Extra Guest Surcharge} = \max(0, \text{guests} - \text{freeGuests}) \times 500 \times \text{nights}$
   - $\text{Pet Surcharge} = \text{animals} \times 300 \times \text{nights}$
   - $\text{Subtotal} = \text{Base} + \text{Extra Guest Fee} + \text{Pet Fee}$
   - $\text{GST} = \text{round}(\text{Subtotal} \times 0.18)$
   - $\text{Early Bird Discount} = \text{round}(\text{Subtotal} \times \text{discount}\%) \text{ if first booking of the day}$
4. **Initiation**: Client calls `POST /listings/:id/book/initiate` to receive Razorpay order details for the 20% token deposit.
5. **Confirmation**: Upon payment verification, a `Booking` record is saved, and state transitions to `pending` (awaiting host arrival check-in).

---

## 3. Components Involved
- `frontend/src/pages/BookingNew.jsx`: Guest booking form with date picker, guest counters, and live cost calculation.
- `Backend/controllers/bookings.js`: Booking initiation, collision check, pricing math, and confirmation.
- `Backend/models/booking.js`: Mongoose schema with pre-validation constraints and compound indexes.

---

## 4. APIs Involved
- `GET /listings/:id/book`: Renders booking summary and verifies listing capacity.
- `POST /listings/:id/book/initiate`: Computes pricing and initiates Razorpay order.
- `POST /listings/:id/book/verify`: Verifies payment and commits reservation.
- `DELETE /bookings/:id`: Allows guests to cancel their reservation.

---

## 5. Database Collections
- **`bookings`**: Stores dates, party composition, prices, payment references, and status.
- **`listings`**: Checked for price, owner, and capacity.
- **`users`**: Customer details and references.

---

## 6. External Services
- **Razorpay**: Order creation and token deposit transaction handling.
- **OpenWeatherMap**: Fetches live weather forecast for the stay dates.
- **Google Gemini 2.5 Flash**: Generates travel itinerary plan saved directly into `booking.travelCompanion`.

---

## 7. Important Implementation Details
- **Double-Booking Prevention**: Validated both on query time in `/listings` and during booking verification inside `confirmBooking`.
- **Early Bird Discount**: Scans `Booking.findOne({ listing, createdAt: { $gte: todayStart }, status: { $ne: 'cancelled' } })`. If no booking exists today, the discount percentage is automatically applied.

---

## 8. Known Limitations
- Partial day check-ins / hourly slots are not supported; standard check-in is 14:00 and check-out is 11:00.
