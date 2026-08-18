const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const {
  getPaymentsValidation,
  getPaymentByIdValidation,
  exportPaymentsValidation,
  processRefundValidation,
  updatePaymentStatusValidation,
  walletOperationValidation,
  getSettlementsValidation,
  processSettlementValidation,
  analyticsDateRangeValidation
} = require('../validations/paymentValidation');

// All routes require authentication
router.use(authMiddleware);

// ==================== IMPORTANT: Route Order Matters! ====================
// Specific routes MUST be defined BEFORE parameterized routes (:id)
// Otherwise Express will match specific paths like '/settlements' to '/:id'
// ========================================================================

// ==================== PAYMENT ROUTES (Specific paths first) ====================

// Get payment statistics
router.get(
  '/statistics',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getPaymentStatistics
);

// Export payments
router.get(
  '/export',
  exportPaymentsValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.exportPayments
);

// ==================== WALLET ROUTES ====================

// Get user wallet
router.get(
  '/wallet/users/:id',
  getPaymentByIdValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getUserWallet
);

// Get rider wallet
router.get(
  '/wallet/riders/:id',
  getPaymentByIdValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getRiderWallet
);

// Credit user wallet
router.patch(
  '/wallet/users/:id/credit',
  walletOperationValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.creditUserWallet
);

// Debit user wallet
router.patch(
  '/wallet/users/:id/debit',
  walletOperationValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.debitUserWallet
);

// Credit rider wallet
router.patch(
  '/wallet/riders/:id/credit',
  walletOperationValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.creditRiderWallet
);

// Get wallet history
router.get(
  '/wallet/history/:id',
  getPaymentByIdValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getWalletHistory
);

// ==================== SETTLEMENT ROUTES ====================

// Get settlements list
router.get(
  '/settlements',
  getSettlementsValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getSettlements
);

// Get settlement details by ID
router.get(
  '/settlements/:id',
  getPaymentByIdValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getSettlementById
);

// Process settlement
router.patch(
  '/settlements/:id/process',
  processSettlementValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.processSettlement
);

// ==================== COMMISSION ROUTES ====================

// Get commission overview
router.get(
  '/commission/overview',
  analyticsDateRangeValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getCommissionOverview
);

// ==================== ANALYTICS ROUTES ====================

// Get revenue analytics
router.get(
  '/analytics/revenue',
  analyticsDateRangeValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getRevenueAnalytics
);

// Get payment method distribution
router.get(
  '/analytics/payment-methods',
  analyticsDateRangeValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getPaymentMethodDistribution
);

// Get top cities
router.get(
  '/analytics/top-cities',
  analyticsDateRangeValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getTopCities
);

// Get top users
router.get(
  '/analytics/top-users',
  analyticsDateRangeValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getTopUsers
);

// Get top riders
router.get(
  '/analytics/top-riders',
  analyticsDateRangeValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getTopRiders
);

// Get peak hours
router.get(
  '/analytics/peak-hours',
  analyticsDateRangeValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getPeakHours
);

// Get daily report
router.get(
  '/analytics/daily',
  analyticsDateRangeValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getDailyReport
);

// Get monthly report
router.get(
  '/analytics/monthly',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getMonthlyReport
);

// Get yearly report
router.get(
  '/analytics/yearly',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getYearlyReport
);

// ==================== PAYMENT ROUTES (Parameterized - MUST be last) ====================

// Get payments list with filters
router.get(
  '/',
  getPaymentsValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getPayments
);

// Get payment details by ID
router.get(
  '/:id',
  getPaymentByIdValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.getPaymentById
);

// Process refund
router.patch(
  '/:id/refund',
  processRefundValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.processRefund
);

// Update payment status
router.patch(
  '/:id/status',
  updatePaymentStatusValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.updatePaymentStatus
);

// Verify payment
router.patch(
  '/:id/verify',
  getPaymentByIdValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  PaymentController.verifyPayment
);

module.exports = router;

