const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
    // Content reference
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
    
    // Multi-Screen Targeting
    targetType: { 
        type: String, 
        enum: ['screen', 'group', 'all'], 
        required: true,
        default: 'all'
    },
    targetIds: [{ type: mongoose.Schema.Types.ObjectId }], // Array of Screen IDs or Group IDs
    
    // Layout & Mapping
    mediaMapping: { type: String, default: '{}' }, // JSON string for template zones
    
    // Date & Time Scheduling
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, default: "00:00" }, // e.g., "09:00"
    endTime: { type: String, default: "23:59" },   // e.g., "17:00"
    daysOfWeek: [{ 
        type: Number, 
        min: 0, 
        max: 6,
        default: [0, 1, 2, 3, 4, 5, 6] // All days by default
    }],
    
    // Playback Logic
    duration: { type: Number, required: true, default: 10 }, // seconds per loop
    priority: { type: Number, default: 10 }, // Higher wins
    loopBehavior: { 
        type: String, 
        enum: ['continuous', 'count', 'time-bound'], 
        default: 'continuous' 
    },
    loopCount: { type: Number, default: 0 },
    
    // Status
    isActive: { type: Number, default: 1 }, // 1=active, 0=paused
    status: { 
        type: String, 
        enum: ['scheduled', 'running', 'paused', 'completed', 'expired'],
        default: 'scheduled'
    },
    
    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
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
