'use strict';
require('dotenv').config();

// Admin JWT — access + refresh, short-lived, stored in httpOnly cookies
const ADMIN_REQUIRED = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
for (const key of ADMIN_REQUIRED) {
  if (!process.env[key]) {
    throw new Error(`[Security] Required env var "${key}" is not set.`);
  }
}

// User JWT — single long-lived token, sent as Bearer header
if (!process.env.JWT_SECRET) {
  throw new Error('[Security] Required env var "JWT_SECRET" is not set.');
}

module.exports = {
  // Admin
  accessTokenSecret:   process.env.JWT_ACCESS_SECRET,
  refreshTokenSecret:  process.env.JWT_REFRESH_SECRET,
  accessTokenExpiresIn:  process.env.JWT_ACCESS_EXPIRES_IN  || '55m',
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  cookieSecret: process.env.COOKIE_SECRET || (() => {
    console.warn('[Security] COOKIE_SECRET not set — using ephemeral value.');
    return require('crypto').randomBytes(32).toString('hex');
  })(),

  // User/Rider
  userSecret:      process.env.JWT_SECRET,
  userExpiresIn:   process.env.JWT_EXPIRES_IN || '7d',
};
