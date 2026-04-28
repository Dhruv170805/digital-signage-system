const Screen = require('../models/Screen');
const { generateDeviceToken } = require('../utils/generateToken');

class ScreenService {
  async getAllScreens() {
    return await Screen.find().populate('groupId').limit(1000);
  }

  async getScreenById(id) {
    return await Screen.findById(id).populate('groupId');
  }

  async registerScreen(data) {
    const deviceToken = generateDeviceToken();
    
    // Auto-generate screenId if not provided (e.g., screen-1714032000)
    const screenId = data.screenId || `screen-${Math.floor(Date.now() / 1000)}`;

    const screen = new Screen({
      ...data,
      screenId,
      deviceToken,
      status: 'online',
      lastSeen: new Date(),
    });
    return await screen.save();
  }

  async updateScreen(id, data) {
    const updateData = { ...data };
    if (updateData.groupId === '') updateData.groupId = null;
    return await Screen.findByIdAndUpdate(id, updateData, { returnDocument: "after" });
  }

  async deleteScreen(id) {
    return await Screen.findByIdAndDelete(id);
  }

  async updateHeartbeat(deviceToken, telemetry = {}) {
    return await Screen.findOneAndUpdate(
      { deviceToken },
      { 
        lastSeen: new Date(), 
        status: 'online',
        telemetry: { ...telemetry }
      },
      { returnDocument: "after" }
    );
  }

  async updateHeartbeatByMac(macAddress, ipAddress, telemetry = {}) {
    return await Screen.findOneAndUpdate(
      { macAddress },
      { 
        lastSeen: new Date(), 
        status: 'online', 
        ipAddress,
        telemetry: { ...telemetry }
      },
      { returnDocument: "after" }
    );
  }

  async getManifest(screenId, groupId) {
    const { redisClient } = require('../config/redis');
    const cacheKey = `manifest:${screenId ? screenId.toString() : 'public'}`;

    // Try to get from cache first
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      console.warn('Redis cache read failed for manifest:', err.message);
    }

    const assignmentService = require('./assignmentService');
    const tickerService = require('./tickerService');
    const configService = require('./configService');
    const mediaService = require('./mediaService');
    const idleService = require('./idleService');
    const audioAssignmentService = require('./audioAssignmentService');

    const [playlist, tickers, settings, media, idleConfig, audioAssignments] = await Promise.all([
      assignmentService.getActiveAssignmentsForScreen(screenId, groupId),
      tickerService.getActive(screenId, groupId),
      configService.getFullConfig(),
      mediaService.getAllApproved(),
      idleService.getIdleContent(screenId, groupId),
      audioAssignmentService.getActiveForScreen(screenId, groupId)
    ]);

    const manifest = {
      playlist,
      tickers,
      settings,
      media,
      idleConfig,
      audioAssignments
    };

    // 🧠 Intelligent Cache TTL Calculation
    // Default 1 hour, but if we have future assignments, expire exactly when the next one starts.
    let ttl = 3600;
    try {
      const Assignment = require('../models/Assignment');
      const now = new Date();
      // Find the next assignment that WILL start soon
      const nextFuture = await Assignment.findOne({
        isActive: true,
        status: 'approved',
        startDate: { $lte: now },
        endDate: { $gte: now },
        startTime: { $gt: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}` },
        $or: [{ screenId: screenId }, { isGlobal: true }, { groupId: groupId }]
      }).sort({ startTime: 1 });

      if (nextFuture && nextFuture.startTime) {
        const [h, m] = nextFuture.startTime.split(':').map(Number);
        const nextStart = new Date();
        nextStart.setHours(h, m, 0, 0);
        const secondsUntilNext = Math.floor((nextStart.getTime() - Date.now()) / 1000);
        if (secondsUntilNext > 0 && secondsUntilNext < ttl) {
          ttl = secondsUntilNext;
          console.log(`⏱️ Reducing manifest cache TTL to ${ttl}s due to future assignment: ${nextFuture.name}`);
        }
      }
    } catch (err) {
      console.warn('Failed to calculate intelligent TTL:', err.message);
    }

    // Cache the result
    try {
      await redisClient.setex(cacheKey, ttl, JSON.stringify(manifest));
    } catch (err) {
      console.warn('Redis cache write failed for manifest:', err.message);
    }

    return manifest;
  }

  async getPublicManifest() {
    return await this.getManifest(null, null);
  }

  async getScreensByGroup(groupId) {
    return await Screen.find({ groupId });
  }

  async invalidateScreenCache(screenId) {
    const { redisClient } = require('../config/redis');
    const cacheKey = `manifest:${screenId ? screenId.toString() : 'public'}`;
    try {
      await redisClient.del(cacheKey);
    } catch (err) {
      console.warn('Failed to clear manifest cache for screen:', screenId, err.message);
    }
  }

  async pushManifestToScreen(screenId) {
    const socketService = require('./socketService');
    const screen = await this.getScreenById(screenId);
    if (!screen) return;

    // Invalidate cache before pushing to ensure fresh data
    await this.invalidateScreenCache(screen._id);

    const manifest = await this.getManifest(screen._id, screen.groupId);
    socketService.notifyScreen(screen._id, 'manifestUpdate', {
      screen,
      ...manifest
    });
  }

  async broadcastManifestUpdate() {
    const { redisClient } = require('../config/redis');
    // Invalidate all manifest caches
    try {
      const keys = await redisClient.keys('manifest:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (err) {
      console.warn('Failed to clear manifest cache:', err.message);
    }

    const broadcastQueue = require('../workers/broadcastQueue');
    await broadcastQueue.add('broadcastManifest', {});
    console.log('Added broadcast task to BullMQ and cleared caches');
  }

  async getScreenByToken(deviceToken) {
    return await Screen.findOne({ deviceToken, isActive: true });
  }
}

module.exports = new ScreenService();
