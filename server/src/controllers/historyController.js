const AuditLog = require('../models/AuditLog');

class AuditController {
  async getAll(req, res, next) {
    try {
      const logs = await AuditLog.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(100);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
