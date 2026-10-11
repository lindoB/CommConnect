const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  requesterId: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'], default: 'Pending' },
  assignedTo: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const ReportModel = mongoose.model('Report', reportSchema);

/**
 * Factory Method Pattern Implementation for MongoDB
 */
class ReportFactory {
  static createReportData(category, title, description, requesterId, priority) {
    let prefix = 'GEN';
    if (category === 'Roads & Stormwater') prefix = 'RD';
    else if (category === 'Water & Sanitation') prefix = 'WT';
    else if (category === 'Electrical') prefix = 'EL';

    const uniqueId = `${prefix}-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      id: uniqueId,
      title,
      description,
      category,
      requesterId,
      priority: priority || 'Medium',
      status: 'Pending'
    };
  }
}

module.exports = { ReportModel, ReportFactory };