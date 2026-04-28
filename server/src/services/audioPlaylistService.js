const AudioPlaylist = require('../models/AudioPlaylist');

class AudioPlaylistService {
  async getAll() {
    return await AudioPlaylist.find().populate('audios').limit(1000);
  }

  async getById(id) {
    return await AudioPlaylist.findById(id).populate('audios');
  }

  async create(data) {
    const playlist = new AudioPlaylist(data);
    return await playlist.save();
  }

  async update(id, data) {
    return await AudioPlaylist.findByIdAndUpdate(id, data, { returnDocument: "after" });
  }

  async delete(id) {
    return await AudioPlaylist.findByIdAndDelete(id);
  }
}

module.exports = new AudioPlaylistService();
