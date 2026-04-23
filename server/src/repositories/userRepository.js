const prisma = require('../utils/db');

class UserRepository {
  async getByEmail(email) {
    return await prisma.user.findUnique({ where: { email } });
  }

  async getById(id) {
    return await prisma.user.findUnique({ where: { id } });
  }

  async getAll() {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true }
    });
  }

  async create(data) {
    return await prisma.user.create({ data });
  }

  async update(id, data) {
    return await prisma.user.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return await prisma.user.delete({
      where: { id }
    });
  }
}

module.exports = new UserRepository();
