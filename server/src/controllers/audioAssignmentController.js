const audioAssignmentService = require('../services/audioAssignmentService');
const screenService = require('../services/screenService');

class AudioAssignmentController {
  getAll = async (req, res, next) => {
    try {
      const assignments = await audioAssignmentService.getAll();
      res.json(assignments);
    } catch (error) {
      next(error);
    }
  }

  create = async (req, res, next) => {
    try {
      const assignment = await audioAssignmentService.create({
        ...req.body,
        createdBy: req.user.id
      });
      
      // Trigger manifest update
      await screenService.broadcastManifestUpdate();
      
      res.status(201).json(assignment);
    } catch (error) {
      next(error);
    }
  }

  delete = async (req, res, next) => {
    try {
      await audioAssignmentService.delete(req.params.id);
      await screenService.broadcastManifestUpdate();
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AudioAssignmentController();
