const mongoose = require('mongoose');

const ScreenSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String },
    status: { type: String, default: 'offline' },
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
