const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorMiddleware = require('./middlewares/errorMiddleware');

// Connect to Database
connectDB();

// Routes
const screenRoutes = require('./routes/screenRoutes');
const authRoutes = require('./routes/authRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes'); // Use assignment instead of schedule
const tickerRoutes = require('./routes/tickerRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const templateRoutes = require('./routes/templateRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// API Routes
app.use('/api/screens', screenRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/schedule', assignmentRoutes); // Frontend expects /api/schedule
app.use('/api/ticker', tickerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/templates', templateRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Nexus Digital Signage API (Mongoose Refactor)');
});

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
