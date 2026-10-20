const mongoose = require('mongoose');
const eventSchema = new mongoose.Schema({
  type: { type: String, required: true },
  label: { type: String, required: true },
  from: { type: String, default: null },
  to: { type: String, default: null },
  note: { type: String, maxlength: 2000, default: '' },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });
const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 3000 },
  visibility: { type: String, enum: ['Public', 'Internal'], default: 'Public' },
  createdAt: { type: Date, default: Date.now }
});
const requestSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 4, maxlength: 160 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 10000 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium', index: true },
  status: { type: String, enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Rejected'], default: 'Submitted', index: true },
  location: { type: String, trim: true, maxlength: 300, required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  department: { type: String, trim: true, default: null, index: true },
  dueAt: { type: Date, default: null, index: true },
  resolvedAt: { type: Date, default: null },
  attachments: [{ originalName: {type:String,required:true}, storedName: {type:String,required:true}, mimeType: String, size: Number, uploadedAt: {type:Date,default:Date.now} }],
  comments: [commentSchema],
  events: [eventSchema],
  version: { type: Number, default: 0 }
}, { timestamps: true, versionKey: false });
requestSchema.index({ status: 1, priority: -1, createdAt: -1 });
requestSchema.index({ title: 'text', description: 'text', number: 'text', location: 'text' });
module.exports = mongoose.model('ServiceRequest', requestSchema);
