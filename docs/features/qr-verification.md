# Feature: QR Code Verification & Digital Check-in

## 1. Purpose
Replaces manual paper vouchers and booking lookups with an automated, tamper-proof QR check-in workflow. Guests receive an official PDF invoice embedded with a scannable check-in barcode. Property hosts scan the QR code using their device camera, verifying booking validity and ownership in real time while displaying the balance due.

---

## 2. Workflow
1. **Invoice Compilation**:
   - Guest requests invoice via `GET /bookings/:id/pdf`.
   - `utils/generateBookingPDF.js` uses `bwip-js` to render a vector QR barcode containing the 24-character hexadecimal `bookingId`.
   - `PDFKit` compiles the official receipt with guest details, payment summary, 20% token paid, and 80% balance due.
2. **Guest Arrival**:
   - Guest presents the digital PDF on their smartphone or a physical printout at the hotel reception.
3. **Host Camera Scan**:
   - Host accesses `/profile/host/scanner` on their device.
   - `html5-qrcode` initiates the camera viewfinder (rear camera default on mobile).
   - Once decoded, the camera extracts the `bookingId`.
4. **Authorization & Settlement**:
   - Frontend calls `GET /bookings/verify/:id`.
   - The backend checks whether `booking.listing.Owner.equals(req.user._id)`.
   - If unauthorized, the scanner throws a security warning.
   - If authorized, the scanner displays the guest avatar, dates, guest counts, and the exact remaining balance due.

---

## 3. Components Involved
- `frontend/src/pages/HostScanner.jsx`: Real-time camera viewfinder using `Html5QrcodeScanner`.
- `frontend/src/pages/HostScanner.css`: Scanner viewport animations and status cards.
- `Backend/utils/generateBookingPDF.js`: PDFKit invoice generation with embedded `bwip-js` QR.
- `Backend/controllers/bookings.js` (`verifyBooking`): Security check and balance calculation.

---

## 4. APIs Involved
- `GET /bookings/:id/pdf`: Downloads branded PDF invoice.
- `GET /bookings/verify/:id`: Host-authenticated verification endpoint.

---

## 5. Database Collections
- **`bookings`**: Populated with `listing` and `user` to fetch guest profile and financial balances.
- **`listings`**: Checked to ensure `Owner` matches the authenticated host.

---

## 6. External Services
- `bwip-js`: Barcode Writer in Pure JavaScript for QR code encoding.
- `pdfkit`: High-fidelity server-side vector PDF generation.
- `html5-qrcode`: Client-side camera QR scanning library.

---

## 7. Important Implementation Details
- **Host Authorization Enforcement**:
  ```javascript
  const ownerId = booking.listing.Owner.toString();
  const requesterId = req.user._id.toString();
  if (ownerId !== requesterId) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: This booking belongs to another property."
    });
  }
  ```
  Prevents rogue hosts or other users from scanning and accessing reservations that do not belong to their property.

---

## 8. Known Limitations
- Browsers enforce strict security policies: Camera access requires **HTTPS** or `localhost`. Testing over unencrypted local LAN IPs (e.g. `http://192.168.x.x:5173`) will be blocked by modern browser security policies unless an SSL certificate is configured or a localhost proxy is used.
