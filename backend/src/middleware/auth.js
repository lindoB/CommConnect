const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw httpError(401, 'Authentication required.');
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'civicconnect-api', audience: 'civicconnect-client' }); }
  catch { throw httpError(401, 'Session is invalid or expired. Please sign in again.'); }
  const user = await User.findById(payload.sub);
  if (!user || !user.active || user.tokenVersion !== payload.ver) throw httpError(401, 'Session is no longer valid.');
  req.user = user;
  next();
});
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(httpError(403, 'You do not have permission to perform this action.'));
    next();
  };
}
module.exports = { authenticate, authorize };
