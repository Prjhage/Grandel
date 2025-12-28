const Review = require("../models/reviews.js");
const Listing = require("../models/listing.js");

module.exports.createReview = async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);

  if (!newReview.rating || newReview.rating < 1) {
    newReview.rating = 1;
  }

  listing.ratingCount += 1;

  // calculate avg safely
  listing.avgRating =
    ((listing.avgRating || 0) * (listing.ratingCount - 1) + newReview.rating) /
    listing.ratingCount;

  newReview.author = req.user._id;
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();
  req.flash("success", "Successfully created a new Review");
  res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  const listing = await Listing.findById(id).populate("reviews");

  if (listing.reviews.length === 0) {
    listing.avgRating = 0;
    listing.ratingCount = 0;
  } else {
    const total = listing.reviews.reduce((sum, r) => sum + r.rating, 0);
    listing.ratingCount = listing.reviews.length;
    listing.avgRating = total / listing.ratingCount;
  }

  await listing.save();

  req.flash("success", "Review deleted");
  res.redirect(`/listings/${id}`);
};
