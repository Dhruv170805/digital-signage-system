const mongoose = require('mongoose');

const audioAssignmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  playlistId: { type: mongoose.Schema.Types.ObjectId, ref: 'AudioPlaylist', required: true },
  
  // Targets
  targetType: { type: String, enum: ['all', 'screen', 'group'], default: 'all' },
  targetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    set: v => v === '' ? null : v 
  },
  
  // Timing
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startTime: { type: String, required: true }, // HH:mm
  endTime: { type: String, required: true },   // HH:mm
  daysOfWeek: [Number], // [0, 1, 2, 3, 4, 5, 6]
  
  // Control
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  volume: { type: Number, default: 100 }, // 0-100
  isActive: { type: Boolean, default: true },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.once ? null : mongoose.model('AudioAssignment', audioAssignmentSchema);
