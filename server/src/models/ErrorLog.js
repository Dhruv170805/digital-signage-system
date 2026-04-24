const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  message: { type: String, required: true },
  stack: { type: String },
  context: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ErrorLog', errorLogSchema);
