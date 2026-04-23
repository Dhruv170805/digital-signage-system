const mongoose = require('mongoose');

const ScreenGroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    createdAt: { type: Date, default: Date.now }
});

ScreenGroupSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('ScreenGroup', ScreenGroupSchema);
