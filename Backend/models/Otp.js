const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: {
      type: String,
      enum: ["admin-login", "password-reset", "email-verification"],
      required: true
    },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 },
    consumedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Otp", otpSchema);
