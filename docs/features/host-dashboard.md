# Feature: Host Dashboard & Operations Suite

## 1. Purpose
Provides hosts with a centralized operations management portal. Hosts can track business performance (total earnings, active listings, reservation count, weighted review scores), manage property catalogs, view guest arrival rosters, update booking lifecycle statuses, and access the check-in QR scanner.

---

## 2. Workflow
1. **Access Control**:
   - Host accesses `/profile/host`.
   - Middleware ensures `isLoggedIn` and validates that `req.user.role === 'host'`.
2. **Analytics Aggregation**:
   - MongoDB aggregates all listings owned by the host to compute:
     - Cumulative revenue earned from completed reservations.
     - Number of active listings.
     - Count of pending arrivals awaiting confirmation.
     - Weighted average rating across all properties.
3. **Status Workflow Management**:
   - Host reviews incoming reservations.
   - Updates status from `pending` to `confirmed` (which triggers n8n guest email).
   - Upon guest arrival and check-out, updates status to `completed` (which triggers n8n thank you email).
4. **QR Camera Access**:
   - Quick button opens `/profile/host/scanner` for instantaneous mobile QR scanning.

---

## 3. Components Involved
- `frontend/src/pages/HostDashboard.jsx`: Host portal interface with metric cards, listing cards, and reservation tables.
- `frontend/src/pages/HostScanner.jsx`: Dedicated QR scanner component.
- `frontend/src/components/HostDashboardCacheContext.jsx`: Client-side cache avoiding repeated metric fetches.
- `Backend/controllers/users.js` (`hostDashboard`): Aggregation pipeline and roster compiler.

---

## 4. APIs Involved
- `GET /profile/host`: Fetches host metrics, properties, and bookings.
- `POST /profile/host/bookings/:id/status`: Updates booking lifecycle status.
- `GET /bookings/verify/:id`: Endpoint hit during QR verification.

---

## 5. Database Collections
- **`users`**: Verified for host privileges.
- **`listings`**: Queried for properties where `Owner === req.user._id`.
- **`bookings`**: Filtered for reservations attached to the host's listings.

---

## 6. External Services
- **n8n Automation**: Webhook triggers fired when the host changes booking status to `confirmed` or `completed`.

---

## 7. Important Implementation Details
- **Weighted Rating Calculation**: Instead of a simple arithmetic mean across listing averages, the backend aggregates total stars divided by total reviews:
  $$\text{Host Rating} = \frac{\sum (\text{listing.avgRating} \times \text{listing.ratingCount})}{\sum \text{listing.ratingCount}}$$
  This accurately accounts for review volume differences across high-traffic and low-traffic properties.

---

## 8. Known Limitations
- Payout distribution to host bank accounts is currently recorded as platform revenue; direct Razorpay Route / Marketplace split transfers can be integrated for automated host bank transfers.
