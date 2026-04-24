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
      await screenService.broadcastManifestUpdate();
      res.status(201).json(ticker);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const ticker = await tickerService.update(req.params.id, req.body);
      await loggerService.logAudit(req.user.id, 'UPDATE_TICKER', 'Ticker', ticker._id, { fields: Object.keys(req.body) });
      await screenService.broadcastManifestUpdate();
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
      await screenService.broadcastManifestUpdate();
      res.json(ticker);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await tickerService.delete(req.params.id);
      await loggerService.logAudit(req.user.id, 'DELETE_TICKER', 'Ticker', req.params.id, {});
      await screenService.broadcastManifestUpdate();
      res.json({ message: 'Ticker deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TickerController();
