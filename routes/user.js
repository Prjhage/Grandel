const express = require("express");
// const { model } = require("mongoose");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
const userController = require("../controllers/users.js");

//router .routes for signup
router
  .route("/signup")
  .get(userController.renderSignupform) // signup form
  .post(wrapAsync(userController.signup)); // signup logic

//router. routes for login
router
  .route("/login")
  .get((req, res) => {
    res.render("users/login.ejs");
  }) // login form
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login
  ); // login logic

//logout
router.get("/logout", userController.logout);

//wishlist
router.post(
  "/wishlist/:id",
  isLoggedIn,
  wrapAsync(userController.toggleWishlist)
);

router.get("/wishlist", isLoggedIn, wrapAsync(userController.getWishlist));

//profile
router.get("/profile", isLoggedIn, wrapAsync(userController.profile));

module.exports = router;
