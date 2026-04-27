const Template = require('../models/Template');

class TemplateService {
  async getAll() {
    return await Template.find().limit(500);
  }

  async getById(id) {
    return await Template.findById(id);
  }

  _prepareData(data) {
    if (data.layout) {
      try {
        const parsed = typeof data.layout === 'string' ? JSON.parse(data.layout) : data.layout;
        if (Array.isArray(parsed)) {
          data.frames = parsed.map(f => ({
            i: f.i,
            x: f.x || 0,
            y: f.y || 0,
            w: f.w || 10,
            h: f.h || 10,
            type: f.type || 'media',
            zIndex: f.zIndex || 1
          }));
        }
        // Ensure layout is stored as string in DB for the validator
        if (typeof data.layout !== 'string') {
          data.layout = JSON.stringify(data.layout);
        }
      } catch (e) {
        console.error('❌ TemplateService: Failed to parse layout:', e.message);
      }
    }
    return data;
  }

  async create(data) {
    const preparedData = this._prepareData(data);
    const template = new Template(preparedData);
    return await template.save();
  }

  async update(id, data) {
    const preparedData = this._prepareData(data);
    return await Template.findByIdAndUpdate(id, preparedData, { new: true, runValidators: true });
  }

  async delete(id) {
    return await Template.findByIdAndDelete(id);
  }
}

module.exports = new TemplateService();
