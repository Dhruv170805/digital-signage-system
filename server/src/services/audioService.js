const Audio = require('../models/Audio');
const fs = require('fs');
const path = require('path');

class AudioService {
  async getAllApproved() {
    return await Audio.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(1000);
  }

  async getPending() {
    return await Audio.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(500);
  }

  async getByUser(userId) {
    return await Audio.find({ uploadedBy: userId }).sort({ createdAt: -1 }).limit(500);
  }

  async createAudio(data) {
    const audio = new Audio(data);
    return await audio.save();
  }

  async updateStatus(id, updateData) {
    return await Audio.findByIdAndUpdate(id, updateData, { returnDocument: "after" });
  }

  async deleteAudio(id) {
    const audio = await Audio.findById(id);
    if (!audio) return null;

    const deletedAudio = await Audio.findByIdAndDelete(id);
    try {
      if (audio.path && fs.existsSync(audio.path)) {
        fs.unlinkSync(audio.path);
      }
    } catch (err) {
      console.error(`Failed to delete physical file: ${audio.path}`, err);
    }
    return deletedAudio;
  }
}

module.exports = new AudioService();
