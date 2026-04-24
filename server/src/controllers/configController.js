const Assignment = require('../models/Assignment');
const Media = require('../models/Media');

class ConfigController {
  async getAll(req, res, next) {
    try {
      // Mocking global settings if they don't have a model yet, or use a Setting model
      // For now, let's just return an empty object or basic info
      res.json({ systemName: 'Nexus Digital Signage' });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      res.json({ message: 'Settings updated' });
    } catch (error) {
      next(error);
    }
  }

  async wipeSystem(req, res, next) {
    try {
      await Assignment.deleteMany({});
      await Media.deleteMany({});
      res.json({ message: 'System wiped successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConfigController();
