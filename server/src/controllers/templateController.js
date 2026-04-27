const templateService = require('../services/templateService');
const loggerService = require('../services/loggerService');

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
      if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
      res.json(template);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const template = await templateService.create(req.body);
      await loggerService.logAudit(req.user.id, 'CREATE_LAYOUT', 'Template', template._id, { name: template.name });
      res.status(201).json(template);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'A layout with this name already exists. Please choose a unique identifier.' });
      }
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const template = await templateService.update(req.params.id, req.body);
      await loggerService.logAudit(req.user.id, 'UPDATE_LAYOUT', 'Template', template._id, { name: template.name });
      res.json(template);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'A layout with this name already exists. Please choose a unique identifier.' });
      }
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const template = await templateService.getById(req.params.id);
      await templateService.delete(req.params.id);
      await loggerService.logAudit(req.user.id, 'DELETE_LAYOUT', 'Template', req.params.id, { name: template ? template.name : 'Unknown' });
      res.json({ message: 'Template deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TemplateController();
