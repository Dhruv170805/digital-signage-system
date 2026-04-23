const prisma = require('../utils/db');

class ScreenRepository {
  async getAll() {
    return await prisma.screen.findMany({
      include: { group: true },
    });
  }

  async getById(id) {
    return await prisma.screen.findUnique({
      where: { id: parseInt(id) },
      include: { group: true },
    });
  }

  async create(data) {
    return await prisma.screen.create({ data });
  }

  async update(id, data) {
    return await prisma.screen.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async updateHeartbeat(macAddress, ipAddress) {
    return await prisma.screen.upsert({
      where: { macAddress },
      update: { 
        ipAddress, 
        lastSeen: new Date(),
        status: 'online'
      },
      create: { 
        macAddress, 
        ipAddress, 
        name: `Screen-${macAddress.slice(-4)}`,
        status: 'online',
        lastSeen: new Date()
      },
    });
  }
}

module.exports = new ScreenRepository();
