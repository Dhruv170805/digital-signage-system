const audioService = require('../services/audioService');
const loggerService = require('../services/loggerService');

class AudioController {
  getAllApproved = async (req, res, next) => {
    try {
      const audios = await audioService.getAllApproved();
      res.json(audios);
    } catch (error) {
      next(error);
    }
  }

  getPending = async (req, res, next) => {
    try {
      const audios = await audioService.getPending();
      res.json(audios);
    } catch (error) {
      next(error);
    }
  }

  upload = async (req, res, next) => {
    try {
      if (!req.file) throw new Error('No audio file uploaded');

      // In a real scenario, we'd use music-metadata here.
      // For now, we'll expect duration from body or use a default.
      const duration = req.body.duration || 30; 

      const audio = await audioService.createAudio({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        duration: Number(duration),
        status: req.user.role === 'admin' ? 'approved' : 'pending',
        uploadedBy: req.user.id
      });

      await loggerService.logAudit(req.user.id, 'UPLOAD_AUDIO', 'Audio', audio._id, {
        filename: audio.originalName
      });

      res.status(201).json(audio);
    } catch (error) {
      next(error);
    }
  }

  approve = async (req, res, next) => {
    try {
      const audio = await audioService.updateStatus(req.params.id, { status: 'approved' });
      await loggerService.logAudit(req.user.id, 'APPROVE_AUDIO', 'Audio', audio._id);
      res.json(audio);
    } catch (error) {
      next(error);
    }
  }

  reject = async (req, res, next) => {
    try {
      const audio = await audioService.updateStatus(req.params.id, { status: 'rejected' });
      await loggerService.logAudit(req.user.id, 'REJECT_AUDIO', 'Audio', audio._id);
      res.json(audio);
    } catch (error) {
      next(error);
    }
  }

  delete = async (req, res, next) => {
    try {
      await audioService.deleteAudio(req.params.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AudioController();
