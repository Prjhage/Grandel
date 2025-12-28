const path = require("path");
if (process.env.NODE_ENV != "production") {
  require("dotenv").config({ path: path.join(__dirname, "../.env") });
}
const mongoose = require("mongoose");
const Listing = require("../models/listing");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function fixListings() {
  await mongoose.connect(MONGO_URL);
  const listings = await Listing.find({});
  console.log("Listings to update:", listings.length);

  for (let listing of listings) {
    try {
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(
          listing.location
        )}.json?key=${process.env.MAP_TOKEN}`
      );
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        listing.geometry = {
          type: "Point",
          coordinates: data.features[0].center,
        };
        await listing.save();
        console.log(
          `Updated ${listing.location}:`,
          listing.geometry.coordinates
        );
      } else {
        console.log(`Could not find location for: ${listing.location}`);
      }
    } catch (err) {
      console.log("Error:", err);
    }
  }
  console.log("Finished updating listings.");
  mongoose.connection.close();
}

fixListings();
