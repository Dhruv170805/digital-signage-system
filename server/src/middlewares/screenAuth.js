const Screen = require('../models/Screen');

/**
 * Middleware to authenticate a physical screen via deviceToken
 */
const screenAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Device token required' });
    }

    const deviceToken = authHeader.split(' ')[1];
    
    // Find screen and populate group info
    const screen = await Screen.findOne({ deviceToken, isActive: true }).populate('groupId');
    
    if (!screen) {
      return res.status(401).json({ error: 'Invalid or inactive device token' });
    }

    // Attach screen to request
    req.screen = screen;

    // Update lastSeen and status asynchronously
    screen.lastSeen = new Date();
    screen.status = 'online';
    await screen.save();

    next();
  } catch (error) {
    res.status(500).json({ error: 'Identity verification failure' });
  }
};

module.exports = screenAuth;
