const Setting = require('../models/Setting');

class ConfigService {
  async getFullConfig() {
    const settings = await Setting.find().limit(500);
    return settings.reduce((acc, curr) => {
      try {
        acc[curr.key] = JSON.parse(curr.value);
      } catch {
        acc[curr.key] = curr.value;
      }
      return acc;
    }, {});
  }

  async setConfig(key, value) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    return await Setting.findOneAndUpdate(
      { key },
      { value: stringValue },
      { upsert: true, returnDocument: "after" }
    );
  }
}

module.exports = new ConfigService();
