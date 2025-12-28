const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
    }, ],
});

userSchema.plugin(passportLocalMongoose); //username,passport ,salting and hashing do automaticaly
module.exports = mongoose.model("User", userSchema);