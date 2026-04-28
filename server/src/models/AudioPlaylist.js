const mongoose = require('mongoose');

const audioPlaylistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  audios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Audio' }],
  loopType: { type: String, enum: ['sequential', 'shuffle', 'loop'], default: 'sequential' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('AudioPlaylist', audioPlaylistSchema);
