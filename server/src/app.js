const express = require('express');
const cors = require('cors');
const path = require('path');
const errorMiddleware = require('./middlewares/errorMiddleware');

// Routes
const screenRoutes = require('./routes/screenRoutes');
const authRoutes = require('./routes/authRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const tickerRoutes = require('./routes/tickerRoutes');
const auditRoutes = require('./routes/auditRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const templateRoutes = require('./routes/templateRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// API Routes
app.use('/api/screens', screenRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/ticker', tickerRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/templates', templateRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Digital Signage System API (Production Mode)');
});

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
