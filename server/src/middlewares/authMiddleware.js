const jwt = require('jsonwebtoken');
const { redisClient } = require('../config/redis');
const loggerService = require('../services/loggerService');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Threat detection: log attempts to override role
  if (req.headers['x-user-role'] || req.headers['x-role']) {
    loggerService.logAudit(null, 'THREAT_DETECTED', 'Security', null, {
      ip: req.ip,
      message: 'Client attempted to override role via headers',
      headers: req.headers
    });
  }

  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      const token = authHeader.split(' ')[1];
      
      // Stateless validation (No DB hit!)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Immediate revocation check via Redis
      const isLocked = await redisClient.get(`locked_user:${decoded.id}`);
      if (isLocked || decoded.status === 'locked') {
        return res.status(403).json({ success: false, message: 'Account is locked' });
      }

      // Check token version to handle global logout/password reset
      const User = require('../models/User');
      const user = await User.findById(decoded.id).select('tokenVersion status');
      
      const tokenVersion = decoded.tokenVersion !== undefined ? decoded.tokenVersion : 0;

      if (!user || user.tokenVersion !== tokenVersion) {
        loggerService.logAudit(null, 'THREAT_DETECTED', 'Security', null, {
          ip: req.ip,
          message: 'Client used revoked token',
          userId: decoded.id
        });
        return res.status(401).json({ success: false, message: 'Token has been revoked' });
      }

      if (user.status === 'locked') {
        return res.status(403).json({ success: false, message: 'Account is locked' });
      }

      req.user = decoded; // contains { id, role, status, tokenVersion }
      next();
    } catch (error) {
      console.error('Auth error:', error.message);
      loggerService.logAudit(null, 'THREAT_DETECTED', 'Security', null, {
        ip: req.ip,
        message: 'Invalid or expired token',
        error: error.message
      });
      res.status(401).json({ success: false, message: 'Not authorized, token failed or expired' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      loggerService.logAudit(req.user ? req.user.id : null, 'AUTHORIZATION_FAILURE', 'Security', null, {
        ip: req.ip,
        message: `User attempted to access restricted route requiring ${roles.join(' or ')}`,
        route: req.originalUrl,
        userRole: req.user ? req.user.role : 'none'
      });
      res.status(403).json({ success: false, message: `Not authorized as ${roles.join(' or ')}` });
    }
  };
};

module.exports = { authenticate, authorize, protect: authenticate, admin: authorize('admin') };
