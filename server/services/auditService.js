const AuditLog = require('../models/AuditLog');

class AuditService {
    /**
     * Logs an action to the immutable audit trail.
     * @param {Object} params
     * @param {String} params.actionType - 'UPLOAD', 'APPROVE', 'REJECT', 'SCHEDULE', 'RESET', etc.
     * @param {String} params.entityType - 'Media', 'Schedule', 'Screen', 'User', 'System'
     * @param {ObjectId|String} params.entityId - ID of the affected entity
     * @param {ObjectId|String} params.userId - ID of the user performing the action
     * @param {ObjectId|String} [params.screenId] - Optional ID of the affected screen
     * @param {Object} [params.previousState] - State before the action
     * @param {Object} [params.newState] - State after the action
     * @param {String} [params.reason] - Reason for the action (e.g., rejection reason)
     */
    static async log(params) {
        try {
            await AuditLog.create({
                actionType: params.actionType,
                entityType: params.entityType,
                entityId: params.entityId,
                userId: params.userId,
                screenId: params.screenId,
                previousState: params.previousState,
                newState: params.newState,
                reason: params.reason
            });
        } catch (error) {
            console.error('Failed to write audit log. Critical system error.', error);
            // In a highly strict environment, we might throw here to prevent the action if logging fails.
        }
    }
}

module.exports = AuditService;
