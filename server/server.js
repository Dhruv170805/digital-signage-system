const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();
// Connect to Database
connectDB();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

// System Logs Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO
io.on('connection', (socket) => {
    console.log('💎 NEXUS: Device linked ->', socket.id);
    
    // Heartbeat logic
    socket.on('screenPing', async (data) => {
        const Screen = require('./models/Screen');
        if (data.screenId) {
            await Screen.findByIdAndUpdate(data.screenId, { 
                status: 'online', 
                lastPing: new Date() 
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('💎 NEXUS: Device detached ->', socket.id);
    });
});

// Make io accessible to our routes
app.set('socketio', io);

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/schedule', require('./routes/scheduleRoutes'));
app.use('/api/ticker', require('./routes/tickerRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/screens', require('./routes/screenRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));

// Serve frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) =>
    res.sendFile(
      path.resolve(__dirname, '../', 'client', 'dist', 'index.html')
    )
  );
} else {
  app.get('/', (req, res) => res.send('Please set to production'));
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER_ERROR:', err.stack);
    res.status(500).json({ error: 'Internal system error. Personnel notified.' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
