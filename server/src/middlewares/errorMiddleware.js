const loggerService = require('../services/loggerService');

const errorMiddleware = async (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

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
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorMiddleware;
