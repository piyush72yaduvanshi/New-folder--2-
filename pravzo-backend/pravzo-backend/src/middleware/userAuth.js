'use strict';
// userAuth.js — verifies user/rider JWT (Bearer header only)
// Attaches req.user = { id, role, phone_number, email, status, application_status }

const jwt = require('jsonwebtoken');
const db  = require('../config/db');
const jwtConfig = require('../config/jwt');

module.exports = async function userAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token missing' });
    }

    const token = authHeader.slice(7).trim();
    const decoded = jwt.verify(token, jwtConfig.userSecret);

    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    const [rows] = await db.query(
      `SELECT u.user_id, u.full_name, u.phone, u.email, u.status,
              r.role_name AS role,
              up.kyc_status, up.job_type
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       WHERE u.user_id = ? AND u.deleted_at IS NULL LIMIT 1`,
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const user = rows[0];
    if (['INACTIVE', 'BLOCKED', 'DELETED', 'SUSPENDED'].includes(String(user.status).toUpperCase())) {
      return res.status(403).json({ success: false, message: 'Your account is not allowed to access this resource' });
    }

    req.user = {
      id:                 Number(user.user_id),
      role:               user.role,
      phone_number:       user.phone || null,   // alias for backward compat
      email:              user.email || null,
      status:             user.status || null,
      application_status: user.kyc_status || null,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError)   return res.status(401).json({ success: false, message: 'Token expired' });
    if (err instanceof jwt.JsonWebTokenError)   return res.status(401).json({ success: false, message: 'Invalid token' });
    return res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};
