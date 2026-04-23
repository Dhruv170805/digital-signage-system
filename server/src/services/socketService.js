const screenRepository = require('../repositories/screenRepository');

class SocketService {
  constructor() {
    this.io = null;
  }

  init(io) {
    this.io = io;

    this.io.on('connection', (socket) => {
      console.log('New socket connection:', socket.id);

      socket.on('heartbeat', async (data) => {
        const { macAddress, ipAddress, screenId } = data;
        if (macAddress) {
          const screen = await screenRepository.updateHeartbeat(macAddress, ipAddress);
          socket.join(`screen:${screen.id}`);
          if (screen.groupId) {
            socket.join(`group:${screen.groupId}`);
          }
          console.log(`Screen ${screen.name} checked in.`);
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
