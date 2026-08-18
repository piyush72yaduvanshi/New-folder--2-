/**
 * securityMiddleware.js — Phase 4 Security Hardening
 *
 * Centralizes all security middleware:
 *  - Helmet: HTTP security headers
 *  - Rate limiting: per-IP brute-force protection
 *  - HPP: HTTP parameter pollution prevention
 *  - Request size limiting
 *  - Suspicious request detection
 *
 * Mount order in app.js:
 *   1. helmetMiddleware
 *   2. rateLimiters (on specific routes)
 *   3. hppMiddleware
 */

'use strict';

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const structuredLogger = require('../utils/structuredLogger');

// ─── Helmet — Security Headers ────────────────────────────────────────────────

/**
 * Helmet with production-appropriate settings.
 * Sets X-Frame-Options, X-Content-Type-Options, HSTS, etc.
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow API to be consumed by browsers
  hsts: {
    maxAge: 31536000,       // 1 year
    includeSubDomains: true,
    preload: true
  }
});

// ─── Rate Limiters ────────────────────────────────────────────────────────────

function isDevelopmentOrTest() {
  const env = (process.env.NODE_ENV || '').trim().toLowerCase();
  return env === 'development' || env === 'developmenr' || env === 'dev' || env === 'test';
}

/**
 * Global rate limiter — 200 requests per 15 minutes per IP.
 * Applied to all API routes.
 */
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,
  standardHeaders: true,      // Return rate limit info in headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res, next, options) => {
    structuredLogger.security('[RateLimit] Global limit exceeded', {
      ip: req.ip,
      path: req.path,
      requestId: req.requestId
    });
    res.status(429).json(options.message);
  },
  skip: (req) => {
    if (isDevelopmentOrTest()) return true;
    // Skip rate limiting for all health check endpoints.
    // Kubernetes/Docker probes /health and /health/ready frequently.
    return req.path.startsWith('/health');
  }
});

/**
 * Auth rate limiter — 10 login attempts per 15 minutes per IP.
 * Applied only to POST /api/admin/login.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    errorCode: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skip: () => isDevelopmentOrTest(),
  handler: (req, res, next, options) => {
    structuredLogger.security('[RateLimit] Auth limit exceeded — possible brute force', {
      ip: req.ip,
      // Log only first 20 chars of email to avoid sensitive data in logs
      email: req.body?.email ? req.body.email.substring(0, 20) + '...' : 'unknown',
      requestId: req.requestId
    });
    res.status(429).json(options.message);
  }
});


const adminActionRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many admin actions. Please slow down.',
    errorCode: 'ADMIN_ACTION_RATE_LIMIT'
  },
  skip: (req) => isDevelopmentOrTest() || req.method === 'GET' // Only limit write operations
});


const hppMiddleware = hpp({
  whitelist: [
    // Allow arrays only for these known multi-value params
    'ids', 'vehicleIds', 'riderIds', 'status', 'role'
  ]
});


function suspiciousRequestDetector(req, res, next) {
  const suspicious = [];

  // Detect potential path traversal
  if (req.path.includes('..') || req.path.includes('%2e%2e')) {
    suspicious.push('path_traversal');
  }

 
  const queryStr = JSON.stringify(req.query || {}).toLowerCase();
  if (/(\bselect\b|\bunion\b|\bdrop\b|\binsert\b|\bdelete\b|\bexec\b|\bxp_\w)/i.test(queryStr)) {
    suspicious.push('sql_injection_in_query_string');
  }

  // Detect large request bodies (>1MB for non-file routes)
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 1024 * 1024 && !req.path.includes('upload')) {
    suspicious.push('oversized_payload');
  }

  if (suspicious.length > 0) {
    structuredLogger.warn('[Security] Suspicious request detected', {
      flags: suspicious,
      ip: req.ip,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent']?.substring(0, 100),
      requestId: req.requestId
    });
  }

  next();
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  helmetMiddleware,
  globalRateLimiter,
  authRateLimiter,
  adminActionRateLimiter,
  hppMiddleware,
  suspiciousRequestDetector
};
