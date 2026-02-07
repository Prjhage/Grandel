require("dotenv").config();
const mongoose = require("mongoose");

const dburl = process.env.ATLASDB_URL;
console.log("Testing connection to:", dburl ? "URL found" : "URL MISSING");

if (!dburl) {
    console.error("ATLASDB_URL is missing in .env");
    process.exit(1);
}

mongoose.connect(dburl)
    .then(() => {
        console.log("✅ Successfully connected to MongoDB Atlas!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Connection failed:", err.message);
        process.exit(1);
    });
