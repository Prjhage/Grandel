const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./reviews");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  category: {
    type: String,
    enum: ["beach", "urban", "mountain", "castles", "pools", "forest", "camping", "arctic", "lakefront", "domes", "iconic", "rooms", "trending", "countryside"],
  },
  image: {
    url: String,
    filename: String,
  },
  images: [
    {
      url: String,
      filename: String,
    },
  ],
  amenities: {
    type: [String],
    default: [],
  },
  price: Number,
  location: String,
  country: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  avgRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },

  ratingCount: {
    type: Number,
    default: 0,
    min: 0,
  },

  Owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  // Room and Guest Configuration
  numRooms: {
    type: Number,
    default: 1,
    min: 1,
  },
  guestsPerRoom: {
    type: Number,
    default: 2,
    min: 1,
  },
  // Guest and Pet Settings (Host-controlled)
  petsAllowed: {
    type: Boolean,
    default: false,
  },
  petChargePerNight: {
    type: Number,
    default: 300,
    min: 0,
  },
  geometry: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
  travelCompanion: {
    places: [
      {
        name: String,
        image: String,
      },
    ],
    food: [
      {
        name: String,
        image: String,
      },
    ],
  },
});
const Booking = require("./booking");

listingSchema.post("findOneAndDelete", async function (listing) {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
    await Booking.deleteMany({ listing: listing._id });
  }
});
listingSchema.index({ geometry: "2dsphere" });

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
