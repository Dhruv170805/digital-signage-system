const Media = require('../models/Media');
const fs = require('fs');

class MediaService {
  async getAllApproved() {
    return await Media.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(2000);
  }

  async getPending() {
    return await Media.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(500);
  }

  async getByUser(userId) {
    return await Media.find({ uploadedBy: userId }).sort({ createdAt: -1 }).limit(500);
  }

  async createMedia(data) {
    const media = new Media(data);
    return await media.save();
  }

  async updateStatus(id, updateData) {
    const update = typeof updateData === 'string' ? { status: updateData } : updateData;
    return await Media.findByIdAndUpdate(id, update, { returnDocument: "after" });
  }

  async deleteMedia(id) {
    const media = await Media.findById(id);
    if (!media) return null;

    // Delete from DB first
    const deletedMedia = await Media.findByIdAndDelete(id);
    
    // Then attempt to delete file
    try {
      if (media.path && fs.existsSync(media.path)) {
        fs.unlinkSync(media.path);
      }
    } catch (err) {
      console.error(`Failed to delete physical file: ${media.path}`, err);
      // We don't throw here because the DB record is already gone, 
      // which is the primary source of truth for the app.
    }
    
    return deletedMedia;
  }
}

module.exports = new MediaService();
