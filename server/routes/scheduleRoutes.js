const express = require('express');
const router = express.Router();
const { getActiveSchedule, getAllSchedules, createSchedule, deleteSchedule } = require('../controllers/scheduleController');

router.get('/', getAllSchedules);
router.get('/active', getActiveSchedule);
router.post('/', createSchedule);
router.delete('/:id', deleteSchedule);

module.exports = router;
