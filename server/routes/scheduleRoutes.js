const express = require('express');
const router = express.Router();
const { getActiveSchedule, getAllSchedules, createSchedule, deleteSchedule, toggleScheduleStatus, getPlaylistForMe } = require('../controllers/scheduleController');

const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const screenAuth = require('../middleware/screenAuth');

router.get('/', getAllSchedules);
router.get('/me', screenAuth, getPlaylistForMe);
router.get('/active', getActiveSchedule);
router.post('/', verifyToken, isAdmin, createSchedule);
router.put('/:id/toggle', verifyToken, isAdmin, toggleScheduleStatus);
router.delete('/:id', verifyToken, isAdmin, deleteSchedule);

module.exports = router;
