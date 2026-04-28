const AudioAssignment = require('../models/AudioAssignment');

class AudioAssignmentService {
  async getAll() {
    return await AudioAssignment.find().populate('playlistId').limit(1000);
  }

  async getActiveForScreen(screenId = null, groupId = null) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    };

    const targetQuery = [{ targetType: 'all' }];
    if (screenId) targetQuery.push({ targetType: 'screen', targetId: screenId });
    if (groupId) targetQuery.push({ targetType: 'group', targetId: groupId });
    query.$or = targetQuery;

    const assignments = await AudioAssignment.find(query)
      .populate({
        path: 'playlistId',
        populate: { path: 'audios' }
      })
      .sort({ createdAt: -1 });

    return assignments.filter(a => {
      if (a.daysOfWeek && a.daysOfWeek.length > 0) {
        if (!a.daysOfWeek.includes(currentDay)) return false;
      }
      if (a.startTime && a.endTime) {
        if (a.startTime <= a.endTime) {
          if (currentTime < a.startTime || currentTime > a.endTime) return false;
        } else {
          if (currentTime < a.startTime && currentTime > a.endTime) return false;
        }
      }
      return true;
    });
  }

  async create(data) {
    const assignment = new AudioAssignment(data);
    return await assignment.save();
  }

  async delete(id) {
    return await AudioAssignment.findByIdAndDelete(id);
  }
}

module.exports = new AudioAssignmentService();
