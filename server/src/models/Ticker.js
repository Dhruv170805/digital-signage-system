const mongoose = require('mongoose');

const tickerSchema = new mongoose.Schema({
  text: { type: String, required: true },
  speed: { type: Number, default: 5 },
  direction: { type: String, enum: ['left', 'right', 'up', 'down'], default: 'left' },
  fontColor: { type: String, default: '#FFFFFF' },
  backgroundColor: { type: String, default: '#000000' },
  fontSize: { type: String, default: 'text-2xl' },
  priority: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Ticker', tickerSchema);
