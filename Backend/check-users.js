require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user.js");

async function checkUsers() {
    try {
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log("Connected to DB");
        const users = await User.find({}, "username email firebaseUid firebaseUID").lean();
        console.log("--- USERS IN DB ---");
        console.log(JSON.stringify(users, null, 2));
        console.log("-------------------");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkUsers();
