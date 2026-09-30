const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, maxlength: 1000 },
    type: { type: String, enum: ["mcq", "short"], default: "mcq" },
    options: { type: [String], default: [] },
    answer: { type: String, select: false },
    marks: { type: Number, default: 1, min: 0 }
  },
  { _id: true }
);

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    subject: { type: String, trim: true, maxlength: 120 },
    course: { type: String, enum: ["BBA", "BCA", "Other"], default: "Other" },
    semester: { type: String, trim: true, maxlength: 30 },
    durationMinutes: { type: Number, default: 15, min: 1, max: 240 },
    questions: { type: [questionSchema], default: [] },
    published: { type: Boolean, default: false },
    startsAt: Date,
    endsAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Test", testSchema);
