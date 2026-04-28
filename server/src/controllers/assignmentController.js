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
      
      if (baseData.endDate) {
        const end = new Date(baseData.endDate);
        end.setHours(23, 59, 59, 999);
        baseData.endDate = end;
      }

      // Approval Logic
      baseData.status = req.user.role === 'admin' ? 'approved' : 'pending';
      
      const createdAssignments = [];
      const screenService = require('../services/screenService');

      const validTargetIds = (targetIds || []).filter(id => id && id.length > 0);

      if (targetType === 'all' || validTargetIds.length === 0) {
        const assignment = await assignmentService.createAssignment({ ...baseData, isGlobal: true });
        createdAssignments.push(assignment);
        if (assignment.status === 'approved') await screenService.broadcastManifestUpdate();
      } else {
        for (const tid of validTargetIds) {
          const targetedData = { ...baseData };
          if (targetType === 'screen') {
              targetedData.screenId = tid || null;
              targetedData.groupId = null;
          } else if (targetType === 'group') {
              targetedData.groupId = tid || null;
              targetedData.screenId = null;
          } else {
              targetedData.isGlobal = true;
          }
          
          const assignment = await assignmentService.createAssignment(targetedData);
          createdAssignments.push(assignment);
          
          if (assignment.status === 'approved') {
            if (targetType === 'screen') await screenService.pushManifestToScreen(tid);
            else {
              // Group update: find all screens in group
              const screens = await screenService.getScreensByGroup(tid);
              for (const gs of screens) await screenService.pushManifestToScreen(gs._id);
            }
          }
        }
      }

      // Log first one for audit with full metadata for history
      if (createdAssignments.length > 0) {
        await loggerService.logAudit(req.user.id, 'SCHEDULE', 'Assignment', createdAssignments[0]._id, { 
          name: baseData.name,
          targetType,
          targetIds,
          startDate: baseData.startDate,
          endDate: baseData.endDate,
          startTime: baseData.startTime,
          endTime: baseData.endTime,
          mediaMapping: baseData.mediaMapping,
          templateId: baseData.templateId,
          mediaId: baseData.mediaId,
          tickerId: baseData.tickerId,
          priority: baseData.priority,
          duration: baseData.duration
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
      if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

      await assignmentService.deleteAssignment(req.params.id);
      
      await loggerService.logAudit(req.user.id, 'TERMINATE', 'Assignment', req.params.id, { 
        target: assignment.isGlobal ? 'Global' : (assignment.screenId || assignment.groupId)
      });

      // Targeted Manifest Push
      const screenService = require('../services/screenService');
      if (assignment.isGlobal) {
        await screenService.broadcastManifestUpdate();
      } else if (assignment.screenId) {
        await screenService.pushManifestToScreen(assignment.screenId);
      } else if (assignment.groupId) {
        const screens = await screenService.getScreensByGroup(assignment.groupId);
        for (const s of screens) {
          await screenService.pushManifestToScreen(s._id);
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
      if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          updateData.endDate = end;
      }

      // Handle targeting overrides
      if (targetType) {
        if (targetType === 'all') {
            updateData.isGlobal = true;
            updateData.screenId = null;
            updateData.groupId = null;
        } else if (targetType === 'screen') {
            updateData.isGlobal = false;
            updateData.screenId = (targetId && targetId.length > 0) ? targetId : null;
            updateData.groupId = null;
        } else if (targetType === 'group') {
            updateData.isGlobal = false;
            updateData.screenId = null;
            updateData.groupId = (targetId && targetId.length > 0) ? targetId : null;
        }
      }

      const Assignment = require('../models/Assignment');
      const assignment = await Assignment.findByIdAndUpdate(req.params.id, updateData, { returnDocument: "after" });
      if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

      await loggerService.logAudit(req.user.id, 'APPROVE', 'Assignment', assignment._id, { 
        name: assignment.name,
        overrides: Object.keys(req.body)
      });
      
      const screenService = require('../services/screenService');
      if (assignment.status === 'approved') {
        if (assignment.isGlobal) {
          await screenService.broadcastManifestUpdate();
        } else if (assignment.screenId) {
          await screenService.pushManifestToScreen(assignment.screenId);
        } else if (assignment.groupId) {
          const screens = await screenService.getScreensByGroup(assignment.groupId);
          for (const s of screens) {
            await screenService.pushManifestToScreen(s._id);
          }
        }
      }
      
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
      }, { returnDocument: "after" });
      if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

      await loggerService.logAudit(req.user.id, 'REJECT', 'Assignment', assignment._id, { name: assignment.name, reason: req.body.reason });
      res.json(assignment);
    } catch (error) {
      next(error);
    }
  }

  async getActive(req, res, next) {
    try {
      const { screenId, groupId } = req.query;
      const normalizedGroupId = (groupId && groupId.length > 0) ? groupId : null;
      const assignments = await assignmentService.getActiveAssignmentsForScreen(screenId, normalizedGroupId);
      res.json(assignments);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssignmentController();
