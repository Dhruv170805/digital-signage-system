const assignmentService = require('./assignmentService');

class PlaylistEngine {
  async getPlaylistForScreen(screenId, groupId = null) {
    // assignmentService.getActiveAssignmentsForScreen handles day and time filtering too
    return await assignmentService.getActiveAssignmentsForScreen(screenId, groupId);
  }
}

module.exports = new PlaylistEngine();
