const configService = require('../services/configService');
const loggerService = require('../services/loggerService');
const screenService = require('../services/screenService');
const Assignment = require('../models/Assignment');
const Media = require('../models/Media');

class ConfigController {
  async getAll(req, res, next) {
    try {
      const config = await configService.getFullConfig();
      res.json(config);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const updates = req.body;
      for (const [key, value] of Object.entries(updates)) {
        await configService.setConfig(key, value);
      }
      
      await loggerService.logAudit(req.user.id, 'UPDATE_SETTINGS', 'System', null, { keys: Object.keys(updates) });
      
      // Notify all screens about global setting changes
      await screenService.broadcastManifestUpdate();
      
      res.json({ message: 'Settings updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async wipeSystem(req, res, next) {
    try {
      await Assignment.deleteMany({});
      await Media.deleteMany({});
      
      await loggerService.logAudit(req.user.id, 'WIPE_SYSTEM', 'System', null, { details: 'Full database purge executed' });
      
      await screenService.broadcastManifestUpdate();
      
      res.json({ message: 'System wiped successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConfigController();
