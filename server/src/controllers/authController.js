const authService = require('../services/authService');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      const { accessToken, refreshToken, user } = await authService.login(email, password);
      
      // Set HttpOnly cookie for refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({ accessToken, user });
    } catch (error) {
      // Return 401 for invalid credentials
      if (error.message === 'Invalid email or password') {
        return res.status(401).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token' });
      }

      const { accessToken } = await authService.refresh(refreshToken);
      res.json({ accessToken });
    } catch (error) {
      // Clear invalid cookie
      res.clearCookie('refreshToken');
      res.status(401).json({ message: error.message || 'Refresh failed' });
    }
  }

  async logout(req, res, next) {
    try {
      // Optional: Revoke tokens for the user completely (global logout)
      if (req.user?.id) {
        await authService.logout(req.user.id);
      }
      res.clearCookie('refreshToken');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const users = await authService.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async lockUser(req, res, next) {
    try {
      await authService.updateStatus(req.params.id, 'locked');
      res.json({ message: 'User locked' });
    } catch (error) {
      next(error);
    }
  }

  async unlockUser(req, res, next) {
    try {
      await authService.updateStatus(req.params.id, 'active');
      res.json({ message: 'User unlocked' });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await authService.deleteUser(req.params.id);
      res.json({ message: 'User deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
