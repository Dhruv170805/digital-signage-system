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
          const decoded = jwt.verify(token, process.env.JWT_SECRET); // ❌ Removed hardcoded 'secret' fallback
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

        // ❌ REJECT unauthenticated connections
        return next(new Error('Authentication failed: Valid User or Device token required'));
      } catch (err) {
        console.warn('Socket auth handshake failure:', err.message);
        return next(new Error('Authentication failed: Invalid credentials'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log('New socket connection:', socket.id, socket.user ? `User: ${socket.user.id}` : socket.screen ? `Screen: ${socket.screen.screenId}` : 'Unknown');

      // Join admin room if user is admin
      if (socket.user && socket.user.role === 'admin') {
        socket.join('admin:monitor');
      }

      // Send cached weather immediately upon connection
      socket.emit('weatherUpdate', Object.fromEntries(weatherService.weatherCache));

      socket.on('heartbeat', async (data) => {
        // Only allow screens to send heartbeats
        if (!socket.screen) return;
        
        const { telemetry } = data;
        const screen = await screenService.updateHeartbeat(socket.screen.deviceToken, telemetry);
        if (screen) {
          socket.join(`screen:${screen._id}`);
          if (screen.groupId) socket.join(`group:${screen.groupId}`);
          
          // Notify admins
          this.io.to('admin:monitor').emit('screenStatusUpdate', { 
            screenId: screen._id, 
            status: 'online', 
            telemetry 
          });
        }
      });

      socket.on('screenPing', async (data) => {
        const { token, telemetry } = data;
        
        // If already authenticated as screen via handshake
        if (socket.screen) {
            socket.join(`screen:${socket.screen._id}`);
            if (socket.screen.groupId) socket.join(`group:${socket.screen.groupId}`);
            
            await screenService.updateHeartbeat(socket.screen.deviceToken, telemetry);
            this.io.to('admin:monitor').emit('screenStatusUpdate', { 
              screenId: socket.screen._id, 
              status: 'online', 
              telemetry 
            });
            return;
        }

        if (token) {
            const screen = await screenService.updateHeartbeat(token, telemetry);
            if (screen) {
                socket.join(`screen:${screen._id}`);
                if (screen.groupId) socket.join(`group:${screen.groupId}`);
                
                this.io.to('admin:monitor').emit('screenStatusUpdate', { 
                  screenId: screen._id, 
                  status: 'online', 
                  telemetry 
                });
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
