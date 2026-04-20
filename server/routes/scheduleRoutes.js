const express = require('express');
const router = express.Router();
const { getActiveSchedule, getAllSchedules, createSchedule } = require('../controllers/scheduleController');

router.get('/', getAllSchedules);
router.get('/active', getActiveSchedule);
router.post('/', createSchedule);

module.exports = router;
