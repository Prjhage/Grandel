# Backend API Adjustments for React Frontend

This document outlines all the changes needed to make the Express backend work as an API for the React frontend.

## 1. Install CORS Package

```bash
npm install cors
```

## 2. Update app.js - Add CORS Support

Add this near the top of `app.js` after the initial imports:

```javascript
const cors = require('cors');

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 3. Update Controllers to Return JSON Instead of Rendering EJS

### listings.js Controller

**Current (EJS):**
```javascript
module.exports.index = async (req, res) => {
  // ... logic ...
  res.render('listings/index.ejs', { allListings, userWishlist });
};
```

**New (API):**
```javascript
module.exports.index = async (req, res) => {
  // ... logic ...
  res.json({ allListings, userWishlist });
};
```

Apply this pattern to ALL controller methods that currently use `res.render()`.

### Specific Changes Needed:

#### listings.js
- `index` → return `{ allListings, userWishlist, category, sort }`
- `getListingsData` → already returns JSON ✅
- `showListing` → return `{ listing, travelCompanion, currUser }`
- `renderNewForm` → React handles this, can skip
- `createListing` → return `{ success: true, listing }` or error
- `renderEditForm` → React handles this, can skip
- `updateListing` → return `{ success: true, listing }` or error
- `destroyListing` → return `{ success: true, message }`

#### user.js (auth controller)
- `renderSignup` → React handles this
- `signup` → return `{ success: true, user }` (exclude password)
- `renderLogin` → React handles this  
- `login` → return `{ success: true, user }` (exclude password)
- `logout` → return `{ success: true, message: 'Logged out' }`

#### reviews.js
- `createReview` → return `{ success: true, review }`
- `destroyReview` → return `{ success: true, message }`

#### bookings.js
- All methods → return JSON instead of rendering

## 4. Add New API Endpoints

### /api/user/session - Check Authentication Status

Add to `user.js` routes:

```javascript
router.get('/api/user/session', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const { password, ...userWithoutPassword } = req.user.toObject();
    res.json({ authenticated: true, user: userWithoutPassword });
  } else {
    res.json({ authenticated: false, user: null });
  }
});
```

### Wishlist API Endpoints

If wishlist isn't already an API, add these routes:

```javascript
// POST /api/wishlist/add
router.post('/api/wishlist/add', isLoggedIn, async (req, res) => {
  try {
    const { listingId } = req.body;
    // Add to user's wishlist logic
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/wishlist/remove
router.post('/api/wishlist/remove', isLoggedIn, async (req, res) => {
  try {
    const { listingId } = req.body;
    // Remove from user's wishlist logic
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
```

## 5. Error Handling

Update error handlers to return JSON:

```javascript
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  
  // Check if request expects JSON (from React)
  if (req.headers['content-type'] === 'application/json' || req.xhr) {
    res.status(statusCode).json({ 
      success: false, 
      error: message 
    });
  } else {
    // Legacy EJS rendering (if needed)
    res.status(statusCode).render('error.ejs', { err });
  }
});
```

## 6. Session Configuration

Ensure session configuration allows cross-origin requests:

```javascript
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // secure: true, // Enable in production with HTTPS
    sameSite: 'lax', // Important for CORS
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  },
  store: MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 3600
  })
}));
```

## 7. Flash Messages

Since React handles flash messages, you can either:

**Option A:** Remove flash from backend, handle in React state

**Option B:** Return flash in JSON responses:
```javascript
res.json({ 
  success: true, 
  data: listing,
  flash: { type: 'success', message: 'Listing created!' }
});
```

## 8. File Uploads (Multer)

File uploads work the same! multer will parse multipart/form-data from React's FormData.

```javascript
// In React:
const formData = new FormData();
formData.append('listing[image]', fileInput.files[0]);
// ... other fields

await axios.post('/listings', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

## 9. Authentication Middleware

Update `isLoggedIn` middleware to handle JSON responses:

```javascript
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    if (req.xhr || req.headers['content-type'] === 'application/json') {
      return res.status(401).json({ 
        success: false, 
        error: 'You must be logged in' 
      });
    } else {
      req.flash('error', 'You must be signed in first!');
      return res.redirect('/login');
    }
  }
  next();
};
```

## 10. Production Deployment

### Option 1: Separate Deployments
- Frontend: Deploy to Vercel/Netlify
- Backend: Deploy to Render/Railway
- Update CORS origin to production frontend URL

### Option 2: Serve React from Express
```javascript
// In app.js, after all routes:
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
  });
}
```

Add build script to package.json:
```json
{
  "scripts": {
    "build": "cd frontend && npm install && npm run build",
    "start:prod": "npm run build && node app.js"
  }
}
```

## Testing Checklist

- [ ] CORS working (no console errors)
- [ ] Login/Signup returns user object
- [ ] Sessions persist across requests
- [ ] Listings API returns data
- [ ] File uploads work
- [ ] Authentication middleware works
- [ ] Error handling returns JSON
- [ ] Flash messages work (if using)
