'use strict';

const structuredLogger = require('../../../src/utils/structuredLogger');
const { sendError } = require('../../../src/utils/responseWrapper');

// Map of known MySQL error codes to user-friendly messages
const MYSQL_ERROR_MAP = {
  'ER_DUP_ENTRY':           { status: 409, message: 'A record with this value already exists', code: 'DUPLICATE_ENTRY' },
  'ER_NO_REFERENCED_ROW_2': { status: 400, message: 'Referenced resource does not exist', code: 'INVALID_REFERENCE' },
  'ER_ROW_IS_REFERENCED_2': { status: 409, message: 'This record is referenced by other data and cannot be deleted', code: 'REFERENCE_CONSTRAINT' },
  'ER_DATA_TOO_LONG':        { status: 400, message: 'Input data is too long for the field', code: 'DATA_TOO_LONG' },
  'ER_TRUNCATED_WRONG_VALUE':{ status: 400, message: 'Invalid value for field', code: 'INVALID_FIELD_VALUE' }
};

const errorHandler = (err, req, res, next) => {
  const requestId = req?.requestId;
  const adminId   = req?.admin?.admin_id;

  // ── 1. Validation Errors (express-validator array) ──────────────────────────
  if (err.name === 'ValidationError' || (Array.isArray(err.errors) && err.errors[0]?.msg)) {
    structuredLogger.warn('[ErrorHandler] Validation error', { requestId, path: req.path });
    return sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR',
      err.errors?.map(e => ({ field: e.path || e.param, message: e.msg })), req);
  }

  // ── 2. JWT Errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    structuredLogger.security('Invalid JWT token', { requestId, ip: req.ip });
    return sendError(res, 401, 'Invalid token', 'INVALID_TOKEN', null, req);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token expired', 'TOKEN_EXPIRED', null, req);
  }

  // ── 3. Multer (file upload) ──────────────────────────────────────────────────
  if (err.name === 'MulterError') {
    return sendError(res, 400, `File upload error: ${err.message}`, 'FILE_UPLOAD_ERROR', null, req);
  }

  // ── 4. MySQL Errors ──────────────────────────────────────────────────────────
  if (err.code && MYSQL_ERROR_MAP[err.code]) {
    const mapped = MYSQL_ERROR_MAP[err.code];
    structuredLogger.error('[ErrorHandler] MySQL error', { code: err.code, requestId });
    return sendError(res, mapped.status, mapped.message, mapped.code, null, req);
  }

  // ── 5. Business Logic Errors (thrown by services) ───────────────────────────
  if (err.statusCode && err.statusCode < 500) {
    return sendError(res, err.statusCode, err.message, err.errorCode || 'BUSINESS_ERROR', null, req);
  }

  // ── 6. Not Found ─────────────────────────────────────────────────────────────
  if (err.message?.toLowerCase().includes('not found')) {
    return sendError(res, 404, err.message, 'NOT_FOUND', null, req);
  }

  // ── 7. Unexpected / Internal Server Errors ───────────────────────────────────
  structuredLogger.error('[ErrorHandler] Unhandled error', {
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    requestId,
    adminId
  });

  // Never expose internal details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'An internal server error occurred. Please try again later.'
    : err.message || 'Internal Server Error';

  return sendError(res, 500, message, 'INTERNAL_ERROR', null, req);
};

module.exports = errorHandler;

