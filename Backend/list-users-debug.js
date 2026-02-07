require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user.js");

async function listAllUsers() {
    try {
        await mongoose.connect(process.env.ATLASDB_URL);
        const users = await User.find({}, "username email role").lean();
        console.log("--- REGISTERED USERS ---");
        users.forEach(u => {
            console.log(`Username: ${u.username} | Email: ${u.email} | Role: ${u.role}`);
        });
        console.log("------------------------");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

listAllUsers();
