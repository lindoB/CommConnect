const AuditLog = require('../models/AuditLog');
async function recordAudit(req, action, entityType, entityId, details = {}, session = null) {
  const doc = new AuditLog({ actor: req.user?._id || null, actorName: req.user?.name || 'System', action, entityType, entityId: entityId ? String(entityId) : null, details, ip: req.ip || null, userAgent: (req.get ? req.get('user-agent') : req.headers?.['user-agent']) || null });
  return doc.save(session ? { session } : {});
}
module.exports = { recordAudit };
