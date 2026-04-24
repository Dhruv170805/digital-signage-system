const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      const token = authHeader.split(' ')[1];
      
      // Stateless validation (No DB hit!)
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      
      if (decoded.status === 'locked') {
        return res.status(403).json({ success: false, message: 'Account is locked' });
      }

      req.user = decoded; // contains { id, role, status, tokenVersion }
      next();
    } catch (error) {
      console.error('Auth error:', error.message);
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
      res.status(403).json({ success: false, message: `Not authorized as ${roles.join(' or ')}` });
    }
  };
};

module.exports = { authenticate, authorize, protect: authenticate, admin: authorize('admin') };
