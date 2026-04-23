const prisma = require('../utils/db');

class TickerRepository {
  async getAll() {
    return await prisma.ticker.findMany();
  }

  async getById(id) {
    return await prisma.ticker.findUnique({ where: { id: parseInt(id) } });
  }

  async create(data) {
    return await prisma.ticker.create({ data });
  }

  async update(id, data) {
    return await prisma.ticker.update({
      where: { id: parseInt(id) },
      data,
    });
  }
}

module.exports = new TickerRepository();
