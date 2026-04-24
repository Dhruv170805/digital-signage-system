const Template = require('../models/Template');

class TemplateService {
  async getAll() {
    return await Template.find();
  }

  async getById(id) {
    return await Template.findById(id);
  }

  async create(data) {
    const template = new Template(data);
    return await template.save();
  }

  async update(id, data) {
    return await Template.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await Template.findByIdAndDelete(id);
  }
}

module.exports = new TemplateService();
