const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedStartTime: { type: Date },
  requestedEndTime: { type: Date },
  requestedPriority: { type: Number, default: 1 },
  requestedDuration: { type: Number, default: 10 },
  requestedTargetType: { type: String, enum: ['all', 'screen', 'group'], default: 'all' },
  requestedTargetId: { type: String },
  rejectionReason: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema);
