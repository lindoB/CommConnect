const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  category: { type: String, trim: true, maxlength: 80, default: 'General' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  audience: { type: String, enum: ['Everyone', 'Requesters', 'Staff', 'Managers'], default: 'Everyone' },
  status: { type: String, enum: ['Draft', 'Published', 'Archived'], default: 'Draft', index: true },
  startAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, default: null, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, versionKey: false });
module.exports = mongoose.model('Notification', schema);
