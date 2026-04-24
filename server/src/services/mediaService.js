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

  async updateStatus(id, updateData) {
    const update = typeof updateData === 'string' ? { status: updateData } : updateData;
    return await Media.findByIdAndUpdate(id, update, { new: true });
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
