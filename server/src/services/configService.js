const configRepository = require('../repositories/configRepository');

class ConfigService {
  async getFullConfig() {
    const settings = await configRepository.getAll();
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
    return await configRepository.update(key, stringValue);
  }
}

module.exports = new ConfigService();
