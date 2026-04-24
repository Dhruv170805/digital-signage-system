const screenService = require('../services/screenService');

module.exports = async function screenAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No device token provided" });
  }

  try {
    const screen = await screenService.getScreenByToken(token);

    if (!screen) {
      return res.status(401).json({ error: "Invalid device token" });
    }

    req.screen = screen;

    // Update last seen (heartbeat logic can be moved to service)
    await screenService.updateHeartbeat(token);

    next();
  } catch (err) {
    console.error('Screen auth error:', err);
    res.status(500).json({ error: "Server error during screen authentication" });
  }
};
