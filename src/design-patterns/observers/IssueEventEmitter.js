const EventEmitter = require('events');
const mongoose = require('mongoose');

class IssueEventEmitter extends EventEmitter {}
const issueEventEmitter = new IssueEventEmitter();

// Mongoose Audit Log Schema
const auditSchema = new mongoose.Schema({
  logId: { type: String, required: true },
  reportId: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  performedBy: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const AuditLogModel = mongoose.model('AuditLog', auditSchema);

/**
 * Observer Subscriber 1: Persists Immutable Audit Log to MongoDB (FR014, NFR011)
 */
issueEventEmitter.on('statusChanged', async ({ reportId, oldStatus, newStatus, updatedBy }) => {
  try {
    await AuditLogModel.create({
      logId: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      reportId,
      action: 'STATUS_UPDATE',
      details: `Status updated from '${oldStatus}' to '${newStatus}'`,
      performedBy: updatedBy
    });
    console.log(`[AUDIT PERSISTED TO MONGODB] Report ${reportId}: ${oldStatus} -> ${newStatus}`);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
});

/**
 * Observer Subscriber 2: Citizen Push Notification Service Simulation (FR007)
 */
issueEventEmitter.on('statusChanged', ({ reportId, newStatus }) => {
  console.log(`[NOTIFICATION SENT] Citizen notified: Report ${reportId} is now ${newStatus}`);
});

module.exports = { issueEventEmitter, AuditLogModel };