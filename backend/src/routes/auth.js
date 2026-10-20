const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { recordAudit } = require('../services/auditService');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Please correct the submitted fields.', errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  next();
};
function issueToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role, ver: user.tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m', issuer: 'civicconnect-api', audience: 'civicconnect-client'
  });
}
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 10, max: 128 }).withMessage('Password must be 10–128 characters.')
], validate, asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  if (await User.exists({ email })) throw httpError(409, 'An account with this email already exists.');
  const passwordHash = await bcrypt.hash(req.body.password, Number(process.env.BCRYPT_ROUNDS || 12));
  const user = await User.create({ name: req.body.name, email, passwordHash, role: 'Requester' });
  await recordAudit({ ...req, user }, 'USER_REGISTERED', 'User', user._id, { role: 'Requester' });
  res.status(201).json({ success: true, message: 'Account created. You can now sign in.', user: user.toSafeJSON() });
}));
router.post('/login', [
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 1, max: 128 })
], validate, asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash');
  // Keep the response the same for unknown email and incorrect password.
  if (!user || !user.active || !(await user.verifyPassword(req.body.password))) throw httpError(401, 'Email or password is incorrect.');
  user.lastLoginAt = new Date();
  await user.save();
  const accessToken = issueToken(user);
  await recordAudit({ ...req, user }, 'USER_LOGIN', 'User', user._id);
  res.json({ success: true, accessToken, tokenType: 'Bearer', expiresIn: process.env.JWT_EXPIRES_IN || '15m', user: user.toSafeJSON() });
}));
router.get('/me', authenticate, (req, res) => res.json({ success: true, user: req.user.toSafeJSON() }));
router.patch('/profile',authenticate,[
 body('name').trim().isLength({min:2,max:100}),
 body('email').trim().isEmail().normalizeEmail()
],validate,asyncHandler(async(req,res)=>{
 const email=req.body.email.toLowerCase();
 if(await User.exists({email,_id:{$ne:req.user._id}}))throw httpError(409,'This email address is already in use.');
 req.user.name=req.body.name;
 req.user.email=email;
 await req.user.save();
 await recordAudit(req,'PROFILE_UPDATED','User',req.user._id,{fields:['name','email']});
 res.json({success:true,user:req.user.toSafeJSON()});
}));
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  req.user.tokenVersion += 1;
  await req.user.save();
  await recordAudit(req, 'USER_LOGOUT', 'User', req.user._id);
  res.json({ success: true, message: 'Signed out successfully.' });
}));
module.exports = router;
