
const express = require('express');
const AuditLog = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Only administrators may view audit records.
router.use(authenticate, authorize('Administrator'));

router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit, 10) || 50)
  );

  const filter = {};

  if (req.query.from || req.query.to) {
    filter.createdAt = {};

    if (req.query.from) {
      const from = new Date(`${req.query.from}T00:00:00.000Z`);

      if (Number.isNaN(from.getTime())) {
        return res.status(400).json({
          message: 'Invalid from date.'
        });
      }

      filter.createdAt.$gte = from;
    }

    if (req.query.to) {
      const to = new Date(`${req.query.to}T23:59:59.999Z`);

      if (Number.isNaN(to.getTime())) {
        return res.status(400).json({
          message: 'Invalid to date.'
        });
      }

      filter.createdAt.$lte = to;
    }
  }

  const [data, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    AuditLog.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data,
    total,
    page,
    limit
  });
}));

module.exports = router;
