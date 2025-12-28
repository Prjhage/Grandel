const User = require("../models/user.js");
const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.renderSignupform = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginform = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = (req, res) => {
  req.flash("success", "Welcome to Wanderlust! You are logged in!");
  let redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "you are logged out!");
    res.redirect("/listings");
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
  res.render("users/wishlist.ejs", {
    listings: user.wishlist,
  });
};

module.exports.profile = async (req, res) => {
  const wishlistListings = await Listing.find({
    _id: { $in: req.user.wishlist || [] },
  });

  const bookings = await Booking.find({ user: req.user._id }).populate(
    "listing"
  );
  const myListings = await Listing.find({ Owner: req.user._id });

  res.render("users/profile.ejs", {
    user: req.user,
    wishlistListings,
    bookings,
    myListings,
  });
};
