const tickerRepository = require('../repositories/tickerRepository');

class TickerController {
  async getAll(req, res, next) {
    try {
      const tickers = await tickerRepository.getAll();
      res.json(tickers);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const ticker = await tickerRepository.getById(req.params.id);
      if (!ticker) return res.status(404).json({ message: 'Ticker not found' });
      res.json(ticker);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const ticker = await tickerRepository.create(req.body);
      res.status(201).json(ticker);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const ticker = await tickerRepository.update(req.params.id, req.body);
      res.json(ticker);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TickerController();
