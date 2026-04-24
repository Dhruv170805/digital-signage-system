const screenService = require('../services/screenService');

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
      res.status(201).json(screen);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const screen = await screenService.updateScreen(req.params.id, req.body);
      res.json(screen);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res) {
    res.json(req.screen);
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
}

module.exports = new ScreenController();
