require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user.js");

async function verifyCredentials() {
    try {
        await mongoose.connect(process.env.ATLASDB_URL);
        const users = await User.find({}).lean();
        console.log("--- CREDENTIAL VERIFICATION ---");
        users.forEach(u => {
            const hasPass = (u.hash && u.salt) ? "YES" : "NO";
            const hasFirebase = u.firebaseUid || u.firebaseUID ? "YES" : "NO";
            console.log(`User: ${u.username} | Email: ${u.email} | PassAuth: ${hasPass} | FirebaseAuth: ${hasFirebase}`);
        });
        console.log("-------------------------------");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyCredentials();
