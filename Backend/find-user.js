require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user.js");

async function findUser() {
    try {
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log("Connected to DB");
        const user = await User.findOne({ $or: [{ username: /Prajwal/i }, { email: /Prajwal/i }, { _id: "6951024e01be4a4d6e22d95d" }] }).lean();
        if (user) {
            console.log("--- USER FOUND ---");
            console.log(JSON.stringify(user, null, 2));
            console.log("------------------");
        } else {
            console.log("User 'Prajwal' not found.");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

findUser();
