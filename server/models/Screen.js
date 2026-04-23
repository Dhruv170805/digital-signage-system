const mongoose = require('mongoose');

const ScreenSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScreenGroup' },
    status: { type: String, enum: ['online', 'offline', 'maintenance'], default: 'offline' },
    resolution: { 
        width: { type: Number, default: 1920 },
        height: { type: Number, default: 1080 }
    },
    defaultTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
    priority: { type: Number, default: 1 },
    tags: [{ type: String }],
    lastPing: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

ScreenSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Screen', ScreenSchema);
