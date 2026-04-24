const assignmentService = require('../services/assignmentService');
const loggerService = require('../services/loggerService');

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
      
      if (!data.mediaId) delete data.mediaId;
      if (!data.templateId) delete data.templateId;
      if (!data.tickerId) delete data.tickerId;
      if (!data.screenId) {
        delete data.screenId;
        data.isGlobal = true;
      }
      
      if (typeof data.mediaMapping === 'string') {
        try { data.mediaMapping = JSON.parse(data.mediaMapping); } catch (e) {}
      }
      
      if (!data.name) {
        data.name = `Broadcast - ${new Date().toLocaleString()}`;
      }

      if (!data.mediaId && !data.templateId && !data.tickerId) {
        return res.status(400).json({ message: 'Assignment must have a mediaId, templateId, or tickerId' });
      }

      // If dates come as full ISO strings from BroadcastScheduler (datetime-local), split them
      if (data.startTime && data.startTime.includes('T')) {
        const start = new Date(data.startTime);
        data.startDate = data.startDate || start;
        data.startTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
      }
      
      if (data.endTime && data.endTime.includes('T')) {
        const end = new Date(data.endTime);
        data.endDate = data.endDate || end;
        data.endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
      }

      if (data.startTime) data.startTime = data.startTime.padStart(5, '0');
      if (data.endTime) data.endTime = data.endTime.padStart(5, '0');
      
      // Approval Logic
      data.status = req.user.role === 'admin' ? 'approved' : 'pending';
      
      const assignment = await assignmentService.createAssignment(data);
      
      await loggerService.logAudit(req.user.id, 'SCHEDULE', 'Assignment', assignment._id, { 
        target: assignment.isGlobal ? 'Global' : (assignment.screenId || assignment.groupId), 
        media: assignment.mediaId, 
        template: assignment.templateId,
        status: assignment.status
      });

      // Targeted Manifest Push (only if approved)
      if (assignment.status === 'approved') {
        const screenService = require('../services/screenService');
        if (assignment.isGlobal) {
          await screenService.broadcastManifestUpdate();
        } else if (assignment.screenId) {
          await screenService.pushManifestToScreen(assignment.screenId);
        }
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
      
      await loggerService.logAudit(req.user.id, 'TERMINATE', 'Assignment', req.params.id, { 
        target: assignment ? (assignment.isGlobal ? 'Global' : (assignment.screenId || assignment.groupId)) : 'Unknown'
      });

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

  async approve(req, res, next) {
    try {
      const Assignment = require('../models/Assignment');
      const assignment = await Assignment.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
      if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

      await loggerService.logAudit(req.user.id, 'APPROVE', 'Assignment', assignment._id, { name: assignment.name });
      
      const screenService = require('../services/screenService');
      if (assignment.isGlobal) await screenService.broadcastManifestUpdate();
      else if (assignment.screenId) await screenService.pushManifestToScreen(assignment.screenId);
      
      res.json(assignment);
    } catch (error) {
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const Assignment = require('../models/Assignment');
      const assignment = await Assignment.findByIdAndUpdate(req.params.id, { 
        status: 'rejected', 
        rejectionReason: req.body.reason 
      }, { new: true });
      if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

      await loggerService.logAudit(req.user.id, 'REJECT', 'Assignment', assignment._id, { name: assignment.name, reason: req.body.reason });
      res.json(assignment);
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
