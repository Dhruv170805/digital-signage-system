const scheduleRepository = require('../repositories/scheduleRepository');

class ScheduleController {
  async getAll(req, res, next) {
    try {
      const schedules = await scheduleRepository.getAll();
      res.json(schedules);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const schedule = await scheduleRepository.create(req.body);
      res.status(201).json(schedule);
    } catch (error) {
      next(error);
    }
  }

  async getActive(req, res, next) {
    try {
      const { screenId, groupId } = req.query;
      const schedules = await scheduleRepository.getActiveForScreen(screenId, groupId);
      res.json(schedules);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ScheduleController();
