const ScreenGroup = require('../models/ScreenGroup');

class GroupController {
  async getAll(req, res, next) {
    try {
      const groups = await ScreenGroup.find().populate('screens').limit(500);
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
      const Screen = require('../models/Screen');
      const groupId = req.params.id;

      // 1. Atomically unassign all screens in this group
      await Screen.updateMany({ groupId }, { $set: { groupId: null } });

      // 2. Delete the group
      await ScreenGroup.findByIdAndDelete(groupId);
      
      res.json({ message: 'Group dissolved and screens unassigned safely' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GroupController();
