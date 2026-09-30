const mongoose = require("mongoose");

const doubtSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, trim: true, maxlength: 120 },
    question: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ["open", "in-progress", "resolved"], default: "open", index: true },
    reply: { type: String, trim: true, maxlength: 5000 },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doubt", doubtSchema);
