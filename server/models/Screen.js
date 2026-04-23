const mongoose = require('mongoose');

const ScreenSchema = new mongoose.Schema({
    screenId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    location: { type: String },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScreenGroup' },
    groupName: { type: String },
    deviceToken: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['online', 'offline', 'maintenance'], default: 'offline' },
    resolution: { 
        width: { type: Number, default: 1920 },
        height: { type: Number, default: 1080 }
    },
    defaultTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
    priority: { type: Number, default: 1 },
    tags: [{ type: String }],
    lastSeen: { type: Date },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

ScreenSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Screen', ScreenSchema);
