const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthService {
  async login(email, password) {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      const payload = { 
        id: user._id, 
        role: user.role, 
        status: user.status,
        tokenVersion: user.tokenVersion
      };
      
      const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' }
      );
      
      const refreshToken = jwt.sign(
        { id: user._id, tokenVersion: user.tokenVersion },
        process.env.JWT_REFRESH_SECRET || 'refresh_secret',
        { expiresIn: '7d' }
      );

      return {
        accessToken,
        refreshToken,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      };
    }
    throw new Error('Invalid email or password');
  }

  async refresh(refreshToken) {
    if (!refreshToken) throw new Error('No refresh token provided');
    
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
      const user = await User.findById(decoded.id);
      
      if (!user) throw new Error('User not found');
      if (user.tokenVersion !== decoded.tokenVersion) throw new Error('Token revoked');
      if (user.status === 'locked') throw new Error('User is locked');

      const payload = { 
        id: user._id, 
        role: user.role, 
        status: user.status,
        tokenVersion: user.tokenVersion
      };

      const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' }
      );

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId) {
    // Increment tokenVersion to revoke all existing refresh tokens
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
  }

  async register(data) {
    const user = new User(data);
    await user.save();
    const userObject = user.toObject({ virtuals: true });
    delete userObject.password;
    return userObject;
  }

  async getAllUsers() {
    return await User.find({}, '-password');
  }

  async updateStatus(id, status) {
    return await User.findByIdAndUpdate(id, { status }, { new: true });
  }

  async deleteUser(id) {
    return await User.findByIdAndDelete(id);
  }
}

module.exports = new AuthService();
