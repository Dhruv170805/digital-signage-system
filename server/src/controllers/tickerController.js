const tickerService = require('../services/tickerService');

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
      res.status(201).json(ticker);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const ticker = await tickerService.update(req.params.id, req.body);
      res.json(ticker);
    } catch (error) {
      next(error);
    }
  }

  async toggle(req, res, next) {
    try {
      const { isActive } = req.body;
      const ticker = await tickerService.update(req.params.id, { isActive: !!isActive });
      res.json(ticker);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await tickerService.delete(req.params.id);
      res.json({ message: 'Ticker deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TickerController();
