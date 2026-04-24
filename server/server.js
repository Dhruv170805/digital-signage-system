require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { redisClient } = require('./src/config/redis');
const subClient = redisClient.duplicate();
const app = require('./src/app');
const socketService = require('./src/services/socketService');

// Start BullMQ workers
require('./src/workers/broadcastWorker');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.adapter(createAdapter(redisClient, subClient));

// Initialize real-time service
socketService.init(io);
app.set('socketio', io);

server.listen(PORT, () => {
  console.log(`🚀 NEXUS PRODUCTION ENGINE: Running on port ${PORT}`);
  console.log(`📡 REAL-TIME SYNC: Active with Redis Adapter`);
});
