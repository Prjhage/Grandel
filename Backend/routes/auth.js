const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { verifyFirebaseToken } = require("../middleware/firebaseAuth");
const n8nService = require("../services/n8nService");

// Secure OTP generation
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Route to send OTP via n8n for mobile verification.
 */
router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const otp = generateOTP();

    // Store OTP in session
    req.session.otp = {
      code: otp,
      phone: phone,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    };

    console.log(`Sending OTP ${otp} to ${phone} (Expires at: ${new Date(req.session.otp.expiresAt).toISOString()})`);

    const result = await n8nService.sendOTP(phone, otp);

    if (result.success) {
      res.json({ success: true, message: "OTP sent successfully" });
    } else {
      res.status(500).json({ error: "Failed to send OTP", details: result.error });
    }
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * Route to verify the OTP sent to the user's mobile.
 */
router.post("/verify-otp", async (req, res) => {
  const { phone, code } = req.body;
  const sessionOtp = req.session.otp;

  if (!sessionOtp) {
    return res.status(400).json({ error: "No OTP found. Please request a new one." });
  }

  if (Date.now() > sessionOtp.expiresAt) {
    console.log(`OTP Expired. Now: ${new Date().toISOString()}, ExpiresAt: ${new Date(sessionOtp.expiresAt).toISOString()}`);
    delete req.session.otp;
    return res.status(400).json({ error: "OTP has expired. Please request a new one." });
  }


  if (sessionOtp.phone === phone && sessionOtp.code === code) {
    // OTP is valid!
    delete req.session.otp;

    // Store proof of verification in session for registration flow
    req.session.verifiedPhone = phone;

    // Perform login or registration logic here (for Login flow)
    res.json({ success: true, message: "OTP verified successfully" });
  } else {

    res.status(400).json({ error: "Invalid OTP code." });
  }
});

router.post("/firebase-login", verifyFirebaseToken, async (req, res) => {


  try {
    const { uid, email } = req.firebaseUser;

    // 1. Check if user exists by Firebase UID
    let user = await User.findOne({ firebaseUid: uid });

    // 2. If not found, check by email (to link existing accounts)
    if (!user) {
      user = await User.findOne({ email: email });
      if (user) {
        user.firebaseUid = uid;
        await user.save();
      }
    }

    // 3. If still no user, create a new one
    if (!user) {
      let username = email.split("@")[0];
      // Check for username collision
      const checkUser = await User.findOne({ username });
      if (checkUser) {
        username += Math.floor(Math.random() * 10000);
      }

      user = new User({ username, email, firebaseUid: uid });
      await user.save();
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }
      res.json({ success: true });
    });
  } catch (err) {
    console.error("Firebase Login Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
