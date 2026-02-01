const Listing = require("./models/listing");
const Review = require("./models/reviews");
const { listingSchema, listingUpdateSchema, reviewSchema } = require("./schema.js");
const expresserror = require("./utils/expresserror.js");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // redirectURL so that user is returned after login
        req.session.redirectUrl = req.originalUrl;

        return res.status(401).json({ message: "You must be logged in to do that!" });
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session && req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
        delete req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    try {
        let { id } = req.params;
        let listing = await Listing.findById(id);

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        const currentUser = req.user;
        if (!listing.Owner || !currentUser || !listing.Owner.equals(currentUser._id)) {
            return res.status(403).json({ message: "You do not have permission to do that" });
        }
        next();
    } catch (e) {
        next(e);
    }
};

module.exports.isAuthor = async (req, res, next) => {
    try {
        let { id, reviewId } = req.params;
        let review = await Review.findById(reviewId);

        if (!review.author || !review.author.equals(req.user._id)) {
            return res.status(403).json({ message: "You did not write this review" });
        }
        next();
    } catch (e) {
        next(e);
    }
};

// Helper to set nested properties
const set = (obj, path, value) => {
    const parts = path.split(/[\[\]]/).filter(p => p !== "");
    let current = obj;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
            current[part] = value;
        } else {
            current[part] = current[part] || {};
            current = current[part];
        }
    }
};

const unflattenBody = (body) => {
    const newBody = {};
    for (const key in body) {
        let val = body[key];
        if (val === "true") val = true;
        if (val === "false") val = false;
        set(newBody, key, val);
    }
    return newBody;
};

module.exports.validateListing = (req, res, next) => {
    const body = unflattenBody(req.body);

    let { error } = listingSchema.validate(body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new expresserror(errMsg, 400);
    } else {
        req.body = body;
        next();
    }
};

module.exports.validateListingUpdate = (req, res, next) => {
    const body = unflattenBody(req.body);
    req.body = body;
    next();
};
module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new expresserror(errMsg, 400);
    } else {
        next();
    }
};