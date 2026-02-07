require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user.js");

async function migrate() {
    try {
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log("Connected to DB for migration");

        // Find users with firebaseUID and move it to firebaseUid
        const result = await User.updateMany(
            { firebaseUID: { $exists: true } },
            [
                {
                    $set: {
                        firebaseUid: { $ifNull: ["$firebaseUid", "$firebaseUID"] }
                    }
                },
                {
                    $unset: "firebaseUID"
                }
            ]
        );

        console.log(`Migration completed. Modified ${result.modifiedCount} users.`);
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
