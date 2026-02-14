const mongoose = require("mongoose");
const Listing = require("./models/listing");
const dotenv = require("dotenv");
dotenv.config();

async function testAggregation() {
    try {
        await mongoose.connect(process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust");
        console.log("Connected to DB");

        const sampleListing = await Listing.findOne({ Owner: { $exists: true } });
        if (!sampleListing) {
            console.log("No listings found with an owner.");
            return;
        }

        const ownerId = sampleListing.Owner;
        console.log(`Testing aggregation for Owner ID: ${ownerId}`);

        const hostStats = await Listing.aggregate([
            { $match: { Owner: ownerId } },
            {
                $group: {
                    _id: "$Owner",
                    totalReviews: { $sum: "$ratingCount" },
                    weightedSum: { $sum: { $multiply: ["$avgRating", "$ratingCount"] } },
                    listingsCount: { $sum: 1 }
                },
            },
        ]);

        if (hostStats.length > 0) {
            const { totalReviews, weightedSum, listingsCount } = hostStats[0];
            const avgRating = totalReviews > 0 ? weightedSum / totalReviews : 0;
            console.log(`\nHost Stats:`);
            console.log(`- Listings Count: ${listingsCount}`);
            console.log(`- Total Reviews: ${totalReviews}`);
            console.log(`- Aggregate Average Rating: ${avgRating.toFixed(2)}`);

            // Detailed validation
            const hostListings = await Listing.find({ Owner: ownerId });
            let manualReviews = 0;
            let manualWeightedSum = 0;
            hostListings.forEach(l => {
                manualReviews += (l.ratingCount || 0);
                manualWeightedSum += ((l.avgRating || 0) * (l.ratingCount || 0));
                console.log(`  Listing: ${l.title} | Reviews: ${l.ratingCount} | Rating: ${l.avgRating}`);
            });
            console.log(`\nManual Calculation:`);
            console.log(`- Total Reviews: ${manualReviews}`);
            console.log(`- Average Rating: ${(manualReviews > 0 ? manualWeightedSum / manualReviews : 0).toFixed(2)}`);

            if (totalReviews === manualReviews) {
                console.log("\n✅ SUCCESS: Aggregation logic is correct.");
            } else {
                console.log("\n❌ FAILURE: Aggregation logic mismatch.");
            }
        } else {
            console.log("No stats found for this owner.");
        }

    } catch (err) {
        console.error("Test error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

testAggregation();
