const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String },
  status: { type: String, enum: ['online', 'offline', 'maintenance'], default: 'offline' },
  macAddress: { type: String, unique: true, sparse: true },
  ipAddress: { type: String },
  deviceToken: { type: String, unique: true },
  isActive: { type: Boolean, default: true },
  resolution: { type: String, default: '1920x1080' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScreenGroup' },
  idleMediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
  lastSeen: { type: Date },
  telemetry: {
    cpuTemp: Number,
    ramUsage: Number,
    uptime: Number,
    diskSpace: Number
  },
}, { timestamps: true });

module.exports = mongoose.model('Screen', screenSchema);
