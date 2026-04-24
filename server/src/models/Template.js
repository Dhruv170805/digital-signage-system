const mongoose = require('mongoose');

const frameSchema = new mongoose.Schema({
  i: { type: String, required: true },
  x: { type: Number, required: true, min: 0, max: 11 },
  y: { type: Number, required: true, min: 0, max: 11 },
  w: { type: Number, required: true, min: 1, max: 12 },
  h: { type: Number, required: true, min: 1, max: 12 },
  type: { type: String, enum: ['media', 'ticker', 'widget'], default: 'media' },
  zIndex: { type: Number, default: 1 },
});

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  layout: { 
    type: String,
    validate: {
      validator: function(v) {
        try {
          const parsed = JSON.parse(v);
          if (!Array.isArray(parsed)) return false;
          // Mathematical validation: prevent grid blowout at DB layer
          return parsed.every(zone => 
            typeof zone.x === 'number' && typeof zone.y === 'number' && 
            typeof zone.w === 'number' && typeof zone.h === 'number' &&
            zone.w + zone.x <= 12 && zone.w >= 1 && zone.h >= 1
          );
        } catch { return false; }
      },
      message: 'Invalid layout JSON or bounds blowout.'
    }
  }, 
  frames: [frameSchema],
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);
