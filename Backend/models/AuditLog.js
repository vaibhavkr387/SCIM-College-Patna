const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true, trim: true, maxlength: 120 },
    entity: { type: String, trim: true, maxlength: 120 },
    entityId: { type: String, trim: true, maxlength: 120 },
    ip: { type: String, trim: true, maxlength: 120 },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

auditSchema.index({ createdAt: -1 });
module.exports = mongoose.model("AuditLog", auditSchema);
