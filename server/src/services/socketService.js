const screenService = require('./screenService');
const weatherService = require('./weatherService');

class SocketService {
  constructor() {
    this.io = null;
  }

  init(io) {
    this.io = io;
    weatherService.init(io);

    this.io.on('connection', (socket) => {
      console.log('New socket connection:', socket.id);

      // Send cached weather immediately upon connection
      socket.emit('weatherUpdate', Object.fromEntries(weatherService.weatherCache));

      socket.on('heartbeat', async (data) => {
        const { macAddress, ipAddress, telemetry } = data;
        if (macAddress) {
          const screen = await screenService.updateHeartbeatByMac(macAddress, ipAddress, telemetry);
          if (screen) {
            socket.join(`screen:${screen._id}`);
            if (screen.groupId) {
              socket.join(`group:${screen.groupId}`);
            }
            console.log(`Screen ${screen.name} checked in with telemetry.`);
          }
        }
      });

      socket.on('screenPing', async (data) => {
        const { token, screenId, telemetry } = data;
        if (token) {
            await screenService.updateHeartbeat(token, telemetry);
        }
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
      });
    });
  }

  notifyScreen(screenId, event, data) {
    if (this.io) {
      this.io.to(`screen:${screenId}`).emit(event, data);
    }
  }

  notifyGroup(groupId, event, data) {
    if (this.io) {
      this.io.to(`group:${groupId}`).emit(event, data);
    }
  }

  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}

module.exports = new SocketService();
