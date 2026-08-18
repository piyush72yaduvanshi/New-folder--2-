
'use strict';

const { v4: uuidv4 } = require('uuid');

// ─── Pagination Builder ───────────────────────────────────────────────────────

function buildPagination(page, limit, total) {
  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 20;
  const t = parseInt(total) || 0;
  const totalPages = l > 0 ? Math.ceil(t / l) : 0;
  return {
    page: p,
    limit: l,
    total: t,
    totalPages,
    hasNext: p < totalPages,
    hasPrevious: p > 1
  };
}

// ─── Meta Builder ─────────────────────────────────────────────────────────────

function buildMeta(req, paginationData = null) {
  const meta = {
    timestamp: new Date().toISOString(),
    requestId: (req && req.requestId) || uuidv4()
  };
  if (paginationData) {
    meta.pagination = paginationData;
  }
  return meta;
}

// ─── Response Functions ───────────────────────────────────────────────────────


function sendSuccess(res, statusCode, message, data = null, options = {}) {
  const { pagination, req } = options;

  const paginationMeta = pagination
    ? buildPagination(pagination.page, pagination.limit, pagination.total)
    : null;

  const response = {
    success: true,
    message: message || 'Success'
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  response.meta = buildMeta(req, paginationMeta);

  return res.status(statusCode).json(response);
}


function sendError(res, statusCode, message, errorCode = null, details = null, req = null) {
  const response = {
    success: false,
    message: message || 'An error occurred'
  };

  if (errorCode) {
    response.errorCode = errorCode;
  }

  if (details && Array.isArray(details) && details.length > 0) {
    response.details = details;
  }

  response.meta = buildMeta(req);

  return res.status(statusCode).json(response);
}


function sendValidationError(res, errors, req = null) {
  return sendError(
    res, 400,
    'Validation failed',
    'VALIDATION_ERROR',
    errors.map(e => ({ field: e.path || e.param, message: e.msg })),
    req
  );
}

function sendNotFound(res, resource, req = null) {
  return sendError(
    res, 404,
    `${resource} not found`,
    `${resource.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`,
    null, req
  );
}

/**
 * Send a 403 forbidden response.
 */
function sendForbidden(res, message = 'You do not have permission to perform this action', req = null) {
  return sendError(res, 403, message, 'FORBIDDEN', null, req);
}

/**
 * Send a 401 unauthorized response.
 */
function sendUnauthorized(res, message = 'Authentication required', req = null) {
  return sendError(res, 401, message, 'UNAUTHORIZED', null, req);
}

// ─── Request ID Middleware ─────────────────────────────────────────────────────


function requestIdMiddleware(req, res, next) {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendForbidden,
  sendUnauthorized,
  buildPagination,
  requestIdMiddleware
};
