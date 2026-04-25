const Screen = require('../models/Screen');
const { generateDeviceToken } = require('../utils/generateToken');

class ScreenService {
  async getAllScreens() {
    return await Screen.find().populate('groupId');
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
    return await Screen.findByIdAndUpdate(id, data, { new: true });
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
      { new: true }
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
      { new: true }
    );
  }

  async getManifest(screenId, groupId) {
    const { redisClient } = require('../config/redis');
    const cacheKey = `manifest:${screenId}`;
    
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
    const Screen = require('../models/Screen');

    const [playlist, tickers, settings, media, idleConfig] = await Promise.all([
      assignmentService.getActiveAssignmentsForScreen(screenId, groupId),
      tickerService.getActive(screenId, groupId),
      configService.getFullConfig(),
      mediaService.getAllApproved(),
      idleService.getIdleContent(screenId, groupId)
    ]);

    const manifest = {
      playlist,
      tickers,
      settings,
      media,
      idleConfig
    };

    // Cache the result for 1 hour
    try {
      await redisClient.setex(cacheKey, 3600, JSON.stringify(manifest));
    } catch (err) {
      console.warn('Redis cache write failed for manifest:', err.message);
    }

    return manifest;
  }

  async pushManifestToScreen(screenId) {
    const socketService = require('./socketService');
    const screen = await this.getScreenById(screenId);
    if (!screen) return;

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
