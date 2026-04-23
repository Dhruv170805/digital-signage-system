const scheduleRepository = require('../repositories/scheduleRepository');

class PlaylistEngine {
  async getPlaylistForScreen(screenId, groupId = null) {
    const schedules = await scheduleRepository.getActiveForScreen(screenId, groupId);
    const now = new Date();
    const currentDay = now.getDay().toString(); // 0=Sun, 1=Mon...
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return schedules.filter(schedule => {
      // Filter by days of week if specified (e.g., "1,2,3,4,5")
      if (schedule.daysOfWeek) {
        const days = schedule.daysOfWeek.split(',');
        if (!days.includes(currentDay)) return false;
      }

      // Filter by time if specified
      if (schedule.startTime && schedule.endTime) {
        if (currentTime < schedule.startTime || currentTime > schedule.endTime) return false;
      }

      return true;
    });
  }
}

module.exports = new PlaylistEngine();
