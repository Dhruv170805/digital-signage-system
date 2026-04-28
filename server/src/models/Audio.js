const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  duration: { type: Number, required: true }, // duration in seconds
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Audio', audioSchema);
