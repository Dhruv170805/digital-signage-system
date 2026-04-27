const mongoose = require('mongoose');

const frameSchema = new mongoose.Schema({
  i: { type: String, required: true },
  x: { type: Number, required: true, min: 0, max: 100 },
  y: { type: Number, required: true, min: 0, max: 100 },
  w: { type: Number, required: true, min: 1, max: 100 },
  h: { type: Number, required: true, min: 1, max: 100 },
  type: { type: String, enum: ['media', 'ticker', 'widget'], default: 'media' },
  zIndex: { type: Number, default: 1 },
});

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  layout: { 
    type: String,
    validate: {
      validator: function(v) {
        try {
          if (!v) return true;
          const parsed = JSON.parse(v);
          if (!Array.isArray(parsed)) return false;
          // Percentage validation: coordinates + dimensions should not exceed 100%
          return parsed.every(zone => 
            zone.i && typeof zone.i === 'string' &&
            typeof zone.x === 'number' && typeof zone.y === 'number' && 
            typeof zone.w === 'number' && typeof zone.h === 'number' &&
            zone.w >= 1 && zone.h >= 1
          );
        } catch { return false; }
      },
      message: 'Invalid layout JSON format or missing required fields (i, x, y, w, h).'
    }
  }, 
  frames: [frameSchema],
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);
