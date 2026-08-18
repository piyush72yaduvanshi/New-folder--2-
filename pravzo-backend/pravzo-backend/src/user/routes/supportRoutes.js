const express = require("express");
const router = express.Router();

const supportController = require("../controllers/supportController");
const authMiddleware = require("../middleware/authMiddleware");
const adminAuthMiddleware = require("../../admin/middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

// Breakdown Reports
router.post(
  "/breakdown-reports",
  authMiddleware,
  supportController.submitBreakdownReport
);
router.get(
  "/breakdown-reports/me",
  authMiddleware,
  supportController.getMyBreakdownReports
);
// Get single breakdown report by ID
router.get(
  "/breakdown-reports/:reportId",
  authMiddleware,
  supportController.getBreakdownReportById
);

// SOS Alerts
router.post("/sos/alert", authMiddleware, supportController.triggerSosAlert);
router.get("/sos/me",     authMiddleware, supportController.getMySosAlerts);

// BUG-0004 FIX: SOS resolve is admin-only but was gated by user authMiddleware.
// Admin JWTs use a different secret (accessTokenSecret vs userSecret) and are
// rejected by userAuth with 401. Fix: use admin auth middleware for this route.
router.put(
  "/sos/:id/resolve",
  adminAuthMiddleware,
  supportController.resolveSosAlert
);

module.exports = router;
