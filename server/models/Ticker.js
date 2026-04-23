const mongoose = require('mongoose');

const TickerSchema = new mongoose.Schema({
    text: { type: String, required: true },
    type: { type: String, enum: ['text', 'link', 'api'], default: 'text' },
    linkUrl: { type: String }, // Used if type is 'link' or 'api'
    
    // Visuals
    fontFamily: { type: String, default: 'sans-serif' },
    fontSize: { type: String, default: '48px' },
    fontWeight: { type: String, default: 'normal' },
    fontStyle: { type: String, default: 'normal' },
    color: { type: String, default: '#ffffff' },
    backgroundColor: { type: String, default: 'rgba(0, 0, 0, 0.4)' },
    gradient: { type: String },
    padding: { type: String, default: '0px 24px' },
    spacing: { type: String, default: 'normal' },
    shadow: { type: String, default: 'none' },

    // Animation
    direction: { type: String, enum: ['left-right', 'right-left', 'vertical'], default: 'right-left' },
    speed: { type: Number, default: 50 }, // px per second
    loopControl: { type: String, enum: ['infinite', 'fixed'], default: 'infinite' },
    loopCount: { type: Number, default: 0 },
    loopDelay: { type: Number, default: 0 }, // ms delay between loops

    // Targetting & Scheduling
    targetType: { type: String, enum: ['global', 'screen', 'group'], default: 'global' },
    targetIds: [{ type: mongoose.Schema.Types.ObjectId }],
    
    startDate: { type: Date },
    endDate: { type: Date },
    startTime: { type: String, default: '00:00' },
    endTime: { type: String, default: '23:59' },
    daysOfWeek: [{ type: Number, min: 0, max: 6, default: [0, 1, 2, 3, 4, 5, 6] }],
    
    priority: { type: Number, default: 10 },
    isActive: { type: Number, default: 1 },
    
    createdAt: { type: Date, default: Date.now }
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
