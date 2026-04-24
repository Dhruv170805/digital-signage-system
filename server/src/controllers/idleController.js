const idleService = require('../services/idleService');
const screenService = require('../services/screenService');
const loggerService = require('../services/loggerService');

class IdleController {
  async getAll(req, res, next) {
    try {
      const configs = await idleService.getAll();
      res.json(configs);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const config = await idleService.create(req.body);
      await loggerService.logAudit(req.user.id, 'CREATE_IDLE', 'IdleConfig', config._id, { name: config.name });
      await screenService.broadcastManifestUpdate();
      res.status(201).json(config);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const config = await idleService.update(req.params.id, req.body);
      await loggerService.logAudit(req.user.id, 'UPDATE_IDLE', 'IdleConfig', config._id, { name: config.name });
      await screenService.broadcastManifestUpdate();
      res.json(config);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const config = await idleService.delete(req.params.id);
      await loggerService.logAudit(req.user.id, 'DELETE_IDLE', 'IdleConfig', req.params.id, {});
      await screenService.broadcastManifestUpdate();
      res.json({ message: 'Idle config deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IdleController();
