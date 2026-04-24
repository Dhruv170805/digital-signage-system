const Media = require('../models/Media');
const fs = require('fs');

class MediaService {
  async getAllApproved() {
    return await Media.find({ status: 'approved' }).sort({ createdAt: -1 });
  }

  async getPending() {
    return await Media.find({ status: 'pending' }).sort({ createdAt: -1 });
  }

  async createMedia(data) {
    const media = new Media(data);
    return await media.save();
  }

  async updateStatus(id, status) {
    return await Media.findByIdAndUpdate(id, { status }, { new: true });
  }

  async deleteMedia(id) {
    const media = await Media.findById(id);
    if (media && fs.existsSync(media.path)) {
      fs.unlinkSync(media.path);
    }
    return await Media.findByIdAndDelete(id);
  }
}

module.exports = new MediaService();
