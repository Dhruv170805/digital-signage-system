const tickerService = require('../services/tickerService');
const screenService = require('../services/screenService');
const loggerService = require('../services/loggerService');

class TickerController {
  async getAll(req, res, next) {
    try {
      const tickers = await tickerService.getAll();
      res.json(tickers);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const ticker = await tickerService.create(req.body);
      await loggerService.logAudit(req.user.id, 'CREATE_TICKER', 'Ticker', ticker._id, { text: ticker.text });
      
      if (ticker.isActive) {
        if (ticker.targetType === 'all') {
          await screenService.broadcastManifestUpdate();
        } else if (ticker.targetType === 'screen') {
          for (const sid of ticker.targetIds) await screenService.pushManifestToScreen(sid);
        } else if (ticker.targetType === 'group') {
          for (const gid of ticker.targetIds) {
            const screens = await screenService.getScreensByGroup(gid);
            for (const s of screens) await screenService.pushManifestToScreen(s._id);
          }
        }
      }
      
      res.status(201).json(ticker);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const ticker = await tickerService.update(req.params.id, req.body);
      await loggerService.logAudit(req.user.id, 'UPDATE_TICKER', 'Ticker', ticker._id, { fields: Object.keys(req.body) });
      
      if (ticker.targetType === 'all') {
        await screenService.broadcastManifestUpdate();
      } else {
        // For screen/group, push to all screens that might be affected
        // Also might need to push to screens that WERE in the group/ids if they changed,
        // but broadcast is safer if we don't track changes easily.
        // For now, let's keep it simple and push to current targets.
        if (ticker.targetType === 'screen') {
          for (const sid of ticker.targetIds) await screenService.pushManifestToScreen(sid);
        } else if (ticker.targetType === 'group') {
          for (const gid of ticker.targetIds) {
            const screens = await screenService.getScreensByGroup(gid);
            for (const s of screens) await screenService.pushManifestToScreen(s._id);
          }
        }
      }
      
      res.json(ticker);
    } catch (error) {
      next(error);
    }
  }

  async toggle(req, res, next) {
    try {
      const { isActive } = req.body;
      const ticker = await tickerService.update(req.params.id, { isActive: !!isActive });
      await loggerService.logAudit(req.user.id, 'TOGGLE_TICKER', 'Ticker', ticker._id, { isActive: !!isActive });
      
      if (ticker.targetType === 'all') {
        await screenService.broadcastManifestUpdate();
      } else if (ticker.targetType === 'screen') {
        for (const sid of ticker.targetIds) await screenService.pushManifestToScreen(sid);
      } else if (ticker.targetType === 'group') {
        for (const gid of ticker.targetIds) {
          const screens = await screenService.getScreensByGroup(gid);
          for (const s of screens) await screenService.pushManifestToScreen(s._id);
        }
      }
      
      res.json(ticker);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const ticker = await tickerService.getById(req.params.id);
      await tickerService.delete(req.params.id);
      await loggerService.logAudit(req.user.id, 'DELETE_TICKER', 'Ticker', req.params.id, {});
      
      if (ticker) {
        if (ticker.targetType === 'all') {
          await screenService.broadcastManifestUpdate();
        } else if (ticker.targetType === 'screen') {
          for (const sid of ticker.targetIds) await screenService.pushManifestToScreen(sid);
        } else if (ticker.targetType === 'group') {
          for (const gid of ticker.targetIds) {
            const screens = await screenService.getScreensByGroup(gid);
            for (const s of screens) await screenService.pushManifestToScreen(s._id);
          }
        }
      }
      
      res.json({ message: 'Ticker deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TickerController();
