const templateRepository = require('../repositories/templateRepository');

class TemplateController {
  async getAll(req, res, next) {
    try {
      const templates = await templateRepository.getAll();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const template = await templateRepository.getById(req.params.id);
      if (!template) return res.status(404).json({ message: 'Template not found' });
      res.json(template);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { frames, ...templateData } = req.body;
      const template = await templateRepository.create(templateData, frames);
      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { frames, ...templateData } = req.body;
      const template = await templateRepository.update(req.params.id, templateData, frames);
      res.json(template);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await templateRepository.delete(req.params.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TemplateController();
