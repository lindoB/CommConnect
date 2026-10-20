const mongoose = require('mongoose');
function notFound(req, res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.status = 404; next(err);
}
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = err.status || 500;
  let message = err.message || 'Internal server error.';
  if (err instanceof mongoose.Error.ValidationError) { status = 400; message = Object.values(err.errors).map(e => e.message).join(', '); }
  if (err instanceof mongoose.Error.CastError) { status = 400; message = 'Invalid identifier.'; }
  if (err.code === 11000) { status = 409; message = 'A record with that unique value already exists.'; }
  if (err.name === 'ValidationError' && err.errors) { status = 400; message = Object.values(err.errors).map(e => e.message).join(', '); }
  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, message: status >= 500 && process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : message, ...(process.env.NODE_ENV !== 'production' && status >= 500 ? { stack: err.stack } : {}) });
}
module.exports = { notFound, errorHandler };
