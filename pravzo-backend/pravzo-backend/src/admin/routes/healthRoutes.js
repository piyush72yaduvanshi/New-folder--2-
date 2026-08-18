"use strict";

const express = require("express");
const router = express.Router();
const db = require("../../../src/config/db");
const redis = require("../../../src/config/redis");
const authMiddleware = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/permissionMiddleware");

// ─── GET /health — Liveness ───────────────────────────────────────────────────
router.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "pravzo-admin-api",
    timestamp: new Date().toISOString(),

    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// ─── GET /health/ready — Readiness ───────────────────────────────────────────
router.get("/ready", async (req, res) => {
  const checks = { db: "unknown", redis: "unknown" };
  let healthy = true;

  // Database check
  try {
    const conn = await db.getConnection();
    await conn.query("SELECT 1");
    conn.release();
    checks.db = "ok";
  } catch (err) {
    checks.db = "error";
    healthy = false;
  }

  // Redis check (optional — Redis may be disabled)
  try {
    if (redis.useRedis && redis.isRedisReady()) {
      checks.redis = "ok";
    } else {
      checks.redis = redis.useRedis ? "unavailable" : "disabled";
    }
  } catch (err) {
    checks.redis = "error";
    // Redis failure is non-fatal — system can still serve requests
  }

  const status = healthy ? 200 : 503;
  res.status(status).json({
    status: healthy ? "READY" : "NOT_READY",
    timestamp: new Date().toISOString(),
    checks,
  });
});

// ─── GET /health/metrics — Runtime Metrics (SUPER_ADMIN only) ────────────────
router.get(
  "/metrics",
  authMiddleware,
  checkPermission(["SUPER_ADMIN"]),
  async (req, res) => {
    const memUsage = process.memoryUsage();
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || "development",
      memory: {
        rssBytes: memUsage.rss,
        heapUsedBytes: memUsage.heapUsed,
        heapTotalBytes: memUsage.heapTotal,
        externalBytes: memUsage.external,
        rssMB: (memUsage.rss / 1024 / 1024).toFixed(2),
        heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
      },
      platform: process.platform,
      // Note: process.pid intentionally omitted — information disclosure risk
    });
  },
);

module.exports = router;
