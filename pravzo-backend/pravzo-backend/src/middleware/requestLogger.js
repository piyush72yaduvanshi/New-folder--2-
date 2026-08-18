'use strict';

const structuredLogger = require('../utils/structuredLogger');

function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    structuredLogger.request(req, res, durationMs);

    // Warn on slow requests (> 2 seconds)
    if (durationMs > 2000) {
      structuredLogger.warn('[Performance] Slow request detected', {
        method: req.method,
        path: req.path,
        durationMs,
        requestId: req.requestId
      });
    }
  });

  next();
}

module.exports = requestLogger;
