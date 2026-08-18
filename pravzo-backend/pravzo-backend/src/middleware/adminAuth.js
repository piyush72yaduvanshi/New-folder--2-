'use strict';
// adminAuth.js — verifies admin JWT (httpOnly cookie OR Bearer header)
// Attaches req.admin = { admin_id, email, role, status }

const jwt = require('jsonwebtoken');
const db  = require('../config/db');
const jwtConfig = require('../config/jwt');
const { sendError } = require('../utils/responseWrapper');
const logger = require('../utils/logger');

module.exports = async function adminAuth(req, res, next) {
  try {
    // Accept token from cookie first, then Authorization header
    let token = req.cookies?.accessToken;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }
    if (!token) return sendError(res, 401, 'Access token is required', 'TOKEN_MISSING', null, req);

    const decoded = jwt.verify(token, jwtConfig.accessTokenSecret);

    const [rows] = await db.query(
      `SELECT u.user_id AS admin_id, u.email, r.role_name AS role, u.status, u.deleted_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [decoded.admin_id || decoded.user_id]
    );

    if (!rows.length || rows[0].deleted_at !== null) {
      logger.security('Admin auth: not found or deleted', { adminId: decoded.admin_id || decoded.user_id, ip: req.ip });
      return sendError(res, 401, 'Account not found', 'ACCOUNT_NOT_FOUND', null, req);
    }

    if (rows[0].status !== 'ACTIVE') {
      logger.security('Admin auth: inactive account', { adminId: decoded.admin_id || decoded.user_id, status: rows[0].status });
      return sendError(res, 403, `Account is ${rows[0].status?.toLowerCase()}.`, 'ACCOUNT_INACTIVE', null, req);
    }

    req.admin = { admin_id: rows[0].admin_id, email: rows[0].email, role: rows[0].role, status: rows[0].status };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return sendError(res, 401, 'Access token expired', 'TOKEN_EXPIRED', null, req);
    if (err.name === 'JsonWebTokenError') return sendError(res, 401, 'Invalid access token', 'INVALID_TOKEN', null, req);
    logger.error('Admin auth error', { error: err.message });
    return sendError(res, 401, 'Authentication failed', 'AUTH_FAILED', null, req);
  }
};
