const Feedback = require("../models/Feedback");
const asyncHandler = require("../utils/asyncHandler");

const submitFeedback = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  if (!message || String(message).trim().length < 5) {
    return res.status(400).json({ message: "Please provide a meaningful feedback message." });
  }

  await Feedback.create({ name, email, message });
  res.status(201).json({ message: "Feedback received. Thank you." });
});

module.exports = { submitFeedback };
