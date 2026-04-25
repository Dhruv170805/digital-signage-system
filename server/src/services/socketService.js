const screenService = require('./screenService');
const weatherService = require('./weatherService');

class SocketService {
  constructor() {
    this.io = null;
  }

  init(io) {
    this.io = io;
    weatherService.init(io);

    // Authentication Middleware for Sockets
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        const deviceToken = socket.handshake.auth.deviceToken || socket.handshake.query.deviceToken;

        if (token) {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
          socket.user = decoded;
          return next();
        } 

        if (deviceToken) {
          const screen = await screenService.getScreenByToken(deviceToken);
          if (screen) {
            socket.screen = screen;
            return next();
          }
        }

        // Allow unauthenticated connections but restrict their actions later
        return next();
      } catch (err) {
        // Log error but allow connection to see if it can authenticate via events (legacy support)
        console.warn('Socket auth handshake error:', err.message);
        return next();
      }
    });

    this.io.on('connection', (socket) => {
      console.log('New socket connection:', socket.id, socket.user ? `User: ${socket.user.id}` : socket.screen ? `Screen: ${socket.screen.screenId}` : 'Unknown');

      // Send cached weather immediately upon connection
      socket.emit('weatherUpdate', Object.fromEntries(weatherService.weatherCache));

      socket.on('heartbeat', async (data) => {
        // Only allow screens to send heartbeats
        if (!socket.screen) return;
        
        const { ipAddress, telemetry } = data;
        const screen = await screenService.updateHeartbeat(socket.screen.deviceToken, telemetry);
        if (screen) {
          socket.join(`screen:${screen._id}`);
          if (screen.groupId) {
            socket.join(`group:${screen.groupId}`);
          }
        }
      });

      socket.on('screenPing', async (data) => {
        const { token, screenId, telemetry } = data;
        
        // If already authenticated as screen via handshake
        if (socket.screen) {
            socket.join(`screen:${socket.screen._id}`);
            if (socket.screen.groupId) socket.join(`group:${socket.screen.groupId}`);
            return;
        }

        // Backward compatibility: allow screen to identify via token/screenId in event
        let screen = null;
        if (token) {
            screen = await screenService.updateHeartbeat(token, telemetry);
        } else if (screenId) {
            // screenId is less secure, so we only fetch, not update heartbeat if no token
            screen = await screenService.getScreenById(screenId);
        }

        if (screen) {
            socket.join(`screen:${screen._id}`);
            if (screen.groupId) socket.join(`group:${screen.groupId}`);
        }

        // If admin, allow joining any room for monitoring
        if (socket.user && socket.user.role === 'admin') {
            const { screenId: targetScreenId } = data;
            if (targetScreenId) {
                const targetScreen = await screenService.getScreenById(targetScreenId);
                if (targetScreen) {
                    socket.join(`screen:${targetScreen._id}`);
                    if (targetScreen.groupId) socket.join(`group:${targetScreen.groupId}`);
                }
            }
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
