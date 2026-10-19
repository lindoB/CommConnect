const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['Requester', 'Staff', 'Manager', 'Administrator'], default: 'Requester', index: true },
  active: { type: Boolean, default: true, index: true },
  department: { type: String, trim: true, maxlength: 100, default: null },
  tokenVersion: { type: Number, default: 0 },
  lastLoginAt: { type: Date, default: null }
}, { timestamps: true, versionKey: false });

userSchema.methods.verifyPassword = function(password) {
  return bcrypt.compare(password, this.passwordHash);
};
userSchema.methods.toSafeJSON = function() {
  return { id: this._id.toString(), name: this.name, email: this.email, role: this.role, active: this.active, department: this.department, createdAt: this.createdAt };
};
module.exports = mongoose.model('User', userSchema);
