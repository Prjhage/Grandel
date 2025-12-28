const Listing = require("../models/listing.js");
const expresserror = require("../utils/expresserror.js");

module.exports.index = async (req, res) => {
  const { q, category } = req.query;
  const query = {};

  if (category) {
    query.category = { $regex: new RegExp(`^${category}$`, "i") };
  }

  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { country: { $regex: q, $options: "i" } },
    ];
  }

  // ✅ SIMPLE & FAST
  const allListings = await Listing.find(query);

  const userWishlist = req.user ? req.user.wishlist || [] : [];

  res.render("listings/index.ejs", {
    allListings,
    userWishlist,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListings = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("Owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  // ✅ avgRating already exists in DB
  res.render("listings/show.ejs", {
    listing,
    avgRating: listing.avgRating,
  });
};

module.exports.createListings = async (req, res) => {
  const url = req.file.path;
  const filename = req.file.filename;

  const newListing = new Listing(req.body.listing);
  // avgRating = 0 (default)
  // ratingCount = 0 (default)

  const geoResponse = await fetch(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(
      req.body.listing.location
    )}.json?key=${process.env.MAP_TOKEN}`
  );

  const geoData = await geoResponse.json();

  if (!geoData.features || geoData.features.length === 0) {
    req.flash("error", "Invalid location");
    return res.redirect("/listings/new");
  }

  newListing.geometry = {
    type: "Point",
    coordinates: geoData.features[0].center,
  };

  newListing.Owner = req.user._id;
  newListing.image = { url, filename };

  await newListing.save();

  req.flash("success", "Successfully created a new listing");
  res.redirect(`/listings/${newListing._id}`);
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let orignalImageUrl = listing.image.url.replace("/upload", "/upload/w_250");

  res.render("listings/edit.ejs", { listing, orignalImageUrl });
};

module.exports.updateListings = async (req, res) => {
  if (!req.body.listing) {
    throw new expresserror("Send valid data for listing", 400);
  }

  const { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  const geoResponse = await fetch(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(
      req.body.listing.location
    )}.json?key=${process.env.MAP_TOKEN}`
  );

  const geoData = await geoResponse.json();

  listing.geometry = {
    type: "Point",
    coordinates: geoData.features[0].center,
  };

  await Listing.findByIdAndUpdate(id, {
    ...req.body.listing,
    geometry: listing.geometry,
  });

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
    await listing.save();
  }

  req.flash("success", "Listing updated");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListings = async (req, res) => {
  const { id } = req.params;

  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing deleted");
  res.redirect("/listings");
};
