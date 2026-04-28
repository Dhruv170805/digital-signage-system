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

        console.log(`🔌 Incoming socket connection attempt... Auth types: ${token ? '[JWT]' : ''} ${deviceToken ? '[DeviceToken]' : ''}`);

        if (token) {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET); 
          socket.user = decoded;
          console.log(`👤 Socket Auth Success: User ${decoded.id} (${decoded.role})`);
          return next();
        } 

        if (deviceToken) {
          const screen = await screenService.getScreenByToken(deviceToken);
          if (screen) {
            socket.screen = screen;
            console.log(`🖥️ Socket Auth Success: Screen ${screen.screenId} (${screen._id})`);
            return next();
          } else {
             console.warn(`⚠️ Socket Auth Failed: Invalid DeviceToken "${deviceToken.substring(0,8)}..."`);
          }
        }

        console.warn('❌ Socket Auth Denied: No valid credentials provided');
        return next(new Error('Authentication failed: Valid User or Device token required'));
      } catch (err) {
        console.warn('❌ Socket Handshake Failure:', err.message);
        return next(new Error('Authentication failed: Invalid credentials'));
      }
    });

    this.io.on('connection', (socket) => {
      const identity = socket.user ? `User: ${socket.user.id}` : socket.screen ? `Screen: ${socket.screen.screenId}` : 'Unknown';
      console.log(`✅ Socket connected: ${socket.id} (${identity})`);

      // Join admin room if user is admin
      if (socket.user && socket.user.role === 'admin') {
        console.log(`🛡️ Admin ${socket.user.id} joined monitor room`);
        socket.join('admin:monitor');
      }

      if (socket.screen) {
        socket.join(`screen:${socket.screen._id}`);
        if (socket.screen.groupId) socket.join(`group:${socket.screen.groupId}`);
        console.log(`📺 Screen ${socket.screen.screenId} joined rooms [screen:${socket.screen._id}, group:${socket.screen.groupId}]`);
      }

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

      // Real-time Audio Controls
      socket.on('audio:volume', (data) => {
        if (!socket.user || socket.user.role !== 'admin') return;
        const { targetType, targetId, volume } = data;
        if (targetType === 'all') this.broadcast('audio:volume', { volume });
        else if (targetType === 'screen') this.notifyScreen(targetId, 'audio:volume', { volume });
        else if (targetType === 'group') this.notifyGroup(targetId, 'audio:volume', { volume });
      });

      socket.on('audio:control', (data) => {
        if (!socket.user || socket.user.role !== 'admin') return;
        const { targetType, targetId, action } = data; // action: 'play', 'pause', 'stop'
        if (targetType === 'all') this.broadcast('audio:control', { action });
        else if (targetType === 'screen') this.notifyScreen(targetId, 'audio:control', { action });
        else if (targetType === 'group') this.notifyGroup(targetId, 'audio:control', { action });
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
