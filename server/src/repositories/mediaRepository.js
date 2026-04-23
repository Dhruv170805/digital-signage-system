const prisma = require('../utils/db');

class MediaRepository {
  async getAllApproved() {
    return await prisma.media.findMany({
      where: { status: 'approved' },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPending() {
    return await prisma.media.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id) {
    return await prisma.media.findUnique({ where: { id } });
  }

  async create(data) {
    return await prisma.media.create({ data });
  }

  async update(id, data) {
    return await prisma.media.update({
      where: { id },
      data
    });
  }
}

module.exports = new MediaRepository();
