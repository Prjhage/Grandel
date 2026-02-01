const express = require("express");

const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing, validateListingUpdate } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// New route for infinite scroll data
router.get("/data", wrapAsync(listingController.getListingsData));

// routes/listings.js
router.get("/filter", wrapAsync(listingController.filterData));

//Router .routes =>we can combine multiple routes with same path

//for the same route ("/") we can use
router
    .route("/")
    .get(wrapAsync(listingController.index)) //index route
    .post(
        isLoggedIn,
        (req, res, next) => {
            upload.fields([
                { name: "listing[image]", maxCount: 1 },
                { name: "listing[images]", maxCount: 5 },
            ])(req, res, (err) => {
                if (err) {
                    console.error("MULTER ERROR:", err);
                    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
                }
                next();
            });
        },
        validateListing,
        wrapAsync(listingController.createListings),
    );

//for the same route ("/:id") we can use
router
    .route("/:id")
    .get(wrapAsync(listingController.showListings)) //show route
    .put(
        isLoggedIn,
        isOwner,
        upload.fields([
            { name: "listing[image]", maxCount: 1 }, // main image
            { name: "listing[images]", maxCount: 5 }, // gallery images
        ]),
        validateListingUpdate,

        wrapAsync(listingController.updateListings),
    ) //update route
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListings)); //   delete route

//edit route
router.get(
    "/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.fetchEditForm),
);

module.exports = router;