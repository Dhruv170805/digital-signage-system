const mongoose = require('mongoose');

const screenGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  screens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Screen' }],
}, { timestamps: true });

module.exports = mongoose.model('ScreenGroup', screenGroupSchema);
