const screenService = require('../services/screenService');
const loggerService = require('../services/loggerService');

class ScreenController {
  async getAll(req, res, next) {
    try {
      const screens = await screenService.getAllScreens();
      res.json(screens);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const screen = await screenService.getScreenById(req.params.id);
      if (!screen) return res.status(404).json({ message: 'Screen not found' });
      res.json(screen);
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

  async resetScreen(req, res, next) {
    try {
      const { targetType, targetId } = req.body; // targetType: 'screen', 'group', 'all'
      const Assignment = require('../models/Assignment');
      const socketService = require('../services/socketService');

      let query = {};
      if (targetType === 'screen' && targetId) {
        query = { screenId: targetId };
      } else if (targetType === 'group' && targetId) {
        query = { groupId: targetId };
      } else if (targetType === 'all') {
        query = {}; // all assignments
      } else {
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
