const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const {
  revenueReportValidation,
  bookingReportValidation,
  userReportValidation,
  riderReportValidation,
  vehicleReportValidation,
  paymentReportValidation,
  supportReportValidation,
  kycReportValidation,
  topListValidation,
  downloadReportValidation,
  chartDataValidation,
  dateRangeValidation
} = require('../validations/reportValidation');

// All routes require authentication
router.use(authMiddleware);

// ==================== REVENUE REPORTS ====================

router.get(
  '/revenue',
  revenueReportValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getRevenueReport
);

// ==================== BOOKING REPORTS ====================

router.get(
  '/bookings',
  bookingReportValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getBookingReport
);

// ==================== USER REPORTS ====================

router.get(
  '/users',
  userReportValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getUserReport
);

// ==================== RIDER REPORTS ====================

router.get(
  '/riders',
  riderReportValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getRiderReport
);

// ==================== VEHICLE REPORTS ====================

router.get(
  '/vehicles',
  vehicleReportValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getVehicleReport
);

// ==================== PAYMENT REPORTS ====================

router.get(
  '/payments',
  paymentReportValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getPaymentReport
);

// ==================== SUPPORT REPORTS ====================

router.get(
  '/support',
  supportReportValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getSupportReport
);

// ==================== KYC REPORTS ====================

router.get(
  '/kyc',
  kycReportValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getKYCReport
);

// ==================== DASHBOARD ANALYTICS ====================

router.get(
  '/dashboard',
  dateRangeValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getDashboardAnalytics
);

// ==================== TOP LISTS ====================

router.get(
  '/top-users',
  topListValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getTopUsers
);

router.get(
  '/top-riders',
  topListValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getTopRiders
);

router.get(
  '/top-cities',
  topListValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getTopCities
);

router.get(
  '/top-vehicles',
  topListValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getTopVehicles
);

// ==================== CHART DATA ====================

router.get(
  '/charts/revenue',
  chartDataValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getRevenueChartData
);

router.get(
  '/charts/bookings',
  chartDataValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getBookingChartData
);

router.get(
  '/charts/users',
  chartDataValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.getUserChartData
);

// ==================== DOWNLOAD ====================

router.get(
  '/download',
  downloadReportValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  ReportController.downloadReport
);

module.exports = router;

