const express = require('express');
const router = express.Router();
const { getActiveSchedule, getAllSchedules, createSchedule, deleteSchedule, toggleScheduleStatus } = require('../controllers/scheduleController');

const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/', getAllSchedules);
router.get('/active', getActiveSchedule);
router.post('/', verifyToken, isAdmin, createSchedule);
router.put('/:id/toggle', verifyToken, isAdmin, toggleScheduleStatus);
router.delete('/:id', verifyToken, isAdmin, deleteSchedule);

module.exports = router;
