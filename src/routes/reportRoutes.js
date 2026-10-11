const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { ReportModel, ReportFactory } = require('../models/ReportModel');
const { issueEventEmitter, AuditLogModel } = require('../design-patterns/observers/IssueEventEmitter');
const { authenticateToken, authorizeRoles, JWT_SECRET } = require('../middleware/auth');

/**
 * Public Authentication Route (FR002)
 */
router.post('/auth/login', (req, res) => {
  const { username, role } = req.body;
  if (!username || !role) {
    return res.status(400).json({ success: false, message: 'Username and Role are required.' });
  }

  const payload = { userId: `USR-${Math.floor(Math.random() * 1000)}`, username, role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });

  return res.json({ success: true, token, user: payload });
});

/**
 * Create Service Request Route using Factory Pattern (FR003, FR004, FR005)
 * Role: Requester
 */
router.post('/reports', authenticateToken, authorizeRoles('Requester'), async (req, res) => {
  const { title, description, category, priority } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ success: false, message: 'Title, description, and category are mandatory.' });
  }

  try {
    const reportData = ReportFactory.createReportData(category, title, description, req.user.username, priority);
    const newReport = await ReportModel.create(reportData);

    return res.status(201).json({
      success: true,
      message: 'Service request created successfully in MongoDB.',
      data: newReport
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Get Citizen Reports (FR006, FR007)
 */
router.get('/reports/my-requests', authenticateToken, authorizeRoles('Requester'), async (req, res) => {
  try {
    const reports = await ReportModel.find({ requesterId: req.user.username });
    return res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Update Status Route using Observer Pattern (FR011, FR014)
 * Role: Staff
 */
router.patch('/reports/:id/status', authenticateToken, authorizeRoles('Staff'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const report = await ReportModel.findOne({ id: id });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const oldStatus = report.status;
    report.status = status;
    await report.save();

    // Trigger Observer Event
    issueEventEmitter.emit('statusChanged', {
      reportId: report.id,
      oldStatus,
      newStatus: status,
      updatedBy: req.user.username
    });

    return res.json({
      success: true,
      message: 'Report status updated successfully.',
      data: report
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * View System Audit Trail (FR023, NFR005)
 * Role: Admin
 */
router.get('/admin/audit-logs', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const logs = await AuditLogModel.find().sort({ timestamp: -1 });
    return res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;