const Schedule = require('../models/Schedule');
const Screen = require('../models/Screen');

class PlaylistEngine {
    /**
     * Calculates the active playlist for a specific screen using token-based identity.
     * @param {Object} screen - The authenticated screen object from middleware.
     */
    static async getPlaylistByToken(screen) {
        try {
            const now = new Date();
            const currentDay = now.getDay(); // 0-6
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                              now.getMinutes().toString().padStart(2, '0');

            // Fetch schedules that match 'all', this specific screenId, or this groupName
            // Note: We search for both MongoDB _id and the custom screenId/groupName for maximum compatibility
            const schedules = await Schedule.find({
                isActive: 1,
                startDate: { $lte: now },
                endDate: { $gte: now },
                daysOfWeek: currentDay,
                $or: [
                    { targetType: 'all' },
                    { targetType: 'screen', targetIds: screen.id }, // Match by MongoDB _id
                    { targetType: 'screen', targetId: screen.screenId }, // Match by custom screenId
                    { targetType: 'group', targetIds: screen.groupId }, // Match by MongoDB _id (if exists)
                    { targetType: 'group', targetId: screen.groupName }  // Match by groupName string
                ]
            })
            .populate('mediaId')
            .populate('templateId')
            .lean();

            // Filter by Time Window
            let validSchedules = schedules.filter(s => {
                return (currentTime >= s.startTime && currentTime <= s.endTime);
            });

            if (validSchedules.length === 0) return [];

            // Priority Sort (Highest wins)
            validSchedules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

            const topPriority = validSchedules[0].priority;
            const finalPlaylist = validSchedules.filter(s => s.priority === topPriority);

            return finalPlaylist.map(s => ({
                id: s._id,
                mediaId: s.mediaId ? s.mediaId._id : null,
                fileName: s.mediaId ? s.mediaId.fileName : 'Fallback',
                filePath: s.mediaId ? s.mediaId.filePath : null,
                fileType: s.mediaId ? s.mediaId.fileType : 'image',
                templateId: s.templateId ? s.templateId._id : null,
                layout: s.templateId ? s.templateId.layout : null,
                mediaMapping: s.mediaMapping,
                duration: s.duration || 10,
                priority: s.priority
            }));

        } catch (error) {
            console.error('PlaylistEngine Error:', error);
            return [];
        }
    }

    /**
     * Legacy method for compatibility with existing code.
     */
    static async getActivePlaylist(screenId) {
        const screen = await Screen.findById(screenId);
        if (!screen) return [];
        return this.getPlaylistByToken(screen);
    }
}

module.exports = PlaylistEngine;
