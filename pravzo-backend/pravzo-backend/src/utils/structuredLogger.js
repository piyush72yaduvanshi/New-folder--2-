/**
 * structuredLogger.js — Phase 4 Centralized Structured Logging
 *
 * Wraps the existing logger.js with structured JSON output,
 * correlation (requestId), and explicit sensitive-data scrubbing.
 *
 * Backward compatible: existing code using logger.js continues to work.
 * New code should use this module for structured logging.
 *
 * Rules:
 *  - NEVER log passwords, tokens, secrets, or card numbers
 *  - Always include requestId when available
 *  - Always include structured metadata (not concatenated strings)
 *  - Log level: error > warn > info > debug
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ─── Sensitive Field Scrubber ─────────────────────────────────────────────────

const SENSITIVE_KEYS = new Set([
  'password', 'password_hash', 'passwordHash', 'token', 'accessToken', 'refreshToken',
  'access_token', 'refresh_token', 'secret', 'apiKey', 'api_key', 'cvv', 'card_number',
  'cardNumber', 'otp', 'pin', 'private_key', 'privateKey', 'authorization', 'cookie',
  'credit_card', 'bank_account_number', 'ifsc_code', 'aadhar_number'
]);

function scrubSensitive(obj, depth = 0) {
  if (depth > 5 || obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => scrubSensitive(item, depth + 1));

  const scrubbed = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      scrubbed[key] = '[REDACTED]';
    } else {
      scrubbed[key] = scrubSensitive(value, depth + 1);
    }
  }
  return scrubbed;
}

// ─── Log Entry Builder ────────────────────────────────────────────────────────

function buildEntry(level, message, meta = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'pravzo-unified-api',
    ...scrubSensitive(meta)
  };
}

// ─── File Writers ─────────────────────────────────────────────────────────────

/**
 * Async file append — does NOT block the event loop.
 * fs.appendFile (callback form) schedules the write in the OS async I/O queue.
 * This replaces the previous fs.appendFileSync which blocked the event loop
 * for the duration of the disk write on every log call (MEDIUM-P4-1 fix).
 */
function writeToFile(filename, entry) {
  fs.appendFile(
    path.join(logsDir, filename),
    JSON.stringify(entry) + '\n',
    (err) => {
      if (err) {
        // Fail silently — don't crash the app because of a logging error
        console.error('[Logger] File write error:', err.message);
      }
    }
  );
}

// ─── Logger Interface ─────────────────────────────────────────────────────────

const structuredLogger = {
  /**
   * Log informational message.
   * @param {string} message
   * @param {object} [meta]   Structured metadata (scrubbed before logging)
   */
  info(message, meta = {}) {
    const entry = buildEntry('INFO', message, meta);
    console.log(JSON.stringify(entry));
    writeToFile('info.log', entry);
  },

  /**
   * Log warning.
   */
  warn(message, meta = {}) {
    const entry = buildEntry('WARN', message, meta);
    console.warn(JSON.stringify(entry));
    writeToFile('warn.log', entry);
  },

  /**
   * Log error. Accepts Error objects or plain metadata.
   */
  error(message, errorOrMeta = {}) {
    const meta = errorOrMeta instanceof Error
      ? { error: errorOrMeta.message, stack: errorOrMeta.stack }
      : errorOrMeta;
    const entry = buildEntry('ERROR', message, meta);
    console.error(JSON.stringify(entry));
    writeToFile('error.log', entry);
  },

  /**
   * Log debug — only in non-production environments.
   */
  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'production') return;
    const entry = buildEntry('DEBUG', message, meta);
    console.log(JSON.stringify(entry));
  },

  /**
   * Log security event — always written to security.log only.
   * Not duplicated to warn.log — in log aggregation pipelines (ELK, Splunk),
   * writing to both files causes duplicate alerts on the same event.
   */
  security(event, meta = {}) {
    const entry = buildEntry('SECURITY', event, meta);
    console.warn(JSON.stringify(entry));
    writeToFile('security.log', entry);
  },

  /**
   * Log audit event — immutable admin action record.
   * Written ONLY to audit.log — not info.log, to prevent sensitive
   * audit data polluting the operational log and downstream log aggregators.
   */
  audit(action, meta = {}) {
    const entry = buildEntry('AUDIT', action, meta);
    console.log(JSON.stringify(entry));
    writeToFile('audit.log', entry);
  },

  /**
   * Log HTTP request. Called by requestLogger middleware.
   */
  request(req, res, durationMs) {
    const entry = buildEntry('REQUEST', `${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      requestId: req.requestId,
      userAgent: req.headers['user-agent']?.substring(0, 100),
      adminId: req.admin?.admin_id || null
    });
    console.log(JSON.stringify(entry));
    writeToFile('access.log', entry);
  }
};

module.exports = structuredLogger;
