const ScreenGroup = require('../models/ScreenGroup');

class GroupController {
  async getAll(req, res, next) {
    try {
      const groups = await ScreenGroup.find().populate('screens');
      res.json(groups);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const group = new ScreenGroup(req.body);
      await group.save();
      res.status(201).json(group);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await ScreenGroup.findByIdAndDelete(req.params.id);
      res.json({ message: 'Group deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GroupController();
