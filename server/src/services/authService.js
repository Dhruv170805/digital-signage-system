const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthService {
  async login(email, password) {
    console.log(`🔐 Attempting login for: ${email}`);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found in DB');
      throw new Error('Invalid email or password');
    }

    console.log(`👤 User found: ${user.email}, Status: ${user.status}, Role: ${user.role}`);
    
    const isMatch = await user.matchPassword(password);
    console.log(`🔑 Password match: ${isMatch}`);

    if (isMatch) {
      if (user.status === 'locked') {
        console.log('🚫 Account is locked');
        throw new Error('Account is locked. Contact administrator.');
      }

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
    return await User.find({}, '-password').limit(1000);
  }

  async getUserById(id) {
    return await User.findById(id, '-password');
  }

  async getMe(userId) {
    const user = await User.findById(userId, '-password');
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateStatus(id, status) {
    const { redisClient } = require('../config/redis');
    const updatedUser = await User.findByIdAndUpdate(id, { status }, { new: true });
    
    if (status === 'locked') {
      // Set locked status in Redis with a TTL of 7 days
      await redisClient.setex(`locked_user:${id}`, 7 * 24 * 60 * 60, 'true');
    } else {
      await redisClient.del(`locked_user:${id}`);
    }
    
    return updatedUser;
  }

  async resetPassword(id, newPassword) {
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');
    
    user.password = newPassword;
    user.passwordResetRequested = false;
    // Revoke all tokens on password change
    user.tokenVersion += 1;
    
    await user.save();
    return user;
  }

  async deleteUser(id) {
    return await User.findByIdAndDelete(id);
  }
}

module.exports = new AuthService();
