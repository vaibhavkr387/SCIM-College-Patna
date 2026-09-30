const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, maxlength: 180 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ["new", "reviewed", "closed"], default: "new" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
