const Schedule = require('../models/Schedule');
const Screen = require('../models/Screen');

class PlaylistEngine {
    /**
     * Calculates the active playlist for a specific screen.
     * @param {String} screenId - The ID of the screen requesting content.
     */
    static async getActivePlaylist(screenId) {
        try {
            const now = new Date();
            const currentDay = now.getDay(); // 0-6
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                              now.getMinutes().toString().padStart(2, '0');

            // 1. Get screen details to find its group
            const screen = await Screen.findById(screenId);
            const groupId = screen ? screen.groupId : null;

            // 2. Fetch potentially active schedules
            const schedules = await Schedule.find({
                isActive: 1,
                startDate: { $lte: now },
                endDate: { $gte: now },
                daysOfWeek: currentDay
            })
            .populate('mediaId')
            .populate('templateId')
            .lean();

            // 3. Filter by Time Window and Targeting
            let validSchedules = schedules.filter(s => {
                // Time window check
                const isWithinTime = (currentTime >= s.startTime && currentTime <= s.endTime);
                if (!isWithinTime) return false;

                // Targeting check
                if (s.targetType === 'all') return true;
                if (s.targetType === 'screen' && s.targetIds.some(id => id.toString() === screenId)) return true;
                if (s.targetType === 'group' && groupId && s.targetIds.some(id => id.toString() === groupId.toString())) return true;

                return false;
            });

            if (validSchedules.length === 0) return [];

            // 4. Priority Sort (Highest wins)
            validSchedules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

            // 5. Conflict Resolution: 
            // If there's a priority gap (e.g., 100 vs 50), the high priority (100) blocks everything else.
            // If multiple items have the SAME top priority, they form a LOOP (Playlist).
            const topPriority = validSchedules[0].priority;
            const finalPlaylist = validSchedules.filter(s => s.priority === topPriority);

            // 6. Transform for Frontend
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
}

module.exports = PlaylistEngine;
