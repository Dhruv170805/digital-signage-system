const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorMiddleware = require('./middlewares/errorMiddleware');

// Routes
const screenRoutes = require('./routes/screenRoutes');
const authRoutes = require('./routes/authRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes'); // Use assignment instead of schedule
const tickerRoutes = require('./routes/tickerRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const templateRoutes = require('./routes/templateRoutes');
const auditRoutes = require('./routes/auditRoutes');
const idleRoutes = require('./routes/idleRoutes');
const groupRoutes = require('./routes/groupRoutes');
const audioRoutes = require('./routes/audioRoutes');
const audioPlaylistRoutes = require('./routes/audioPlaylistRoutes');
const audioAssignmentRoutes = require('./routes/audioAssignmentRoutes');

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to API calls only
app.use('/api', apiLimiter);

// Middlewares
const allowedOrigins = [
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow localhost origins
    if (process.env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/audio', express.static(path.join(__dirname, '../uploads/audio')));
app.use('/test_codes', express.static(path.join(__dirname, '../test_codes')));

// Serve Frontend Build
const buildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(buildPath));

// API Routes
app.use('/api/screens', screenRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/schedule', assignmentRoutes); // Frontend expects /api/schedule
app.use('/api/ticker', tickerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/history', auditRoutes);
app.use('/api/idle', idleRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/audio-playlists', audioPlaylistRoutes);
app.use('/api/audio-assignments', audioAssignmentRoutes);

// Base route
app.get('/api', (req, res) => {
  res.send('Nexus Digital Signage API (Mongoose Refactor)');
});

// React Fallback
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
