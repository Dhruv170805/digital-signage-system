const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Make io accessible to our routes
app.set('socketio', io);

// Health check route
app.get('/', (req, res) => {
    res.json({ status: 'Nexus Server is running', version: '1.0.0' });
});

// Routes (to be implemented)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/schedule', require('./routes/scheduleRoutes'));
app.use('/api/ticker', require('./routes/tickerRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/screens', require('./routes/screenRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
