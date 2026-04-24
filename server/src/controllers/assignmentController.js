const assignmentService = require('../services/assignmentService');

class AssignmentController {
  async getAll(req, res, next) {
    try {
      const assignments = await assignmentService.getAllAssignments();
      res.json(assignments);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = { ...req.body };
      if (!data.mediaId && !data.templateId && !data.tickerId) {
        return res.status(400).json({ message: 'Assignment must have a mediaId, templateId, or tickerId' });
      }
      if (data.startTime) data.startTime = data.startTime.padStart(5, '0');
      if (data.endTime) data.endTime = data.endTime.padStart(5, '0');
      
      const assignment = await assignmentService.createAssignment(data);
      
      // Targeted Manifest Push
      const screenService = require('../services/screenService');
      if (assignment.isGlobal) {
        await screenService.broadcastManifestUpdate();
      } else if (assignment.screenId) {
        await screenService.pushManifestToScreen(assignment.screenId);
      }

      res.status(201).json(assignment);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const assignment = await assignmentService.getAssignmentById(req.params.id);
      await assignmentService.deleteAssignment(req.params.id);
      
      // Targeted Manifest Push
      const screenService = require('../services/screenService');
      if (assignment) {
        if (assignment.isGlobal) {
          await screenService.broadcastManifestUpdate();
        } else if (assignment.screenId) {
          await screenService.pushManifestToScreen(assignment.screenId);
        }
      }

      res.json({ message: 'Assignment deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getActive(req, res, next) {
    try {
      const { screenId, groupId } = req.query;
      const assignments = await assignmentService.getActiveAssignmentsForScreen(screenId, groupId);
      res.json(assignments);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssignmentController();
