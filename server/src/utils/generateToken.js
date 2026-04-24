const crypto = require("crypto");

/**
 * Generates a secure 32-byte unique device token
 */
function generateDeviceToken() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = {
  generateDeviceToken
};
