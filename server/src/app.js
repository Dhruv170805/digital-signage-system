const express = require('express');
const cors = require('cors');
const path = require('path');
const errorMiddleware = require('./middlewares/errorMiddleware');

// Routes
const screenRoutes = require('./routes/screenRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// API Routes
app.use('/api/screens', screenRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Digital Signage System API (Production Mode)');
});

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
