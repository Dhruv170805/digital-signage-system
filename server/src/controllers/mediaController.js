const mediaService = require('../services/mediaService');
const mediaRepository = require('../repositories/mediaRepository');

class MediaController {
  async getAll(req, res, next) {
    try {
      const media = await mediaRepository.getAllApproved();
      res.json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  }

  async getPending(req, res, next) {
    try {
      const media = await mediaRepository.getPending();
      res.json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  }

  async upload(req, res, next) {
    try {
      if (!req.file) {
        const error = new Error('No file uploaded');
        error.statusCode = 400;
        throw error;
      }

      const media = await mediaService.uploadMedia(req.file, req.body, req.user);
      res.status(201).json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  }

  async approve(req, res, next) {
    try {
      const media = await mediaService.approveMedia(req.params.id, req.user.id);
      res.json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MediaController();
