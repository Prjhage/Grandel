const express = require("express");

const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// New route for infinite scroll data
router.get("/data", wrapAsync(listingController.getListingsData));

//Router .routes =>we can combine multiple routes with same path

//for the same route ("/") we can use
router
  .route("/")
  .get(wrapAsync(listingController.index)) //index route
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListings)
  ); //create route

//New Route check user is authenticated
router.get("/new", isLoggedIn, listingController.renderNewForm);

//for the same route ("/:id") we can use
router
  .route("/:id")
  .get(wrapAsync(listingController.showListings)) //show route
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,

    wrapAsync(listingController.updateListings)
  ) //update route
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListings)); //   delete route

//edit route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

// routes/listings.js
router.get("/filter", wrapAsync(listingController.filterData));

module.exports = router;
//
