const { validationResult } = require('express-validator');
const AuthService = require('../services/AuthService');
const { successResponse, errorResponse } = require('../../../src/utils/response');
const logger = require('../../../src/utils/logger');

class AuthController {
  // Login
  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Set access token in cookie
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      return successResponse(res, 200, 'Login successful', {
        admin: result.admin,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      });
    } catch (error) {
      logger.error('Login Controller Error:', error);
      const AUTH_ERRORS = [
        'Invalid email or password',
        'Account is',       // covers "Account is blocked.", "Account is suspended.", etc.
        'Admin not found',
        'Invalid or expired refresh token',
        'Refresh token not found',
        'Refresh token expired'
      ];
      const isAuthError = AUTH_ERRORS.some(msg => error.message?.startsWith(msg));
      return errorResponse(res, isAuthError ? 401 : 500, error.message);
    }
  }

  // Refresh Token
  async refreshToken(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      // Get refresh token from cookie or body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return errorResponse(res, 401, 'Refresh token is required');
      }

      const result = await AuthService.refreshToken(refreshToken);

      // Set new access token in cookie
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      return successResponse(res, 200, 'Token refreshed successfully', {
        accessToken: result.accessToken
      });
    } catch (error) {
      logger.error('Refresh Token Controller Error:', error);
      return errorResponse(res, 401, error.message);
    }
  }

  // Logout
  async logout(req, res, next) {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      await AuthService.logout(refreshToken);

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return successResponse(res, 200, 'Logout successful');
    } catch (error) {
      logger.error('Logout Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get Profile
  async getProfile(req, res, next) {
    try {
      const adminId = req.admin.admin_id;

      const admin = await AuthService.getProfile(adminId);

      return successResponse(res, 200, 'Profile retrieved successfully', { admin });
    } catch (error) {
      logger.error('Get Profile Controller Error:', error);
      return errorResponse(res, 404, error.message);
    }
  }
}

module.exports = new AuthController();

