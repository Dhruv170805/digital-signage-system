const mediaRepository = require('../repositories/mediaRepository');
const fs = require('fs');
const socketService = require('./socketService');

class MediaService {
  async uploadMedia(fileData, bodyData, uploader) {
    const { filename, path: filePath, mimetype, size, originalname } = fileData;
    const { duration } = bodyData;
    
    let fileType = 'image';
    if (mimetype.includes('pdf')) fileType = 'pdf';
    if (mimetype.includes('video')) fileType = 'video';

    let status = uploader.role === 'admin' ? 'approved' : 'pending';

    try {
      const newMedia = await mediaRepository.create({
        filename,
        originalName: originalname,
        path: filePath,
        mimeType: mimetype,
        size,
        status,
        uploadedBy: uploader.id,
      });

      if (status === 'approved') {
        socketService.broadcast('contentUpdate');
      }

      return newMedia;
    } catch (error) {
      // FIX: Ensure file is deleted if DB creation fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  async approveMedia(id, adminId) {
    const media = await mediaRepository.update(id, { status: 'approved' });
    socketService.broadcast('contentUpdate');
    return media;
  }
}

module.exports = new MediaService();
