const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, trim: true, maxlength: 1000 },
    course: { type: String, enum: ["BBA", "BCA", "Other"], default: "Other" },
    semester: { type: String, trim: true, maxlength: 30 },
    subject: { type: String, trim: true, maxlength: 120 },
    type: { type: String, enum: ["PDF", "DOC", "PPT", "XLS", "LINK"], default: "PDF" },
    url: { type: String, trim: true },
    storagePath: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    originalName: { type: String, trim: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    allowedRoles: { type: [String], default: ["student"] },
    published: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", materialSchema);
