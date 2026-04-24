const Assignment = require('../models/Assignment');

class AssignmentService {
  async getAllAssignments() {
    return await Assignment.find()
      .populate('mediaId')
      .populate('templateId')
      .populate('tickerId')
      .populate('screenId');
  }

  async getAssignmentById(id) {
    return await Assignment.findById(id);
  }

  async createAssignment(data) {
    const assignment = new Assignment(data);
    return await assignment.save();
  }

  async deleteAssignment(id) {
    return await Assignment.findByIdAndDelete(id);
  }

  async getActiveAssignmentsForScreen(screenId, groupId = null) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { screenId: screenId },
        { isGlobal: true }
      ]
    };

    if (groupId) {
      query.$or.push({ groupId: groupId });
    }

    const assignments = await Assignment.find(query)
      .populate('mediaId')
      .populate('templateId')
      .populate('tickerId')
      .sort({ priority: -1, updatedAt: -1 }); // Issue 3.2 Fix: Use updatedAt as tie-breaker

    return assignments.filter(a => {
      // Days of week check
      if (a.daysOfWeek && a.daysOfWeek.length > 0) {
        if (!a.daysOfWeek.includes(currentDay)) return false;
      }

      // Time window check (Issue 3.1 Fix: Support midnight crossing)
      if (a.startTime && a.endTime) {
        if (a.startTime <= a.endTime) {
          // Normal daylight hours (e.g., 09:00 - 17:00)
          if (currentTime < a.startTime || currentTime > a.endTime) return false;
        } else {
          // Crosses midnight (e.g., 22:00 - 02:00)
          if (currentTime < a.startTime && currentTime > a.endTime) return false;
        }
      }

      return true;
    });
  }
}

module.exports = new AssignmentService();
