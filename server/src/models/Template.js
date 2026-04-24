const mongoose = require('mongoose');

const frameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  coordinateX: { type: Number, required: true },
  coordinateY: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  zIndex: { type: Number, default: 1 },
  allowedTypes: { type: String }, // e.g. "image,video"
});

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  layoutJson: { type: String }, // For complex metadata if needed
  frames: [frameSchema],
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);
