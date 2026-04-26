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

  getMyMedia = async (req, res, next) => {
    try {
      const media = await mediaService.getByUser(req.user.id);
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
        requestedTargetType: req.body.requestedTargetType || 'all',
        requestedTargetId: req.body.requestedTargetId || null,
        uploadedBy: req.user.id
      });
      
      mediaCreated = true;
      
      await loggerService.logAudit(req.user.id, 'UPLOAD', 'Media', media._id, { 
        filename: media.originalName, 
        status: media.status,
        uploader: req.user.name || 'Operator'
      });

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
      const { startTime, endTime, startDate, endDate, priority, duration, targetType, targetId, ...rest } = req.body;
      const updateData = { status: 'approved', ...rest };
      
      // Combine date and time strings into full Date objects for Media model
      if (startDate && startTime) {
          updateData.requestedStartTime = new Date(`${startDate}T${startTime}`);
      } else if (startDate) {
          updateData.requestedStartTime = new Date(startDate);
      }

      if (endDate && endTime) {
          updateData.requestedEndTime = new Date(`${endDate}T${endTime}`);
      } else if (endDate) {
          updateData.requestedEndTime = new Date(endDate);
      }

      if (priority) updateData.requestedPriority = Number(priority);
      if (duration) updateData.requestedDuration = Number(duration);
      if (targetType) updateData.requestedTargetType = targetType;
      if (targetId) updateData.requestedTargetId = targetId;
      
      const media = await mediaService.updateStatus(req.params.id, updateData);
      if (!media) return res.status(404).json({ success: false, message: 'Media not found' });

      await loggerService.logAudit(req.user.id, 'APPROVE', 'Media', media._id, { 
        filename: media.originalName,
        approver: req.user.name || 'Admin',
        overrides: Object.keys(req.body)
      });

      // Create an assignment so it actually shows up on screens
      const assignmentService = require('../services/assignmentService');
      const assignmentData = {
          name: `Auto-Deploy: ${media.originalName}`,
          mediaId: media._id,
          priority: Number(priority) || media.requestedPriority || 1,
          duration: Number(duration) || media.requestedDuration || 10,
          startTime: startTime || (media.requestedStartTime ? new Date(media.requestedStartTime).toTimeString().slice(0,5) : '00:00'),
          endTime: endTime || (media.requestedEndTime ? new Date(media.requestedEndTime).toTimeString().slice(0,5) : '23:59'),
          startDate: startDate ? new Date(startDate) : (media.requestedStartTime || new Date()),
          endDate: endDate ? new Date(endDate) : (media.requestedEndTime || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
          status: 'approved'
      };

      const type = targetType || media.requestedTargetType || 'all';
      const tid = targetId || media.requestedTargetId;

      if (type === 'all') {
          assignmentData.isGlobal = true;
      } else if (type === 'screen' && tid) {
          assignmentData.screenId = tid;
      } else if (type === 'group' && tid) {
          assignmentData.groupId = tid;
      }

      await assignmentService.createAssignment(assignmentData);

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

  resubmit = async (req, res, next) => {
    try {
      const media = await mediaService.updateStatus(req.params.id, { 
        status: 'pending', 
        rejectionReason: null 
      });
      
      await loggerService.logAudit(req.user.id, 'RESUBMIT', 'Media', media._id, { filename: media.originalName });

      res.json(this._formatMedia(media));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MediaController();
