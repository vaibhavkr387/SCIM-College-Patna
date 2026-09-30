const express = require("express");
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again later." }
});

router.post("/login", authLimiter, asyncHandler(controller.login));
router.post("/verify-otp", authLimiter, asyncHandler(controller.verifyOtp));
router.post("/forgot-password", authLimiter, asyncHandler(controller.forgotPassword));
router.post("/reset-password", authLimiter, asyncHandler(controller.resetPassword));
router.post("/logout", asyncHandler(controller.logout));
router.get("/me", protect, asyncHandler(controller.me));

module.exports = router;
