const mongoose = require('mongoose');

const tickerSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['text', 'api'], default: 'text' },
  linkUrl: { type: String },
  fontFamily: { type: String, default: 'sans-serif' },
  fontSize: { type: String, default: 'text-4xl' },
  fontWeight: { type: String, default: 'normal' },
  fontStyle: { type: String, default: 'normal' },
  color: { type: String, default: '#ffffff' },
  backgroundColor: { type: String, default: 'rgba(0,0,0,0.4)' },
  padding: { type: String, default: '0px 24px' },
  direction: { type: String, enum: ['left-right', 'right-left', 'vertical'], default: 'right-left' },
  speed: { type: Number, default: 50 },
  loopControl: { type: String, default: 'infinite' },
  targetType: { type: String, enum: ['all', 'group', 'screen'], default: 'all' },
  targetIds: [{ type: String }], // Array of Screen IDs or Group IDs
  priority: { type: Number, default: 10 },
  startTime: { type: String, default: '00:00' },
  endTime: { type: String, default: '23:59' },
  isActive: { type: Boolean, default: true },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Ticker', tickerSchema);
