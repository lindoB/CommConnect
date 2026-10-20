const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  actorName: { type: String, default: 'System' },
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, default: null, index: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: null },
  userAgent: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
}, { versionKey: false, strict: true });
schema.index({ createdAt: -1, action: 1 });
module.exports = mongoose.model('AuditLog', schema);
