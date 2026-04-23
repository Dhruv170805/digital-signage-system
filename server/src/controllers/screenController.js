const screenRepository = require('../repositories/screenRepository');
const playlistEngine = require('../services/playlistEngine');

class ScreenController {
  async getAll(req, res, next) {
    try {
      const screens = await screenRepository.getAll();
      res.json({ success: true, data: screens });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const screen = await screenRepository.getById(req.params.id);
      if (!screen) return res.status(404).json({ success: false, message: 'Screen not found' });
      res.json({ success: true, data: screen });
    } catch (error) {
      next(error);
    }
  }

  async getPlaylist(req, res, next) {
    try {
      const screen = await screenRepository.getById(req.params.id);
      if (!screen) return res.status(404).json({ success: false, message: 'Screen not found' });
      
      const playlist = await playlistEngine.getPlaylistForScreen(screen.id, screen.groupId);
      res.json({ success: true, data: playlist });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const updated = await screenRepository.update(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ScreenController();
