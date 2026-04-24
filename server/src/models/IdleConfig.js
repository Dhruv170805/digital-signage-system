const mongoose = require('mongoose');

const idleConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },

  targetType: {
    type: String,
    enum: ["screen", "group", "all"],
    required: true
  },

  targetIds: [{ type: String }], // [screenId] OR [groupId] OR []

  contentType: {
    type: String,
    enum: ["image", "text", "video", "color"],
    required: true
  },

  content: {
    url: String,        // for image/video
    text: String,       // for text
    bgColor: String     // for color fallback
  },

  style: {
    fontSize: { type: Number, default: 48 },
    color: { type: String, default: '#ffffff' },
    align: { type: String, default: 'center' },
    fontWeight: { type: String, default: 'bold' },
    background: { type: String, default: 'transparent' }
  },

  priority: { type: Number, default: 10 }, // screen: 100, group: 50, all: 10
  isActive: { type: Boolean, default: true }

}, { timestamps: true });

idleConfigSchema.index({ targetType: 1, targetId: 1, isActive: 1, priority: -1 });

module.exports = mongoose.model('IdleConfig', idleConfigSchema);
