const Screen = require('../models/Screen');
const crypto = require('crypto');

class ScreenService {
  async getAllScreens() {
    return await Screen.find().populate('groupId');
  }

  async getScreenById(id) {
    return await Screen.findById(id).populate('groupId');
  }

  async registerScreen(data) {
    const deviceToken = crypto.randomBytes(32).toString('hex');
    const screen = new Screen({
      ...data,
      deviceToken,
      status: 'online',
      lastSeen: new Date(),
    });
    return await screen.save();
  }

  async updateScreen(id, data) {
    return await Screen.findByIdAndUpdate(id, data, { new: true });
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
    const assignmentService = require('./assignmentService');
    const tickerService = require('./tickerService');
    const configService = require('./configService');
    const mediaService = require('./mediaService');

    const [playlist, tickers, settings, media] = await Promise.all([
      assignmentService.getActiveAssignmentsForScreen(screenId, groupId),
      tickerService.getActive(),
      configService.getFullConfig(),
      mediaService.getAllApproved()
    ]);

    return {
      playlist,
      tickers,
      settings,
      media
    };
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
    const socketService = require('./socketService');
    const screens = await this.getAllScreens();
    
    // In a high-perf system, we'd use a worker queue here.
    // For now, we'll iterate and push.
    for (const screen of screens) {
      const manifest = await this.getManifest(screen._id, screen.groupId);
      socketService.notifyScreen(screen._id, 'manifestUpdate', {
        screen,
        ...manifest
      });
    }
  }

  async getScreenByToken(deviceToken) {
    return await Screen.findOne({ deviceToken, isActive: true });
  }
}

module.exports = new ScreenService();
