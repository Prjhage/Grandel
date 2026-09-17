# Feature: Review & Rating System

## 1. Purpose
Empowers guests to share feedback and star ratings (1 to 5 stars) on accommodations they have experienced. Guarantees authentic community trust by enforcing author validation, computing real-time atomic average ratings, and instantly purging stale listing caches upon submission or deletion.

---

## 2. Workflow
1. **Submission**:
   - Authenticated guest completes the review form on the property page (`/listings/:id`).
   - Selects rating (1 to 5) and enters commentary.
2. **Atomic Rating Calculation**:
   - `controllers/reviews.js` calculates the updated average:
     $$\text{newAvg} = \frac{(\text{avgRating} \times \text{ratingCount}) + \text{newRating}}{\text{ratingCount} + 1}$$
   - Increments `listing.ratingCount += 1`.
3. **Cache Purge**:
   - `cacheService.del('listing_show_' + id)` and `cacheService.flush()` invalidate cached show responses so subsequent requests display the updated score immediately.
4. **Deletion**:
   - Only the review author can delete their review (`isAuthor` middleware).
   - Deleting a review removes it from `listing.reviews`, deletes the `Review` document, recalculates the average rating, and clears the cache.

---

## 3. Components Involved
- `frontend/src/pages/ListingShow.jsx`: Interactive star selection UI and review feed.
- `Backend/controllers/reviews.js`: Creation, recalculation, and deletion logic.
- `Backend/middleware.js` (`validateReview`, `isAuthor`): Validates schema and author ownership.

---

## 4. APIs Involved
- `POST /listings/:id/reviews`: Submits a review.
- `DELETE /listings/:id/reviews/:reviewId`: Deletes a review.
- `GET /listings/:id/reviews`: Reviews routing endpoint.

---

## 5. Database Collections
- **`reviews`**: Stores individual comments, ratings, timestamps, and author reference.
- **`listings`**: Holds `reviews` ObjectId array, `avgRating`, and `ratingCount`.

---

## 6. External Services
- None (Local database atomic operations).

---

## 7. Important Implementation Details
- **Zero Division Protection**: When all reviews are removed from a listing, the controller automatically resets both `avgRating` and `ratingCount` to `0` to prevent `NaN` errors.
- **Author Authorization Guard**:
  ```javascript
  if (!review.author || !review.author.equals(req.user._id)) {
    return res.status(403).json({ message: "You did not write this review" });
  }
  ```

---

## 8. Known Limitations
- Verified stay gating (enforcing that a user has a `completed` booking status before reviewing) can be optionally toggled in `validateReview` for stricter anti-spam control.
