const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require("bcrypt");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },

    firebaseUid: {
        type: String,
        unique: true,
        sparse: true,
    },

    username: {
        type: String,
        required: true,
    },

    phoneHash: {
        type: String,
    },

    phoneLast4: {
        type: String,
    },

    role: {
        type: String,
        enum: ["user", "host", "partner"],
        default: "user",
    },


    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
    }, ],


    avatar: {
        url: {
            type: String,
            default: "/images/default-user.png",
        },
        filename: String,
    },

    // 🏷️ Status (future use)
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true }, );

userSchema.statics.hashPhone = async function(phone) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(phone, salt);
};

userSchema.plugin(passportLocalMongoose); //username,passport ,salting and hashing do automaticaly
module.exports = mongoose.model("User", userSchema);