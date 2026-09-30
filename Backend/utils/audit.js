const AuditLog = require("../models/AuditLog");

async function audit(req, action, entity, entityId, metadata = {}) {
  try {
    await AuditLog.create({
      actorId: req.user?._id,
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      ip: req.ip,
      metadata
    });
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }
}

module.exports = audit;
