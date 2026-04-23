const configRepository = require('../repositories/configRepository');

class ConfigController {
  async getAll(req, res, next) {
    try {
      const settings = await configRepository.getAll();
      res.json(settings);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { key, value } = req.body;
      const setting = await configRepository.update(key, value);
      res.json(setting);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConfigController();
