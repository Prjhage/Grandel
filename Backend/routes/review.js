const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { validateReview, isLoggedIn, isAuthor } = require("../middleware.js");

const reviewController = require("../controllers/reviews.js");

// Handle GET request for reviews (redirects back to listing)
router.get("/", (req, res) => {
  let { id } = req.params;
  res.json({ message: `Reviews for listing ${id}` });
});

//Review
//Post route or create route for review
router.post(
  "/",
  isLoggedIn,
  validateReview,
  wrapAsync(reviewController.createReview)
);

//Delete route for review
router.delete(
  "/:reviewId",
  isLoggedIn,
  isAuthor,
  wrapAsync(reviewController.destroyReview)
);
module.exports = router;
//
