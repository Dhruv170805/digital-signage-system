require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const app = require('./src/app');
const socketService = require('./src/services/socketService');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize real-time service
socketService.init(io);
app.set('socketio', io);

server.listen(PORT, () => {
  console.log(`🚀 NEXUS PRODUCTION ENGINE: Running on port ${PORT}`);
  console.log(`📡 REAL-TIME SYNC: Active`);
});
