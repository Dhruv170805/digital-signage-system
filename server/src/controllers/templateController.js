const templateService = require('../services/templateService');

class TemplateController {
  async getAll(req, res, next) {
    try {
      const templates = await templateService.getAll();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const template = await templateService.getById(req.params.id);
      if (!template) return res.status(404).json({ message: 'Template not found' });
      res.json(template);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const template = await templateService.create(req.body);
      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const template = await templateService.update(req.params.id, req.body);
      res.json(template);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await templateService.delete(req.params.id);
      res.json({ message: 'Template deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TemplateController();
