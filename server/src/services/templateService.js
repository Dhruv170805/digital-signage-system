const Template = require('../models/Template');

class TemplateService {
  async getAll() {
    return await Template.find().limit(500);
  }

  async getById(id) {
    return await Template.findById(id);
  }

  _validateCoverage(frames) {
    const GRID_RESOLUTION = 100;
    const grid = Array(GRID_RESOLUTION).fill(0).map(() => Array(GRID_RESOLUTION).fill(false));
    let totalCellsFilled = 0;

    frames.forEach(f => {
      const startX = Math.max(0, Math.floor(f.x));
      const startY = Math.max(0, Math.floor(f.y));
      const endX = Math.min(GRID_RESOLUTION, Math.ceil(f.x + f.w));
      const endY = Math.min(GRID_RESOLUTION, Math.ceil(f.y + f.h));

      for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
          if (!grid[x][y]) {
            grid[x][y] = true;
            totalCellsFilled++;
          }
        }
      }
    });

    const coveragePct = (totalCellsFilled / (GRID_RESOLUTION * GRID_RESOLUTION)) * 100;
    if (coveragePct < 99.9) {
      const error = new Error(`Incomplete Layout Coverage (${Math.round(coveragePct)}%). Every cell of the 100x100 canvas must be covered by a frame.`);
      error.status = 400;
      throw error;
    }
  }

  _prepareData(data) {
    if (data.layout) {
      try {
        const parsed = typeof data.layout === 'string' ? JSON.parse(data.layout) : data.layout;
        if (Array.isArray(parsed)) {
          // Validate 100% coverage
          this._validateCoverage(parsed);

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
        if (e.status === 400) throw e;
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
    return await Template.findByIdAndUpdate(id, preparedData, { returnDocument: "after", runValidators: true });
  }

  async delete(id) {
    return await Template.findByIdAndDelete(id);
  }
}

module.exports = new TemplateService();
