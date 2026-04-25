require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const { createAdapter } = require('@socket.io/redis-adapter');
const { redisClient } = require('./src/config/redis');
const subClient = redisClient.duplicate();
const app = require('./src/app');
const socketService = require('./src/services/socketService');

// Validate critical environment variables
const mongoUri = process.env.DATABASE_URL || process.env.MONGO_URI;
if (!process.env.JWT_SECRET || !mongoUri) {
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!mongoUri) missing.push('MONGO_URI or DATABASE_URL');
  console.error(`❌ FATAL ERROR: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// Start BullMQ workers
const broadcastWorker = require('./src/workers/broadcastWorker');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

io.adapter(createAdapter(redisClient, subClient));

// Initialize real-time service
socketService.init(io);
app.set('socketio', io);

const startServer = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('📦 Database connected successfully');
    
    server.listen(PORT, () => {
      console.log(`🚀 NEXUS PRODUCTION ENGINE: Running on port ${PORT}`);
      console.log(`📡 REAL-TIME SYNC: Active with Redis Adapter`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown Logic
const shutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  try {
    // 1. Stop accepting new HTTP requests
    server.close(() => console.log('⏸️  HTTP server closed'));

    // 2. Disconnect Socket.io clients
    if (io) {
      io.close(() => console.log('🔌 Socket.io connections closed'));
    }

    // 3. Close BullMQ workers
    if (broadcastWorker) {
      await broadcastWorker.close();
      console.log('👷 BullMQ worker closed');
    }

    // 4. Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
      console.log('📦 MongoDB connection closed');
    }

    // 5. Close Redis clients
    await redisClient.quit();
    await subClient.quit();
    console.log('🗄️  Redis clients closed');

    console.log('✅ Graceful shutdown complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
