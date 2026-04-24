const Ticker = require('../models/Ticker');

class TickerService {
  async getAll() {
    return await Ticker.find().sort({ priority: -1 });
  }

  async getById(id) {
    return await Ticker.findById(id);
  }

  async create(data) {
    const ticker = new Ticker(data);
    return await ticker.save();
  }

  async update(id, data) {
    return await Ticker.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await Ticker.findByIdAndDelete(id);
  }
}

module.exports = new TickerService();
