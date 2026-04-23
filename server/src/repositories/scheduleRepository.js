const prisma = require('../utils/db');

class ScheduleRepository {
  async getActiveForScreen(screenId, groupId = null) {
    const now = new Date();
    const dayOfWeek = now.getDay().toString(); // 0=Sunday, 1=Monday...
    
    return await prisma.schedule.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        OR: [
          { screenId: screenId },
          { groupId: groupId ? groupId : undefined },
        ],
      },
      include: {
        media: true,
        template: {
          include: { frames: true }
        },
        ticker: true,
      },
      orderBy: { priority: 'desc' },
    });
  }

  async getAll() {
    return await prisma.schedule.findMany({
      include: { media: true, template: true, ticker: true, screen: true, group: true },
    });
  }

  async create(data) {
    return await prisma.schedule.create({ data });
  }
}

module.exports = new ScheduleRepository();
