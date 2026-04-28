const audioPlaylistService = require('../services/audioPlaylistService');

class AudioPlaylistController {
  getAll = async (req, res, next) => {
    try {
      const playlists = await audioPlaylistService.getAll();
      res.json(playlists);
    } catch (error) {
      next(error);
    }
  }

  getById = async (req, res, next) => {
    try {
      const playlist = await audioPlaylistService.getById(req.params.id);
      res.json(playlist);
    } catch (error) {
      next(error);
    }
  }

  create = async (req, res, next) => {
    try {
      const playlist = await audioPlaylistService.create({
        ...req.body,
        createdBy: req.user.id
      });
      res.status(201).json(playlist);
    } catch (error) {
      next(error);
    }
  }

  update = async (req, res, next) => {
    try {
      const playlist = await audioPlaylistService.update(req.params.id, req.body);
      res.json(playlist);
    } catch (error) {
      next(error);
    }
  }

  delete = async (req, res, next) => {
    try {
      await audioPlaylistService.delete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AudioPlaylistController();
