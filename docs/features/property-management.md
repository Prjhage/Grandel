# Feature: Property & Listing Management

## 1. Purpose
Allows property hosts to list accommodations with multi-image Cloudinary uploads, categorize properties across 14 curated stay types, define capacity (rooms, guests per room), specify pet rules and charges, configure daily early bird discounts, and register spherical GeoJSON coordinates for interactive Leaflet discovery.

---

## 2. Workflow
1. **Creation**:
   - Host fills out the property form on `/listings/new`.
   - Host uploads a primary cover photo and up to 5 gallery images.
2. **Cloudinary Pipeline**:
   - Multer streams files to Cloudinary storage via `multer-storage-cloudinary`.
   - CDN URLs and filenames are saved to the document.
3. **Geospatial Registration**:
   - Property coordinates are stored as a GeoJSON `Point` (`coordinates: [lng, lat]`).
   - MongoDB indexes the point with a `2dsphere` spatial index.
4. **Search & Discovery**:
   - Guests browse listings by text search, category tabs, or current device location (triggering `$near` 50km radius query).
5. **Editing & Deletion**:
   - Only the authenticated owner can modify or delete a property.
   - Deletion triggers a Mongoose `post findOneAndDelete` hook that cascades deletions to all associated reviews and bookings.

---

## 3. Components Involved
- `frontend/src/pages/Listings.jsx`: Main catalog feed with category bar and cards.
- `frontend/src/pages/ListingShow.jsx`: Detailed property screen with image carousel, map, and amenities.
- `frontend/src/pages/NewListing.jsx`: Property creation form.
- `frontend/src/pages/EditListing.jsx`: Property editing form.
- `frontend/src/components/AdvancedSearchBar.jsx`: Search modal with date, location, and guest selectors.
- `Backend/controllers/listings.js`: Controller handling search, filtering, and CRUD.

---

## 4. APIs Involved
- `GET /listings`: Paginated and filtered property list.
- `POST /listings`: Create listing (Multipart upload, `isLoggedIn`).
- `GET /listings/:id`: Detailed listing view.
- `PUT /listings/:id`: Update listing (`isLoggedIn`, `isOwner`).
- `DELETE /listings/:id`: Remove listing (`isLoggedIn`, `isOwner`).
- `GET /listings/filter`: Category filtering endpoint.

---

## 5. Database Collections
- **`listings`**: Primary collection storing metadata, images, pricing, and spatial coordinates.
- **`reviews`**: Linked via `reviews` ObjectId array.
- **`users`**: Owner referenced via `Owner` field.

---

## 6. External Services
- **Cloudinary CDN**: Image upload storage and asset optimization.
- **Leaflet & OpenStreetMap**: Map rendering and tile layers.
- **Google Generative AI**: Generates companion attractions and food recommendations for the destination.

---

## 7. Important Implementation Details
- **2dsphere Index Synchronization**: `Listing.syncIndexes()` is called automatically on MongoDB connection in `app.js` to guarantee spatial index existence before `$near` queries execute.
- **Joi Validation with Multipart**: Because `multipart/form-data` submits fields in flattened bracket notation (e.g., `listing[price]`), the backend uses a custom `unflattenBody` utility before passing data to Joi validation schemas.

---

## 8. Known Limitations
- Geocoding currently relies on client-supplied coordinates or predefined landmark coordinates. Automatic forward geocoding fallback via Nominatim can be added in future iterations.
