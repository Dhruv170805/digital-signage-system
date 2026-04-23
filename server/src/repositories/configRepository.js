const prisma = require('../utils/db');

class ConfigRepository {
  async getAll() {
    return await prisma.appSettings.findMany();
  }

  async getByKey(key) {
    return await prisma.appSettings.findUnique({ where: { key } });
  }

  async update(key, value) {
    return await prisma.appSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

module.exports = new ConfigRepository();
