const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
    screenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
    mediaMapping: { type: String, default: '{}' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true, default: 10 },
    isActive: { type: Number, default: 1 }
});

ScheduleSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
