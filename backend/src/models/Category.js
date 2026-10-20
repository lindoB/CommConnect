const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 300, default: '' },
  active: { type: Boolean, default: true, index: true },
  color: { type: String, default: '#dceefa', match: /^#[0-9a-fA-F]{6}$/ }
}, { timestamps: true, versionKey: false });
module.exports = mongoose.model('Category', schema);
