const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    tabSwitches: { type: Number, default: 0, min: 0 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: Date.now },
    proctoringNotes: { type: [String], default: [] }
  },
  { timestamps: true }
);

attemptSchema.index({ testId: 1, studentId: 1 });

module.exports = mongoose.model("TestAttempt", attemptSchema);
