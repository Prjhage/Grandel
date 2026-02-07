require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user.js");
const Listing = require("./models/listing.js");
const Booking = require("./models/booking.js");

async function checkDataAssociation() {
    try {
        await mongoose.connect(process.env.ATLASDB_URL);
        const user = await User.findOne({ username: /Prajwal/i }).lean();
        if (!user) {
            console.log("User not found.");
            return;
        }

        console.log(`--- Checking Data for ${user.username} (${user._id}) ---`);

        const listings = await Listing.find({ Owner: user._id }).lean();
        console.log(`Owned Listings: ${listings.length}`);
        listings.forEach(l => console.log(` - Listing: ${l.title}`));

        const bookings = await Booking.find({ user: user._id }).lean();
        console.log(`Bookings made: ${bookings.length}`);

        console.log(`Wishlist items: ${user.wishlist ? user.wishlist.length : 0}`);
        console.log("-----------------------------------------");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkDataAssociation();
