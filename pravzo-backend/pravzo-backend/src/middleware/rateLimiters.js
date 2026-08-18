'use strict';

const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/responseWrapper');

// Rate limiting is disabled in development and test environments to ease local development and testing.
// In production, full rate limiting is enforced.
function isDevelopmentOrTest() {
  const env = (process.env.NODE_ENV || '').trim().toLowerCase();
  return env === 'development' || env === 'developmenr' || env === 'dev' || env === 'test';
}

function createLimiter(windowMs, max, message, code) {
  const limiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return sendError(res, 429, message, code, null, req);
    }
  });

  return (req, res, next) => {
    if (isDevelopmentOrTest()) {
      // Pass-through middleware — does not apply rate limiting in development/test
      return next();
    }
    return limiter(req, res, next);
  };
}

// 1. Admin Login: max 10 requests per 15 minutes
const adminLoginLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many admin login attempts. Please try again in 15 minutes.',
  'ADMIN_LOGIN_RATE_LIMIT'
);

// 2. User Login / Registration: max 15 requests per 15 minutes
const userLoginLimiter = createLimiter(
  15 * 60 * 1000,
  15,
  'Too many login attempts. Please try again in 15 minutes.',
  'USER_LOGIN_RATE_LIMIT'
);

// 3. OTP Send: max 5 requests per 10 minutes
const otpSendLimiter = createLimiter(
  10 * 60 * 1000,
  5,
  'Too many OTP requests. Please wait before requesting another OTP.',
  'OTP_SEND_RATE_LIMIT'
);

// 4. OTP Verification: max 10 requests per 10 minutes
const otpVerifyLimiter = createLimiter(
  10 * 60 * 1000,
  10,
  'Too many OTP verification attempts. Please try again later.',
  'OTP_VERIFY_RATE_LIMIT'
);

// 5. Password Reset / Forgot Password: max 5 requests per 15 minutes
const passwordResetLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  'Too many password reset requests. Please try again in 15 minutes.',
  'PASSWORD_RESET_RATE_LIMIT'
);

// 6. File Uploads: max 20 requests per 15 minutes
const uploadLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  'Too many file upload requests. Please try again later.',
  'UPLOAD_RATE_LIMIT'
);

// 7. Global API Limiter: 100 requests per minute
const globalApiLimiter = createLimiter(
  60 * 1000,
  100,
  'Too many requests. Please slow down.',
  'GLOBAL_RATE_LIMIT'
);

module.exports = {
  adminLoginLimiter,
  userLoginLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  passwordResetLimiter,
  uploadLimiter,
  globalApiLimiter
};
