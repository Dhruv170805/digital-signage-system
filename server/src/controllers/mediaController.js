const mediaService = require('../services/mediaService');
const loggerService = require('../services/loggerService');

class MediaController {
  _formatMedia = (media) => {
    if (Array.isArray(media)) return media.map(m => this._formatMedia(m));
    if (!media) return null;

    let fileType = 'image';
    if (media.mimeType && media.mimeType.includes('pdf')) fileType = 'pdf';
    else if (media.mimeType && media.mimeType.includes('video')) fileType = 'video';
    else if (media.mimeType && media.mimeType.includes('text')) fileType = 'text';

    return {
      ...media.toObject(),
      filePath: media.path,
      fileName: media.originalName,
      fileType
    };
  }

  getAll = async (req, res, next) => {
    try {
      const media = await mediaService.getAllApproved();
      res.json(this._formatMedia(media));
    } catch (error) {
      next(error);
    }
  }

  getPending = async (req, res, next) => {
    try {
      const media = await mediaService.getPending();
      res.json(this._formatMedia(media));
    } catch (error) {
      next(error);
    }
  }

  upload = async (req, res, next) => {
    let mediaCreated = false;
    try {
      if (!req.file) throw new Error('No file uploaded');

      const media = await mediaService.createMedia({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        status: req.user.role === 'admin' ? 'approved' : 'pending',
        requestedStartTime: req.body.requestedStartTime || null,
        requestedEndTime: req.body.requestedEndTime || null,
        uploadedBy: req.user.id
      });
      
      mediaCreated = true;
      
      await loggerService.logAudit(req.user.id, 'UPLOAD', 'Media', media._id, { filename: media.originalName, status: media.status });

      if (media.status === 'approved') {
        const screenService = require('../services/screenService');
        await screenService.broadcastManifestUpdate();
      }

      res.status(201).json(this._formatMedia(media));
    } catch (error) {
      if (!mediaCreated && req.file && req.file.path) {
        const fs = require('fs');
        try { if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) {
          console.error('Failed to cleanup orphan file:', req.file.path, e.message);
        }
      }
      next(error);
    }
  }

  approve = async (req, res, next) => {
    try {
      const updateData = { status: 'approved' };
      if (req.body.startTime) updateData.requestedStartTime = req.body.startTime;
      if (req.body.endTime) updateData.requestedEndTime = req.body.endTime;
      
      const media = await mediaService.updateStatus(req.params.id, updateData);
      
      await loggerService.logAudit(req.user.id, 'APPROVE', 'Media', media._id, { filename: media.originalName });

      const screenService = require('../services/screenService');
      await screenService.broadcastManifestUpdate();
      res.json(this._formatMedia(media));
    } catch (error) {
      next(error);
    }
  }

  reject = async (req, res, next) => {
    try {
      const media = await mediaService.updateStatus(req.params.id, { 
        status: 'rejected', 
        rejectionReason: req.body.reason 
      });
      
      await loggerService.logAudit(req.user.id, 'REJECT', 'Media', media._id, { filename: media.originalName, reason: req.body.reason });

      res.json(this._formatMedia(media));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MediaController();
