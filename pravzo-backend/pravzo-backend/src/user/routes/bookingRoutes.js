const express = require("express");
const router = express.Router();
const { body, validationResult } = require('express-validator');

const bookingController = require("../controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");
const ownerMiddleware = require("../middleware/ownerMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

const validateBooking = [
  body('vehicle_id').isInt({ min: 1 }).withMessage('vehicle_id must be a positive integer'),
  body('start_date').isDate({ format: 'YYYY-MM-DD' }).withMessage('start_date must be YYYY-MM-DD'),
  body('end_date').isDate({ format: 'YYYY-MM-DD' }).withMessage('end_date must be YYYY-MM-DD'),
  body('reference_id').notEmpty().withMessage('reference_id is required'),
  body('security_deposit').optional().isFloat({ min: 0 }).withMessage('security_deposit must be >= 0'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: errors.array().map(e => ({ field: e.path, message: e.msg })),
      });
    }
    next();
  },
];

// ── STATIC ROUTES (MUST be before /:id) ──────────────────────────────────────

// Pre-booking checklist — no auth needed
router.get("/checklist/pre", bookingController.getPreBookingChecklist);

// User's own bookings
router.get(
  "/user/:userId",
  authMiddleware,
  ownerMiddleware("userId"),
  bookingController.getUserBookings,
);

// ── CREATE BOOKING ────────────────────────────────────────────────────────────
router.post(
  "/",
  authMiddleware,
  authorizeRoles("USER", "ADMIN", "SUPER_ADMIN"),
  validateBooking,
  bookingController.createBooking,
);

// ── PARAMETERIZED ROUTES (/:id and sub-routes) ────────────────────────────────

// Get single booking by ID
router.get("/:id", authMiddleware, bookingController.getBookingById);

// Rental agreement
router.get("/:id/agreement",    authMiddleware, bookingController.getBookingAgreement);
router.post("/:id/accept-agreement", authMiddleware, bookingController.acceptAgreement);

// Timeline
router.get("/:id/timeline", authMiddleware, bookingController.getBookingTimeline);

// Live tracking
router.get("/:id/tracking", authMiddleware, bookingController.getBookingTracking);

// Checklists
router.get( "/:id/checklist/post",    authMiddleware, bookingController.getPostBookingChecklist);
router.post("/:id/checklist/submit",  authMiddleware, bookingController.submitChecklist);

// Damage report
router.post("/:id/damage-report", authMiddleware, bookingController.addDamageReport);

// Extend booking
router.post("/:id/extend", authMiddleware, bookingController.extendBooking);

// Cancel booking
router.put("/:id/cancel", authMiddleware, bookingController.cancelBooking);

// Complete booking (rider/admin)
router.put(
  "/:id/complete",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "VEHICLE_WITH_JOB"),
  bookingController.completeBooking,
);

// NOTE: BUG-0005 FIX — assign-rider is admin-only.
// Returning 403 so existing integrations get a meaningful error.
router.put(
  "/:id/assign-rider",
  authMiddleware,
  (req, res) =>
    res.status(403).json({
      success: false,
      message: 'Rider assignment is an admin-only operation. Use PATCH /api/admin/bookings/:id/assign-rider',
    }),
);

module.exports = router;
