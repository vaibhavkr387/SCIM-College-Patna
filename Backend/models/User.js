const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, maxlength: 30 },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["student", "admin", "co-member"],
      default: "student",
      index: true
    },
    course: { type: String, enum: ["BBA", "BCA", "Other"], default: "Other" },
    semester: { type: String, trim: true, maxlength: 30 },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true
    },
    emailVerified: { type: Boolean, default: false },
    permissions: {
      manageStudents: { type: Boolean, default: false },
      manageContent: { type: Boolean, default: false },
      manageTests: { type: Boolean, default: false },
      viewAnalytics: { type: Boolean, default: false }
    },
    lastLoginAt: Date
  },
  { timestamps: true }
);

userSchema.index({ name: "text", email: "text" });

module.exports = mongoose.model("User", userSchema);
