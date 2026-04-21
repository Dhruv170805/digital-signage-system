const mongoose = require('mongoose');

const TickerSchema = new mongoose.Schema({
    text: { type: String, required: true },
    type: { type: String, default: 'text' },
    linkUrl: { type: String },
    speed: { type: Number, default: 5 },
    fontSize: { type: String, default: 'text-4xl' },
    fontStyle: { type: String, default: 'normal' },
    isActive: { type: Number, default: 1 }
});

TickerSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Ticker', TickerSchema);
