const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { recordAudit } = require('../services/auditService');

const roles = ['Requester', 'Staff', 'Manager', 'Administrator'];
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({ success: false, message: 'Please check the user information.', errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
}
function esc(value) { return String(value).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Managers may list active staff in their department to assign requests, but
// only Administrators can use the broader user-management CRUD endpoints.
router.get('/assignable', authenticate, authorize('Administrator', 'Manager'), asyncHandler(async (req, res) => {
  const filter = { active: true, role: { $in: ['Staff', 'Manager'] } };
  if (req.user.role === 'Manager') {
    if (!req.user.department) return res.json({ success: true, data: [] });
    filter.department = req.user.department;
  }
  const items = await User.find(filter).sort({ name: 1 }).limit(300);
  res.json({ success: true, data: items.map(u => u.toSafeJSON()) });
}));

router.use(authenticate, authorize('Administrator'));
router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const filter = {};
  if (req.query.role) {
    if (!roles.includes(req.query.role)) throw httpError(400, 'Invalid role filter.');
    filter.role = req.query.role;
  }
  if (req.query.active !== undefined) {
    if (!['true', 'false'].includes(String(req.query.active))) throw httpError(400, 'Invalid active filter.');
    filter.active = req.query.active === 'true';
  }
  if (req.query.q) filter.$or = [{ name: new RegExp(esc(req.query.q), 'i') }, { email: new RegExp(esc(req.query.q), 'i') }];
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter)
  ]);
  res.json({ success: true, data: users.map(u => u.toSafeJSON()), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, 'User not found.');
  res.json({ success: true, data: user.toSafeJSON() });
}));
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 10, max: 128 }),
  body('role').isIn(roles),
  body('department').optional({ nullable: true }).isString().isLength({ max: 100 })
], validate, asyncHandler(async (req, res) => {
  if (await User.exists({ email: req.body.email })) throw httpError(409, 'An account with this email already exists.');
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    passwordHash: await bcrypt.hash(req.body.password, Number(process.env.BCRYPT_ROUNDS || 12)),
    role: req.body.role,
    department: (req.body.department || '').trim() || null
  });
  await recordAudit(req, 'USER_CREATED', 'User', user._id, { role: user.role });
  res.status(201).json({ success: true, data: user.toSafeJSON() });
}));
router.patch('/:id', [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('password').optional().isString().isLength({ min: 10, max: 128 }),
  body('role').optional().isIn(roles),
  body('department').optional({ nullable: true }).isString().isLength({ max: 100 }),
  body('active').optional().isBoolean()
], validate, asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw httpError(404, 'User not found.');
  if (String(target._id) === String(req.user._id)) {
    if (req.body.active === false) throw httpError(400, 'You cannot deactivate your own account.');
    if (req.body.role && req.body.role !== target.role) throw httpError(400, 'You cannot change your own administrator role.');
  }
  if (req.body.email && req.body.email !== target.email && await User.exists({ email: req.body.email, _id: { $ne: target._id } })) {
    throw httpError(409, 'This email address is already in use.');
  }
  if (req.body.active === false && target.role === 'Staff' && target.active) {
    const assigned = await ServiceRequest.countDocuments({ assignee: target._id, status: { $nin: ['Resolved', 'Closed', 'Rejected'] } });
    if (assigned) throw httpError(409, `Reassign ${assigned} open request(s) before deactivating this staff account.`);
  }
  const changed = [];
  for (const key of ['name', 'email', 'role', 'department', 'active']) {
    if (req.body[key] === undefined) continue;
    const value = key === 'department' ? ((req.body[key] || '').trim() || null) : req.body[key];
    if (target[key] !== value) { target[key] = value; changed.push(key); }
  }
  if (req.body.password) { target.passwordHash = await bcrypt.hash(req.body.password, Number(process.env.BCRYPT_ROUNDS || 12)); changed.push('password'); }
  if (!changed.length) return res.json({ success: true, data: target.toSafeJSON() });
  if (changed.some(k => ['role', 'email', 'active', 'password'].includes(k))) target.tokenVersion += 1;
  await target.save();
  await recordAudit(req, 'USER_UPDATED', 'User', target._id, { changedFields: changed });
  res.json({ success: true, data: target.toSafeJSON() });
}));
// Deliberate SOFT delete: retain request history, comments and audit references.
router.delete('/:id', asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw httpError(404, 'User not found.');
  if (target.role !== 'Staff') throw httpError(400, 'This delete action is for staff accounts only. Use account activation controls for other roles.');
  if (!target.active) return res.json({ success: true, message: 'Staff account was already deactivated.', data: target.toSafeJSON() });
  const count = await ServiceRequest.countDocuments({ assignee: target._id, status: { $nin: ['Resolved', 'Closed', 'Rejected'] } });
  if (count) throw httpError(409, `Reassign ${count} open request(s) before removing this staff member.`);
  target.active = false;
  target.tokenVersion += 1;
  await target.save();
  await recordAudit(req, 'STAFF_DEACTIVATED', 'User', target._id, { softDelete: true });
  res.json({ success: true, message: 'Staff account deactivated; historical records retained.', data: target.toSafeJSON() });
}));
module.exports = router;
