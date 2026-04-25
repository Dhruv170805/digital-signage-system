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
      const { targetType, targetIds, ...rest } = req.body;
      const baseData = { ...rest };
      
      if (!baseData.mediaId) delete baseData.mediaId;
      if (!baseData.templateId) delete baseData.templateId;
      if (!baseData.tickerId) delete baseData.tickerId;
      
      if (typeof baseData.mediaMapping === 'string') {
        try { baseData.mediaMapping = JSON.parse(baseData.mediaMapping); } catch (e) {}
      }
      
      if (!baseData.name) {
        baseData.name = `Broadcast - ${new Date().toLocaleString()}`;
      }

      if (!baseData.mediaId && !baseData.templateId && !baseData.tickerId) {
        return res.status(400).json({ message: 'Assignment must have a mediaId, templateId, or tickerId' });
      }

      // Handle datetime strings
      if (baseData.startTime && baseData.startTime.includes('T')) {
        const start = new Date(baseData.startTime);
        baseData.startDate = baseData.startDate || start;
        baseData.startTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
      }
      
      if (baseData.endTime && baseData.endTime.includes('T')) {
        const end = new Date(baseData.endTime);
        baseData.endDate = baseData.endDate || end;
        baseData.endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
      }

      if (baseData.startTime) baseData.startTime = baseData.startTime.padStart(5, '0');
      if (baseData.endTime) baseData.endTime = baseData.endTime.padStart(5, '0');
      
      // Approval Logic
      baseData.status = req.user.role === 'admin' ? 'approved' : 'pending';
      
      const createdAssignments = [];
      const screenService = require('../services/screenService');

      if (targetType === 'all' || !targetIds || targetIds.length === 0) {
        const assignment = await assignmentService.createAssignment({ ...baseData, isGlobal: true });
        createdAssignments.push(assignment);
        if (assignment.status === 'approved') await screenService.broadcastManifestUpdate();
      } else {
        for (const tid of targetIds) {
          const targetedData = { ...baseData };
          if (targetType === 'screen') targetedData.screenId = tid;
          else targetedData.groupId = tid;
          
          const assignment = await assignmentService.createAssignment(targetedData);
          createdAssignments.push(assignment);
          
          if (assignment.status === 'approved') {
            if (targetType === 'screen') await screenService.pushManifestToScreen(tid);
            else {
              // Group update: find all screens in group
              const screens = await screenService.getAllScreens();
              const groupScreens = screens.filter(s => s.groupId?._id.toString() === tid || s.groupId?.toString() === tid);
              for (const gs of groupScreens) await screenService.pushManifestToScreen(gs._id);
            }
          }
        }
      }

      // Log first one for audit
      if (createdAssignments.length > 0) {
        await loggerService.logAudit(req.user.id, 'SCHEDULE', 'Assignment', createdAssignments[0]._id, { 
          bulk: createdAssignments.length > 1,
          count: createdAssignments.length,
          targetType,
          status: createdAssignments[0].status
        });
      }

      res.status(201).json(createdAssignments.length === 1 ? createdAssignments[0] : createdAssignments);
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
      const { startTime, endTime, startDate, endDate, priority, duration, targetType, targetId, ...rest } = req.body;
      const updateData = { status: 'approved', ...rest };

      if (priority) updateData.priority = Number(priority);
      if (duration) updateData.duration = Number(duration);
      if (startTime) updateData.startTime = startTime;
      if (endTime) updateData.endTime = endTime;
      if (startDate) updateData.startDate = startDate;
      if (endDate) updateData.endDate = endDate;

      // Handle targeting overrides
      if (targetType) {
        if (targetType === 'all') {
            updateData.isGlobal = true;
            updateData.screenId = null;
            updateData.groupId = null;
        } else if (targetType === 'screen') {
            updateData.isGlobal = false;
            updateData.screenId = targetId;
            updateData.groupId = null;
        } else if (targetType === 'group') {
            updateData.isGlobal = false;
            updateData.screenId = null;
            updateData.groupId = targetId;
        }
      }

      const Assignment = require('../models/Assignment');
      const assignment = await Assignment.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

      await loggerService.logAudit(req.user.id, 'APPROVE', 'Assignment', assignment._id, { 
        name: assignment.name,
        overrides: Object.keys(req.body)
      });
      
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
