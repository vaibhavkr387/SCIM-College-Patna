const express = require("express");
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/publicController");

const router = express.Router();

const feedbackLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});

router.post("/feedback", feedbackLimiter, asyncHandler(controller.submitFeedback));

module.exports = router;
