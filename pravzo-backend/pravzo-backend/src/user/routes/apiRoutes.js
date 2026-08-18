const express = require("express");
const router = express.Router();

// ── Core ─────────────────────────────────────────────────────────────────────
router.use("/auth",          require("./authRoutes"));
router.use("/users",         require("./userRoutes"));
router.use("/users",         require("./roleRoutes"));       // POST /users/:id/change-role
router.use("/riders",        require("./riderRoutes"));
// NOTE: admin-only user routes (e.g. rider verification) live in src/admin/routes/riderRoutes.js

// ── Vehicles & Bookings ───────────────────────────────────────────────────────
router.use("/vehicles",      require("./vehicleRoutes"));
router.use("/bookings",      require("./bookingRoutes"));
router.use("/bookings",      require("./invoiceRoutes"));    // GET /bookings/:id/invoice

// ── Jobs ──────────────────────────────────────────────────────────────────────
router.use("/jobs",          require("./jobRoutes"));

// ── Notifications ─────────────────────────────────────────────────────────────
router.use("/notifications", require("./notificationRoutes"));

// ── Location ──────────────────────────────────────────────────────────────────
router.use("/location",      require("./locationRoutes"));

// ── Payments & Wallet ─────────────────────────────────────────────────────────
router.use("/payments",      require("./paymentRoutes"));
router.use("/wallet",        require("./walletRoutes"));
router.use("/history",       require("./historyRoutes"));
router.use("/payouts",       require("./payoutRoutes"));

// ── Coupons ───────────────────────────────────────────────────────────────────
router.use("/coupons",       require("./couponRoutes"));

// ── Support: Breakdown Reports + SOS Alerts ───────────────────────────────────
router.use("/",              require("./supportRoutes"));    // /breakdown-reports, /sos/*

// ── Resources: Charging Stations + Guides ────────────────────────────────────
router.use("/",              require("./resourceRoutes"));   // /charging-stations, /guides

// ── Rider Performance Analytics ───────────────────────────────────────────────
router.use("/performance",   require("./performanceRoutes"));

module.exports = router;
