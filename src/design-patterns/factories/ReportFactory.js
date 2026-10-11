/**
 * Base Abstract Report Class
 */
class ServiceReport {
  constructor(title, description, category, requesterId, priority = 'Medium') {
    if (this.constructor === ServiceReport) {
      throw new Error("Abstract class 'ServiceReport' cannot be instantiated directly.");
    }
    this.id = this.generateUniqueTrackingNumber();
    this.title = title;
    this.description = description;
    this.category = category;
    this.requesterId = requesterId;
    this.priority = priority;
    this.status = 'Pending';
    this.createdAt = new Date().toISOString();
    this.assignedTo = null;
  }

  generateUniqueTrackingNumber() {
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    return `${this.categoryPrefix}-${Date.now().toString().slice(-4)}-${randomHex}`;
  }
}

class RoadReport extends ServiceReport {
  constructor(title, description, requesterId, priority) {
    super(title, description, 'Roads & Stormwater', requesterId, priority);
  }
  get categoryPrefix() { return 'RD'; }
}

class WaterReport extends ServiceReport {
  constructor(title, description, requesterId, priority) {
    super(title, description, 'Water & Sanitation', requesterId, priority);
  }
  get categoryPrefix() { return 'WT'; }
}

class ElectricalReport extends ServiceReport {
  constructor(title, description, requesterId, priority) {
    super(title, description, 'Electrical', requesterId, priority);
  }
  get categoryPrefix() { return 'EL'; }
}

/**
 * Report Factory Creator Interface
 */
class ReportFactory {
  static createReport(category, title, description, requesterId, priority = 'Medium') {
    switch (category) {
      case 'Roads & Stormwater':
        return new RoadReport(title, description, requesterId, priority);
      case 'Water & Sanitation':
        return new WaterReport(title, description, requesterId, priority);
      case 'Electrical':
        return new ElectricalReport(title, description, requesterId, priority);
      default:
        throw new Error(`Invalid request category: '${category}'. Must select a predefined category.`);
    }
  }
}

module.exports = { ReportFactory, ServiceReport };