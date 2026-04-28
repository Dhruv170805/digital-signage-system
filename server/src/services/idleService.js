const IdleConfig = require('../models/IdleConfig');

class IdleService {
  async getIdleContent(screenId, groupId = null) {
    // Find all active idle configs that could apply to this screen
    const configs = await IdleConfig.find({
      isActive: true,
      $or: [
        { targetType: "all" },
        { targetType: "screen", targetIds: { $in: [screenId] } },
        { targetType: "group", targetIds: { $in: [groupId] } }
      ]
    }).sort({ priority: -1, createdAt: -1 }).limit(50);

    // Return the highest priority one
    return configs.length > 0 ? configs[0] : null;
  }

  async getAll() {
    return await IdleConfig.find().sort({ targetType: 1, priority: -1 }).limit(500);
  }

  async create(data) {
    // Automatically set priority based on targetType if not provided
    if (!data.priority) {
        if (data.targetType === 'screen') data.priority = 100;
        else if (data.targetType === 'group') data.priority = 50;
        else data.priority = 10;
    }
    const config = new IdleConfig(data);
    return await config.save();
  }

  async update(id, data) {
    return await IdleConfig.findByIdAndUpdate(id, data, { returnDocument: "after" });
  }

  async delete(id) {
    return await IdleConfig.findByIdAndDelete(id);
  }
}

module.exports = new IdleService();
