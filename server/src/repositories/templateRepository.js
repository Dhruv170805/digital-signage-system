const prisma = require('../utils/db');

class TemplateRepository {
  async getAll() {
    return await prisma.template.findMany({
      include: { frames: true },
    });
  }

  async getById(id) {
    return await prisma.template.findUnique({
      where: { id: parseInt(id) },
      include: { frames: true },
    });
  }

  async create(templateData, framesData) {
    return await prisma.template.create({
      data: {
        ...templateData,
        frames: {
          create: framesData,
        },
      },
      include: { frames: true },
    });
  }

  async update(id, templateData, framesData) {
    // Delete existing frames and recreate them for simplicity in update (or do complex diff)
    await prisma.frame.deleteMany({ where: { templateId: parseInt(id) } });
    
    return await prisma.template.update({
      where: { id: parseInt(id) },
      data: {
        ...templateData,
        frames: {
          create: framesData,
        },
      },
      include: { frames: true },
    });
  }

  async delete(id) {
    return await prisma.template.delete({
      where: { id: parseInt(id) },
    });
  }
}

module.exports = new TemplateRepository();
