const AuditLog = require('../models/AuditLog');
const ErrorLog = require('../models/ErrorLog');

class LoggerService {
  async logError(error, context = {}) {
    console.error('❌ SYSTEM ERROR:', error.message, context);
    
    try {
      await ErrorLog.create({
        message: error.message,
        stack: error.stack,
        context: JSON.stringify(context),
      });
    } catch (dbError) {
      console.error('Failed to save error log to DB:', dbError.message);
    }
  }

  async logAudit(userId, action, entity, entityId = null, details = {}) {
    try {
      await AuditLog.create({
        userId,
        action,
        entity,
        entityId,
        details: JSON.stringify(details),
      });
    } catch (dbError) {
      console.error('Failed to save audit log to DB:', dbError.message);
    }
  }
}

module.exports = new LoggerService();
