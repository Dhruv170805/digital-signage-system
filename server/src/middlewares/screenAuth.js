const prisma = require('../utils/db');

module.exports = async function screenAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No device token provided" });
  }

  try {
    const screen = await prisma.screen.findUnique({
      where: { deviceToken: token }
    });

    if (!screen) {
      return res.status(401).json({ error: "Invalid device token" });
    }

    if (!screen.isActive) {
      return res.status(403).json({ error: "Screen is inactive" });
    }

    req.screen = screen;

    // Update last seen
    await prisma.screen.update({
      where: { id: screen.id },
      data: {
        lastSeen: new Date(),
        status: 'online'
      }
    });

    next();
  } catch (err) {
    console.error('Screen auth error:', err);
    res.status(500).json({ error: "Server error during screen authentication" });
  }
};
