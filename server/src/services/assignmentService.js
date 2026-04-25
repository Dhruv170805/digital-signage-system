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
      status: 'approved',
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
      .sort({ priority: -1, updatedAt: -1 });

    const validAssignments = assignments.filter(a => {
      // Days of week check
      if (a.daysOfWeek && a.daysOfWeek.length > 0) {
        if (!a.daysOfWeek.includes(currentDay)) return false;
      }

      // Time window check (HH:mm format)
      if (a.startTime && a.endTime) {
        if (a.startTime <= a.endTime) {
          if (currentTime < a.startTime || currentTime > a.endTime) return false;
        } else {
          // Midnight crossing
          if (currentTime < a.startTime && currentTime > a.endTime) return false;
        }
      }

      return true;
    });

    if (validAssignments.length === 0) return [];

    // BROADCAST LOGIC: Only return items with the highest found priority.
    // This allows a Priority 10 "Emergency" item to hide all Priority 1 "Regular" items.
    const maxPriority = Math.max(...validAssignments.map(a => a.priority || 1));
    return validAssignments.filter(a => (a.priority || 1) === maxPriority);
  }
}

module.exports = new AssignmentService();
