const screenService = require('../services/screenService');
const loggerService = require('../services/loggerService');
const QRCode = require('qrcode');

class ScreenController {
  async getAll(req, res, next) {
    try {
      const screens = await screenService.getAllScreens();
      const screensWithQr = await Promise.all(screens.map(async (s) => {
        const screenObj = s.toObject();
        screenObj.qrCode = await QRCode.toDataURL(s.registrationUrl);
        return screenObj;
      }));
      res.json(screensWithQr);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const screen = await screenService.getScreenById(req.params.id);
      if (!screen) return res.status(404).json({ message: 'Screen not found' });
      
      const screenObj = screen.toObject();
      screenObj.qrCode = await QRCode.toDataURL(screen.registrationUrl);
      
      res.json(screenObj);
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const screen = await screenService.registerScreen(req.body);
      await loggerService.logAudit(req.user.id, 'REGISTER', 'Screen', screen._id, { name: screen.name });
      res.status(201).json(screen);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const screen = await screenService.updateScreen(req.params.id, req.body);
      await loggerService.logAudit(req.user.id, 'UPDATE', 'Screen', screen._id, { fields: Object.keys(req.body) });
      res.json(screen);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const screen = await screenService.deleteScreen(req.params.id);
      if (!screen) return res.status(404).json({ message: 'Screen not found' });
      await loggerService.logAudit(req.user.id, 'DELETE', 'Screen', req.params.id, { name: screen.name });
      res.json({ message: 'Screen deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getLiveStatus(req, res, next) {
    try {
      const assignmentService = require('../services/assignmentService');
      const AuditLog = require('../models/AuditLog');
      const Assignment = require('../models/Assignment');
      const screens = await screenService.getAllScreens();
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const liveStatus = await Promise.all(screens.map(async (s) => {
        const active = await assignmentService.getActiveAssignmentsForScreen(s._id, s.groupId?._id || s.groupId);
        
        // Fetch upcoming (scheduled for later today or future)
        const upcoming = await Assignment.find({
          $or: [{ screenId: s._id }, { groupId: s.groupId?._id || s.groupId }, { isGlobal: true }],
          isActive: true,
          status: 'approved',
          $or: [
            { startDate: { $gt: now } },
            { startDate: { $lte: now }, endDate: { $gte: now }, startTime: { $gt: currentTime } }
          ]
        }).populate('mediaId templateId tickerId').sort({ startDate: 1, startTime: 1 }).limit(5);

        // History from AuditLog
        const history = await AuditLog.find({
          entity: 'Screen',
          entityId: s._id.toString()
        }).sort({ createdAt: -1 }).limit(5);

        return {
          screenId: s._id,
          screenName: s.name,
          location: s.location,
          status: s.status,
          lastSeen: s.lastSeen,
          telemetry: s.telemetry,
          deviceToken: s.deviceToken,
          groupId: s.groupId?._id || s.groupId,
          current: active,
          queue: upcoming,
          history: history
        };
      }));

      res.json(liveStatus);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res) {
    const { screenId, name, groupId } = req.screen;
    res.json({
      screenId,
      name,
      groupName: groupId?.name || 'Unassigned',
      status: "online"
    });
  }

  async getManifest(req, res, next) {
    try {
      const { _id, groupId } = req.screen;
      const manifest = await screenService.getManifest(_id, groupId);
      res.json({
        screen: req.screen,
        ...manifest
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublicManifest(req, res, next) {
    try {
      const manifest = await screenService.getPublicManifest();
      res.json({
        screen: { name: 'Public Terminal', isPublic: true },
        ...manifest
      });
    } catch (error) {
      next(error);
    }
  }

  async resetScreen(req, res, next) {
    try {
      const { targetType, targetId } = req.body; // targetType: 'screen', 'group', 'all'
      const Assignment = require('../models/Assignment');
      const socketService = require('../services/socketService');

      let query = {};
      const isValidId = targetId && targetId.toString().length > 0;

      if (targetType === 'screen' && isValidId) {
        query = { screenId: targetId };
      } else if (targetType === 'group' && isValidId) {
        query = { groupId: targetId };
      } else if (targetType === 'all') {
        query = {}; // all assignments
      } else {
        // If an ID was expected but is empty, don't perform a partial match query
        return res.status(400).json({ success: false, error: 'Invalid target type or missing target ID' });
      }

      // Clear assignments
      await Assignment.deleteMany(query);
      
      await loggerService.logAudit(req.user.id, 'RESET', 'Screen', targetType === 'all' ? null : targetId, { targetType });

      // Force screens to update (stopping playback by sending empty manifest)
      if (targetType === 'screen') {
         await screenService.pushManifestToScreen(targetId);
      } else if (targetType === 'group') {
         // Push to group (need to get screens in group)
         const screens = await screenService.getAllScreens();
         const groupScreens = screens.filter(s => s.groupId && s.groupId.toString() === targetId);
         for(const s of groupScreens) {
             await screenService.pushManifestToScreen(s._id);
         }
      } else {
         await screenService.broadcastManifestUpdate();
      }

      res.json({ message: 'Reset successful' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ScreenController();
