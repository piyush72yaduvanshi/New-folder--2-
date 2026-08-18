const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");
const ownerMiddleware = require("../middleware/ownerMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

// ── WEBHOOK (no auth — raw body required; registered before body parsers in app.js) ──
router.post("/razorpay/webhook", paymentController.handleRazorpayWebhook);

// ── STATIC / COLLECTION ROUTES (MUST be before /:paymentId) ──────────────────

// My payment history
router.get("/me", authMiddleware, paymentController.getMyPayments);

// Wallet balance shortcut
router.get("/wallet", authMiddleware, paymentController.getWalletBalance);

// Add money to wallet (shortcut → creates Razorpay topup order)
router.post("/wallet/add-money", authMiddleware, paymentController.addMoneyToWallet);

// Payment summary (totals, counts)
router.get("/summary", authMiddleware, paymentController.getPaymentSummary);

// Refunds list
router.get("/refunds", authMiddleware, paymentController.getMyRefunds);

// Saved payment methods
router.get("/methods", authMiddleware, paymentController.getPaymentMethods);
router.post("/methods", authMiddleware, paymentController.addPaymentMethod);
router.delete("/methods/:methodId", authMiddleware, paymentController.deletePaymentMethod);

// Gateway: create Razorpay order for booking payment
router.post("/gateway/initiate", authMiddleware, paymentController.initiatePaymentGateway);

// Apply coupon to payment
router.post("/apply-coupon", authMiddleware, paymentController.applyCouponToPayment);

// Validate coupon code
router.get("/validate-coupon/:code", authMiddleware, paymentController.validateCouponCode);

// Rider earnings (admin-only write, rider-only read)
router.post(
  "/rider-earnings",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  paymentController.createRiderEarning,
);
router.get(
  "/rider-earnings/:userId",
  authMiddleware,
  ownerMiddleware("userId"),
  authorizeRoles("VEHICLE_WITH_JOB", "ADMIN", "SUPER_ADMIN"),
  paymentController.getRiderEarnings,
);

// ── PARAMETERIZED ROUTES (/:paymentId — MUST be last) ────────────────────────

// Get single payment
router.get("/:paymentId", authMiddleware, paymentController.getPaymentById);

// Get payment receipt
router.get("/:paymentId/receipt", authMiddleware, paymentController.getPaymentReceipt);

// Verify Razorpay payment after callback
router.post("/:paymentId/verify", authMiddleware, paymentController.verifyBookingPayment);

// Request refund
router.post("/:paymentId/refund", authMiddleware, paymentController.requestRefund);

module.exports = router;
