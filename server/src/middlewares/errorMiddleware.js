const loggerService = require('../services/loggerService');

const errorMiddleware = async (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Handle Mongoose Cast Errors (Invalid IDs)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Log the error
  try {
    await loggerService.logError(err, {
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      user: req.user ? req.user.id : null,
    });
  } catch (logErr) {
    console.error('Failed to log error to DB', logErr);
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: message, // Compatibility fallback
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorMiddleware;
