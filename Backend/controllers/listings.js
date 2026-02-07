const Listing = require("../models/listing.js");
const ExpressError = require("../utils/expresserror.js");
const Booking = require("../models/booking");
const { getTravelSuggestions } = require("../services/geminiService");
const { getImage } = require("../services/imageService");
const { getNearbyPlaces } = require("../services/nearbyPlacesService");
const amenityIcons = require("../utils/amenities.js");

module.exports.index = async (req, res) => {
  let { q, sort, startDate, endDate, rooms, guests, lat, lng, category } = req.query;
  const query = {};

  // 1. Category Filtering
  if (category) {
    query.category = category;
  }

  // 2. Geospatial Search (Nearby)
  // If q is provided and is NOT "Current Location", the user likely typed a new destination.
  // In that case, we should ignore lat/lng coordinates.
  const isGeolocationSearch = q === 'Current Location' || (!q && lat && lng);

  if (isGeolocationSearch && lat && lng) {
    query.geometry = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: 50000, // 50km radius
      },
    };
  }

  // 3. Text Search (title, location, country)
  if (q && q !== 'Current Location') {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { country: { $regex: q, $options: "i" } },
    ];
  }

  // 3. Capacity Filtering (Rooms & Total Guests)
  const reqRooms = parseInt(rooms) || 0;
  const reqGuests = parseInt(guests) || 0;

  if (reqRooms > 1) { // Default is 1, so only filter if user specifically wants more
    query.numRooms = { $gte: reqRooms };
  }

  if (reqGuests > 1) { // Default is 1
    query.$expr = {
      $gte: [
        {
          $multiply: [
            { $ifNull: ["$numRooms", 1] },
            { $ifNull: ["$guestsPerRoom", 2] }
          ]
        },
        reqGuests
      ]
    };
  }

  let allListings = await Listing.find(query);

  // 3. Date Availability & Strict Capacity Filtering
  if ((startDate && endDate) || reqRooms > 0 || reqGuests > 0) {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // Fetch relevant bookings for these dates
    let overlappingBookings = [];
    if (start && end) {
      overlappingBookings = await Booking.find({
        status: { $in: ["confirmed", "pending"] },
        $or: [
          { startDate: { $lt: end }, endDate: { $gt: start } }
        ]
      });
    }

    allListings = allListings.filter(listing => {
      // Precise guest capacity check: reqGuests must be <= listing.numRooms * listing.guestsPerRoom
      if (reqGuests > listing.numRooms * listing.guestsPerRoom) return false;

      // Date check
      if (start && end) {
        const listingBookings = overlappingBookings.filter(b => b.listing.toString() === listing._id.toString());
        const bookedRoomsCount = listingBookings.reduce((sum, b) => sum + (b.numRooms || 1), 0);
        const availableRooms = listing.numRooms - bookedRoomsCount;

        // Must have at least the requested rooms available
        const roomsToChecks = reqRooms > 0 ? reqRooms : 1;
        if (availableRooms < roomsToChecks) return false;
      }
      return true;
    });
  }

  // Sort listings based on sort parameter
  if (sort === "price-low") {
    allListings.sort((a, b) => a.price - b.price);
  } else if (sort === "price-high") {
    allListings.sort((a, b) => b.price - a.price);
  } else if (sort === "rating") {
    allListings.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  }

  const userWishlist = req.user ? req.user.wishlist || [] : [];

  // Check if user has any listings (is a host)
  const isHost = req.user
    ? (await Listing.find({ Owner: req.user._id })).length > 0
    : false;

  res.json({
    allListings,
    userWishlist,
    isHost,
    sort,
  });
};

module.exports.showListings = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("Owner");

  if (!listing) {
    return res.status(404).json({ success: false, message: "Listing you requested for does not exist!" });
  }

  // Ensure original images without Cloudinary transformations
  if (listing.image && listing.image.url) {
    listing.image.url = listing.image.url.replace(/\/upload\/[a-z0-9_,]+\//, '/upload/');
  }
  if (listing.images && listing.images.length > 0) {
    listing.images = listing.images.map(img => ({
      ...img.toObject(),
      url: img.url.replace(/\/upload\/[a-z0-9_,]+\//, '/upload/')
    }));
  }

  let nearbyPlaces = [];

  if (listing.geometry && listing.geometry.coordinates) {
    const lng = listing.geometry.coordinates[0];
    const lat = listing.geometry.coordinates[1];

    nearbyPlaces = await getNearbyPlaces(lat, lng);
  }

  // Limit to 5 items
  if (nearbyPlaces.length > 5) {
    nearbyPlaces = nearbyPlaces.slice(0, 5);
  }

  // 🔹 Fetch images for Nearby Places (Overpass)
  if (nearbyPlaces.length > 0) {
    nearbyPlaces = await Promise.all(
      nearbyPlaces.map(async (place) => {
        const img = await getImage(`${place.name} ${listing.location}`);
        return {
          ...place,
          image:
            img ||
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop",
        };
      }),
    );
  }

  console.log("Nearby places sent to UI:", nearbyPlaces.length);

  // 🔹 2. Latest travelCompanion data (food + places)
  const travelCompanion = listing.travelCompanion || { places: [], food: [] };

  console.log("Nearby places:", nearbyPlaces.length);
  console.log(
    "TravelCompanion:",
    travelCompanion ? "Available" : "Not available",
  );

  res.json({
    listing,
    avgRating: listing.avgRating,
    nearbyPlaces,
    travelCompanion,
    amenityIcons,
  });
};

module.exports.createListings = async (req, res) => {
  // ✅ VALIDATE LISTING DATA
  if (!req.body.listing) {
    return res.status(400).json({ success: false, message: "Invalid listing data" });
  }

  // ✅ MAIN IMAGE (REQUIRED)
  let mainImage;
  if (
    req.files &&
    req.files["listing[image]"] &&
    req.files["listing[image]"].length > 0
  ) {
    mainImage = req.files["listing[image]"][0];
  } else {
    return res.status(400).json({ success: false, message: "Main image is required" });
  }

  // ✅ OPTIONAL GALLERY IMAGES
  const galleryImages = req.files["listing[images]"] || [];

  try {
    const newListing = new Listing(req.body.listing);

    // Assign owner
    if (!req.user) {
      return res.status(401).json({ success: false, message: "You must be logged in" });
    }
    newListing.Owner = req.user._id;

    // Image processing
    newListing.image = {
      url: mainImage.path,
      filename: mainImage.filename,
    };

    newListing.images = galleryImages.map((file) => ({
      url: file.path,
      filename: file.filename,
    }));

    /* ---------------- GEODATA ---------------- */
    try {
      const geoResponse = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(
          req.body.listing.location,
        )}.json?key=${process.env.MAP_TOKEN}`,
      );
      const geoData = await geoResponse.json();

      if (!geoData.features || geoData.features.length === 0) {
      } else {
        newListing.geometry = {
          type: "Point",
          coordinates: geoData.features[0].center,
        };
      }
    } catch (geoErr) {
      // Don't fail the whole request, just proceed without geometry or with fallback
    }

    newListing.amenities = req.body.listing.amenities || [];

    // Room and Guest Configuration
    newListing.numRooms = req.body.listing.numRooms || 1;
    newListing.guestsPerRoom = req.body.listing.guestsPerRoom || 2;

    // Boolean conversions (if not already handled)
    newListing.petsAllowed = String(req.body.listing.petsAllowed) === "true";
    newListing.acceptHostTerms = String(req.body.listing.acceptHostTerms) === "true";

    /* ---------------- AI TRAVEL COMPANION ---------------- */
    let travelCompanion = { places: [], food: [] };
    try {
      if (newListing.location) {
        const aiData = await getTravelSuggestions(newListing.location, 2);

        const placeImages = [];
        if (aiData.places) {
          for (let place of aiData.places) {
            const img = await getImage(`${place} ${newListing.location}`);
            placeImages.push({
              name: place,
              image: img || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"
            });
          }
        }

        const foodImages = [];
        if (aiData.food) {
          for (let food of aiData.food) {
            const img = await getImage(`${food} food`);
            foodImages.push({
              name: food,
              image: img || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"
            });
          }
        }

        travelCompanion = { places: placeImages, food: foodImages };
      }
    } catch (aiErr) {
    }
    newListing.travelCompanion = travelCompanion;

    const savedListing = await newListing.save();

    // Upgrade user to host
    if (req.user.role !== "host") {
      req.user.role = "host";
      await req.user.save();
    }

    res.status(201).json({
      success: true,
      message: "New Listing Created!",
      listing: savedListing,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Failed to create listing: ${err.message}`
    });
  }
};


module.exports.fetchEditForm = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({ success: false, message: "Listing you requested for does not exist!" });
  }

  let orignalImageUrl = listing.image.url.replace("/upload", "/upload/w_250");

  res.json({ listing, orignalImageUrl });
};

module.exports.updateListings = async (req, res) => {
  if (!req.body.listing) {
    throw new ExpressError("Send valid data for listing", 400);
  }

  const { id } = req.params;

  // 🔹 Find listing
  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({ success: false, message: "Listing not found!" });
  }

  // Remove acceptHostTerms from req.body.listing if it exists (not needed for updates)
  if (req.body.listing.acceptHostTerms !== undefined) {
    delete req.body.listing.acceptHostTerms;
  }

  /* ================= GEO LOCATION & AI UPDATE ================= */
  if (req.body.listing.location && req.body.listing.location !== listing.location) {
    const geoResponse = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(
        req.body.listing.location,
      )}.json?key=${process.env.MAP_TOKEN}`,
    );

    const geoData = await geoResponse.json();

    if (geoData.features && geoData.features.length > 0) {
      listing.geometry = {
        type: "Point",
        coordinates: geoData.features[0].center,
      };
    }

    // Refresh AI Travel Companion for new location
    try {
      const aiData = await getTravelSuggestions(req.body.listing.location, 3);
      const placeImages = [];
      if (aiData.places) {
        for (let place of aiData.places) {
          const img = await getImage(`${place} ${req.body.listing.location}`);
          placeImages.push({
            name: place,
            image: img || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop",
          });
        }
      }

      const foodImages = [];
      if (aiData.food) {
        for (let food of aiData.food) {
          const img = await getImage(`${food} food`);
          foodImages.push({
            name: food,
            image: img || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop",
          });
        }
      }
      listing.travelCompanion = { places: placeImages, food: foodImages };
    } catch (aiErr) {
      console.error("AI Update Error during Edit:", aiErr);
    }
  }

  /* ================= BASIC FIELDS UPDATE ================= */
  listing.title = req.body.listing.title;
  listing.description = req.body.listing.description;
  listing.price = req.body.listing.price;
  listing.country = req.body.listing.country;
  listing.location = req.body.listing.location;

  /* ================= GUEST AND PET SETTINGS UPDATE ================= */
  listing.petsAllowed = String(req.body.listing.petsAllowed) === "true";
  listing.petChargePerNight = req.body.listing.petChargePerNight || 300;
  listing.numRooms = req.body.listing.numRooms || 1;
  listing.guestsPerRoom = req.body.listing.guestsPerRoom || 2;

  /* ================= AMENITIES UPDATE ================= */
  // If no amenities selected → empty array
  listing.amenities = req.body.listing.amenities || [];

  /* ================= MAIN IMAGE UPDATE ================= */
  if (req.files && req.files["listing[image]"]) {
    // Delete old main image from Cloudinary if it exists
    if (listing.image && listing.image.filename) {
      try {
        const { cloudinary } = require("../cloudConfig");
        await cloudinary.uploader.destroy(listing.image.filename);
      } catch (err) {
        console.error("Error deleting old main image:", err);
      }
    }

    const mainImage = req.files["listing[image]"][0];
    listing.image = {
      url: mainImage.path,
      filename: mainImage.filename,
    };
  }

  /* ================= ADDITIONAL IMAGES UPDATE ================= */
  if (req.files && req.files["listing[images]"]) {
    const extraImages = req.files["listing[images]"].map((file) => ({
      url: file.path,
      filename: file.filename,
    }));

    // Replace all additional images instead of appending
    listing.images = extraImages;
  }

  /* ================= SAVE ================= */
  await listing.save();

  res.json({ success: true, message: "Listing updated", listingId: id });
};

module.exports.destroyListings = async (req, res) => {
  const { id } = req.params;

  await Listing.findByIdAndDelete(id);

  res.json({ success: true, message: "Listing deleted" });
};

// 🔹 Add missing controller methods to prevent crashes
module.exports.getListingsData = async (req, res) => {
  const allListings = await Listing.find({});
  res.json(allListings);
};


module.exports.filterData = async (req, res) => {
  return module.exports.index(req, res);
};
