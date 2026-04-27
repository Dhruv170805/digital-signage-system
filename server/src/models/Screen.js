const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  screenId: { type: String, required: true, unique: true }, // Human-readable unique ID
  name: { type: String, required: true },
  location: { type: String },
  status: { type: String, enum: ['online', 'offline', 'maintenance'], default: 'offline' },
  macAddress: { type: String, unique: true, sparse: true },
  ipAddress: { type: String },
  dns: { type: String },
  gateway: { type: String },
  subnet: { type: String },
  deviceToken: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  resolution: { type: String, default: '1920x1080' },
  groupId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ScreenGroup',
    set: v => v === '' ? null : v
  },
  lastSeen: { type: Date },
  telemetry: {
    cpuTemp: Number,
    ramUsage: Number,
    uptime: Number,
    diskSpace: Number
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for registration URL
screenSchema.virtual('registrationUrl').get(function() {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${baseUrl}/display?token=${this.deviceToken}`;
});

module.exports = mongoose.model('Screen', screenSchema);
