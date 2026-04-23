const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    actionType: { type: String, required: true }, // e.g., 'UPLOAD', 'APPROVE', 'REJECT', 'SCHEDULE', 'RESET'
    entityType: { type: String, enum: ['Media', 'Schedule', 'Screen', 'User', 'System'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who performed the action
    screenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' }, // Impacted screen, if applicable
    previousState: { type: mongoose.Schema.Types.Mixed }, // JSON snapshot before change
    newState: { type: mongoose.Schema.Types.Mixed }, // JSON snapshot after change
    reason: { type: String }, // E.g., rejection reason or reset reason
    timestamp: { type: Date, default: Date.now, immutable: true }
});

AuditLogSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
