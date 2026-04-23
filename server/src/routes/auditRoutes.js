const express = require('express');
const router = express.Router();
const prisma = require('../utils/db');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { userId, action, entity, startDate, endDate } = req.query;

    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100
    });

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
