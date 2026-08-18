const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AdminRepository = require('../repositories/AdminRepository');
const RefreshTokenRepository = require('../repositories/RefreshTokenRepository');
const jwtConfig = require('../../../src/config/jwt');
const { formatMySQLDate } = require('../../../src/utils/helpers');
const logger = require('../../../src/utils/logger');

class AuthService {
  // Generate Access Token
  generateAccessToken(admin) {
    return jwt.sign(
      {
        admin_id: admin.admin_id,
        email: admin.email,
        role: admin.role,
        status: admin.status
      },
      jwtConfig.accessTokenSecret,
      { expiresIn: jwtConfig.accessTokenExpiresIn }
    );
  }

  // Generate Refresh Token
  generateRefreshToken(admin) {
    return jwt.sign(
      {
        admin_id: admin.admin_id,
        email: admin.email
      },
      jwtConfig.refreshTokenSecret,
      { expiresIn: jwtConfig.refreshTokenExpiresIn }
    );
  }

  // Login Service
  async login(email, password) {
    // Find admin by email
    const admin = await AdminRepository.findByEmail(email);

    if (!admin) {
      throw new Error('Invalid email or password');
    }

    if (admin.status !== 'ACTIVE') {
      throw new Error('Invalid email or password');
    }

    // Verify password — field aliased as 'password' from hashed_password column
    const isPasswordValid = await bcrypt.compare(password, admin.password || admin.password_hash || '');

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await AdminRepository.updateLastLogin(admin.admin_id, formatMySQLDate());

    // Generate tokens
    const accessToken = this.generateAccessToken(admin);
    const refreshToken = this.generateRefreshToken(admin);

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await RefreshTokenRepository.create({
      admin_id: admin.admin_id,
      refresh_token: refreshToken,
      expires_at: formatMySQLDate(expiresAt),
      created_at: formatMySQLDate()
    });

    logger.info('Admin logged in successfully', { admin_id: admin.admin_id, email: admin.email });

    return {
      admin: admin.toResponse(),
      accessToken,
      refreshToken
    };
  }

  // Refresh Token Service
  async refreshToken(refreshToken) {
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, jwtConfig.refreshTokenSecret);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }

    // Check if token exists in database
    const tokenRecord = await RefreshTokenRepository.findByToken(refreshToken);

    if (!tokenRecord) {
      throw new Error('Refresh token not found');
    }

    // Check if token is expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      await RefreshTokenRepository.deleteByToken(refreshToken);
      throw new Error('Refresh token expired');
    }

    // Get admin details
    const admin = await AdminRepository.findById(decoded.admin_id);

    if (!admin) {
      throw new Error('Admin not found');
    }

    if (admin.status !== 'ACTIVE') {
      throw new Error(`Account is ${admin.status.toLowerCase()}`);
    }

    // Generate new access token
    const newAccessToken = this.generateAccessToken(admin);

    logger.info('Access token refreshed', { admin_id: admin.admin_id });

    return {
      accessToken: newAccessToken
    };
  }

  // Logout Service
  async logout(refreshToken) {
    if (refreshToken) {
      await RefreshTokenRepository.deleteByToken(refreshToken);
      logger.info('Admin logged out successfully');
    }
    return true;
  }

  // Get Profile Service
  async getProfile(adminId) {
    const admin = await AdminRepository.findById(adminId);

    if (!admin) {
      throw new Error('Admin not found');
    }

    return admin.toResponse();
  }
}

module.exports = new AuthService();

