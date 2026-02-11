const User = require("../models/user.js");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
const passport = require("passport");



module.exports.firebaseRegister = async (req, res, next) => {
    try {
        const { idToken, username, phone } = req.body;


        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email } = decodedToken;


        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            if (existingUser.username === username) {
                return res
                    .status(409)
                    .json({ message: "Username already exists. Please choose another." });
            } else {
                return res
                    .status(409)
                    .json({ message: "Email is already registered. Please log in." });
            }
        }

        if (!phone) {
            return res.status(400).json({ message: "Phone number is required." });
        }

        // Security check: Match session verified phone with body phone
        if (!req.session.verifiedPhone || req.session.verifiedPhone !== phone) {
            return res.status(403).json({
                message: "Mobile number verification required. Please verify with OTP before signing up."
            });
        }

        // Clear verification proof after use
        delete req.session.verifiedPhone;



        const phoneHash = await bcrypt.hash(phone, 10);
        const phoneLast4 = phone.slice(-4);


        const newUser = new User({
            email,
            username,
            phoneHash,
            phoneLast4,
            firebaseUid: uid, // Link to Firebase account
            avatar: { url: decodedToken.picture || "", filename: "firebase-profile" },
        });


        const registeredUser = await newUser.save();


        req.login(registeredUser, (err) => {
            if (err) return next(err);
            return res.status(200).json({
                success: true,
                message: "Registration successful",
                user: registeredUser
            });
        });
    } catch (e) {
        console.error("Firebase Registration Error:", e);
        res.status(500).json({ message: e.message });
    }
};


module.exports.firebaseLogin = async (req, res, next) => {
    try {
        const { idToken, email, password } = req.body;
        console.log(`Login attempt started. Body: ${JSON.stringify({ idToken: idToken ? "PROVIDED" : "MISSING", email, password: password ? "***" : "MISSING" })}`);

        if (idToken) {
            // Firebase Auth flow
            console.log("Verifying Firebase ID token...");
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const { uid } = decodedToken;
            console.log(`Token verified. UID: ${uid}, Email: ${decodedToken.email}`);

            // Find user in local database
            const user = await User.findOne({
                $or: [{ firebaseUid: uid }, { email: decodedToken.email }],
            });

            if (!user) {
                console.log("User not found in local DB for Firebase login.");
                return res
                    .status(404)
                    .json({ message: "User not found. Please sign up first." });
            }

            // Update firebaseUid for legacy users (Migration)
            if (!user.firebaseUid) {
                user.firebaseUid = uid;
                await user.save();
                console.log("Updated legacy user with Firebase UID.");
            }

            // Log the user in to create a session
            req.login(user, (err) => {
                if (err) {
                    console.log(`req.login failed: ${err.message}`);
                    return next(err);
                }
                console.log("Firebase login successful.");
                const redirectUrl = res.locals.redirectUrl || "/listings";
                return res.status(200).json({
                    success: true,
                    message: "Login successful",
                    user: user,
                    redirectUrl
                });
            });
        } else if (email && password) {
            // Fallback for existing users without Firebase Auth
            console.log(`Email/Password login attempt for: ${email}`);
            // Try to find user by email first, then by username if email fails
            let user = await User.findOne({ email });

            if (!user) {
                console.log("User not found by email, checking username...");
                // If not found by email, try by username (for legacy accounts)
                user = await User.findOne({ username: email });
            }

            if (!user) {
                console.log("User not found.");
                return res
                    .status(404)
                    .json({ message: "User not found. Please sign up first." });
            }

            if (!user.hash || !user.salt) {
                console.log("User has no hash/salt (legacy/social?), logging in directly.");
                req.login(user, (err) => {
                    if (err) return next(err);
                    const redirectUrl = res.locals.redirectUrl || "/listings";
                    return res.status(200).json({
                        success: true,
                        message: "Login successful",
                        user: user,
                        redirectUrl
                    });
                });
            } else {
                console.log("Authenticating with passport local...");
                req.body.username = user.username; // Passport local strategy expects username

                passport.authenticate("local", (err, authenticatedUser, info) => {
                    if (err) {
                        console.log(`Passport error: ${err.message}`);
                        return next(err);
                    }
                    if (!authenticatedUser) {
                        logToFile(`Authentication failed. Info: ${JSON.stringify(info)}`);
                        return res.status(401).json({ message: "Invalid credentials." });
                    }

                    req.login(authenticatedUser, (err) => {
                        if (err) return next(err);
                        logToFile("Passport login successful.");
                        const redirectUrl = res.locals.redirectUrl || "/listings";
                        return res.status(200).json({
                            success: true,
                            message: "Login successful",
                            user: authenticatedUser,
                            redirectUrl
                        });
                    });
                })(req, res, next);
            }
        } else {
            logToFile("Invalid login request: Missing credentials.");
            return res.status(400).json({ message: "Invalid login request." });
        }
    } catch (e) {
        console.log(`Login Exception: ${e.message}`);
        console.error("Firebase Login Error:", e);
        res
            .status(401)
            .json({ message: "Authentication failed. Please try again." });
    }
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.json({ success: true, message: "Logged out" });
    });
};

module.exports.toggleWishlist = async (req, res) => {
    const listingId = req.params.id;
    const user = await User.findById(req.user._id);

    if (user.wishlist.indexOf(listingId) !== -1) {
        user.wishlist.pull(listingId); // remove
    } else {
        user.wishlist.push(listingId); // save
    }
    await user.save();
    res.json({ success: true });
};

module.exports.getWishlist = async (req, res) => {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.json({ listings: user.wishlist });
};

module.exports.profile = async (req, res) => {
    try {
        // Fetch fresh user data to ensure wishlist and other properties are up to date
        const user = await User.findById(req.user._id);

        const wishlistListings = await Listing.find({
            _id: { $in: user.wishlist || [] },
        });

        const bookings = await Booking.find({ user: user._id }).populate(
            "listing",
        );
        const myListings = await Listing.find({ Owner: user._id });

        res.json({
            user: user,
            wishlistListings,
            bookings,
            myListings,
        });
    } catch (err) {
        console.error("Profile Controller Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.updateProfilePhoto = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (req.file) {
            // If there's an uploaded file, update the avatar
            user.avatar = {
                url: req.file.path,
                filename: req.file.filename,
            };
            await user.save();

            // Update the session user data
            req.user.avatar = user.avatar;

            res.json({ success: true, message: "Profile photo updated successfully!" });
        } else {
            res.status(400).json({ success: false, message: "No file uploaded. Please select an image." });
        }
    } catch (error) {
        console.error("Profile photo update error:", error);
        res.status(500).json({ success: false, message: "Failed to update profile photo. Please try again." });
    }
};

module.exports.hostDashboard = async (req, res) => {
    // Fetch bookings for listings owned by the current user (host)
    const hostBookings = await Booking.find()
        .populate({
            path: "listing",
            match: { Owner: req.user._id }, // Only listings owned by the current user
        })
        .populate("user") // The guest who made the booking
        .populate("partner"); // The booking partner

    // Filter out bookings where listing is null (not owned by the user)
    const filteredBookings = hostBookings.filter(
        (booking) => booking.listing !== null,
    );


    const upcoming = filteredBookings.filter((b) => b.status === "upcoming");
    const confirmed = filteredBookings.filter((b) => b.status === "confirmed");
    const completed = filteredBookings.filter((b) => b.status === "completed");
    const cancelled = filteredBookings.filter((b) => b.status === "cancelled");

    res.json({
        upcoming,
        confirmed,
        completed,
        cancelled,
    });
};