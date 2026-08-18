/**
 * supportController.js
 *
 * Breakdown Reports  —  POST /api/breakdown-reports
 *                       GET  /api/breakdown-reports/me
 *
 * SOS Alerts         —  POST /api/sos/alert
 *                       GET  /api/sos/me
 *                       PUT  /api/sos/:id/resolve  (admin)
 */

const logger = require("../../../src/utils/logger");
const db = require("../../../src/config/db");

// ────────────────────────────────────────────────────────────────────────────
//  BREAKDOWN REPORTS
// ────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/breakdown-reports
 * Body: { booking_id, vehicle_id, issue_type, description, latitude?, longitude?, photo_url? }
 *
 * issue_type: "flat_tyre" | "battery_dead" | "motor_fault" | "accident" | "other"
 */
exports.submitBreakdownReport = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const {
      booking_id,
      vehicle_id,
      issue_type,
      description,
      latitude,
      longitude,
      photo_url,
    } = req.body;

    if (!issue_type || !description) {
      return res.status(400).json({
        success: false,
        message: "issue_type and description are required",
      });
    }

    const allowedIssues = [
      "flat_tyre",
      "battery_dead",
      "motor_fault",
      "accident",
      "other",
    ];

    if (!allowedIssues.includes(String(issue_type).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `issue_type must be one of: ${allowedIssues.join(", ")}`,
      });
    }

    const [result] = await db.query(
      `INSERT INTO breakdown_reports
       (user_id, booking_id, vehicle_id, issue_type, description,
        latitude, longitude, photo_url, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW())`,
      [
        userId,
        booking_id ? Number(booking_id) : null,
        vehicle_id ? Number(vehicle_id) : null,
        String(issue_type).toLowerCase(),
        String(description).trim(),
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
        photo_url || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Breakdown report submitted. Our support team will contact you shortly.",
      data: {
        report_id: result.insertId,
        status: "open",
      },
    });
  } catch (error) {
    logger.error("Breakdown Report Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/breakdown-reports/me
 */
exports.getMyBreakdownReports = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const limit = Math.min(Number(req.query.limit || 20), 50);
    const offset = Math.max(Number(req.query.offset || 0), 0);

    const [rows] = await db.query(
      `SELECT br.*, v.model_name, v.registration_number
       FROM breakdown_reports br
       LEFT JOIN vehicles v ON v.vehicle_id = br.vehicle_id
       WHERE br.user_id = ?
       ORDER BY br.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: { limit, offset, count: rows.length },
    });
  } catch (error) {
    logger.error("Get Breakdown Reports Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  SOS ALERTS
// ────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/sos/alert
 * Body: { booking_id?, vehicle_id?, alert_type, message?, latitude?, longitude? }
 *
 * alert_type: "geo_fence_breach" | "accident" | "theft" | "medical" | "other"
 */
exports.triggerSosAlert = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const {
      booking_id,
      vehicle_id,
      alert_type,
      message,
      latitude,
      longitude,
    } = req.body;

    if (!alert_type) {
      return res.status(400).json({
        success: false,
        message: "alert_type is required",
      });
    }

    const allowedTypes = [
      "geo_fence_breach",
      "accident",
      "theft",
      "medical",
      "other",
    ];

    if (!allowedTypes.includes(String(alert_type).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `alert_type must be one of: ${allowedTypes.join(", ")}`,
      });
    }

    // Prevent duplicate open SOS from same user in last 2 minutes
    // BUG-0003 FIX: PK column is alert_id, not sos_id
    const [openAlerts] = await db.query(
      `SELECT alert_id FROM sos_alerts
       WHERE user_id = ? AND status = 'active'
         AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
       LIMIT 1`,
      [userId]
    );

    if (openAlerts.length) {
      return res.status(409).json({
        success: false,
        message: "An SOS alert is already active. Please wait 2 minutes before sending another.",
        data: { sos_id: openAlerts[0].alert_id },
      });
    }

    // BUG-0003 FIX: actual columns are alert_id(PK auto), booking_id, alert_type,
    // description (not message), latitude, longitude, status — no vehicle_id column
    const [result] = await db.query(
      `INSERT INTO sos_alerts
       (user_id, booking_id, alert_type, description,
        latitude, longitude, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [
        userId,
        booking_id ? Number(booking_id) : null,
        String(alert_type).toLowerCase(),
        message ? String(message).trim() : null,
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
      ]
    );

    // In production: push notification to admin dashboard / ops team here
    logger.debug(
      `[SOS ALERT] User ${userId} | Type: ${alert_type} | Booking: ${booking_id || "-"} | Location: ${latitude},${longitude}`
    );

    return res.status(201).json({
      success: true,
      message: "SOS alert sent. Emergency support has been notified.",
      data: {
        sos_id: result.insertId,
        alert_type,
        status: "active",
      },
    });
  } catch (error) {
    logger.error("SOS Alert Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/sos/me
 */
exports.getMySosAlerts = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const [rows] = await db.query(
      `SELECT * FROM sos_alerts
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    logger.error("Get SOS Alerts Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/sos/:id/resolve  (admin only)
 * Body: { resolution_note? }
 */
exports.resolveSosAlert = async (req, res) => {
  try {
    const sosId = Number(req.params.id);
    const { resolution_note } = req.body;

    // BUG-0003 FIX: PK column is alert_id, not sos_id
    const [result] = await db.query(
      `UPDATE sos_alerts
       SET status = 'resolved', resolution_note = ?, resolved_at = NOW()
       WHERE alert_id = ?`,
      [resolution_note || null, sosId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "SOS alert not found" });
    }

    return res.status(200).json({
      success: true,
      message: "SOS alert resolved successfully",
    });
  } catch (error) {
    logger.error("Resolve SOS Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/breakdown-reports/:reportId
 * Get a single breakdown report by ID (owner or admin only).
 */
exports.getBreakdownReportById = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const reportId = Number(req.params.reportId);
    const userRole = String(req.user.role || "").toUpperCase();

    if (!Number.isInteger(reportId) || reportId <= 0) {
      return res.status(400).json({ success: false, message: "Valid reportId is required" });
    }

    const [rows] = await db.query(
      `SELECT br.*, v.model_name, v.registration_number
       FROM breakdown_reports br
       LEFT JOIN vehicles v ON v.vehicle_id = br.vehicle_id
       WHERE br.report_id = ? LIMIT 1`,
      [reportId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Breakdown report not found" });
    }

    const report = rows[0];
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);

    if (!isAdmin && Number(report.user_id) !== userId) {
      return res.status(403).json({ success: false, message: "You can only view your own reports" });
    }

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    logger.error("Get Breakdown Report By Id Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
