const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/BookingController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const {
  getBookingsValidation,
  getBookingByIdValidation,
  exportBookingsValidation,
  cancelBookingValidation,
  rescheduleBookingValidation,
  refundBookingValidation,
  reassignRiderValidation,
  contactValidation,
  manualCompleteValidation,
  updatePaymentValidation,
  updateFareValidation,
  updateStatusValidation,
  analyticsDateRangeValidation
} = require('../validations/bookingValidation');

// All routes require authentication
router.use(authMiddleware);

// ==================== STATIC / COLLECTION ROUTES (must be BEFORE /:id) ====================

router.get(
  '/',
  getBookingsValidation,
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getBookings
);

router.get(
  '/statistics',
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getBookingStatistics
);

router.get(
  '/export',
  exportBookingsValidation,
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.exportBookings
);

// ==================== ANALYTICS ROUTES (convention: static routes before parameterized) ====================
// NOTE: Express /:id only matches a single path segment, so two-segment paths like
// /analytics/revenue are NOT technically shadowed by /:id. However, placing all static
// routes before parameterized routes is idiomatic Express convention and prevents any
// future single-segment static route (e.g. /analytics) from being accidentally shadowed.

router.get(
  '/analytics/revenue',
  analyticsDateRangeValidation,
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getRevenueAnalytics
);

router.get(
  '/analytics/top-cities',
  analyticsDateRangeValidation,
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getTopCities
);

router.get(
  '/analytics/top-riders',
  analyticsDateRangeValidation,
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getTopRiders
);

router.get(
  '/analytics/top-users',
  analyticsDateRangeValidation,
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getTopUsers
);

router.get(
  '/analytics/peak-hours',
  analyticsDateRangeValidation,
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getPeakHours
);

router.get(
  '/analytics/cancellation-report',
  analyticsDateRangeValidation,
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getCancellationReport
);

router.get(
  '/analytics/payment-report',
  analyticsDateRangeValidation,
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getPaymentReport
);

router.get(
  '/analytics/daily-report',
  analyticsDateRangeValidation,
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getDailyReport
);

router.get(
  '/analytics/monthly-report',
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getMonthlyReport
);

router.get(
  '/analytics/yearly-report',
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getYearlyReport
);

// ==================== PARAMETERIZED ROUTES (/:id and sub-routes — AFTER static routes) ====================

router.get(
  '/:id',
  getBookingByIdValidation,
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getBookingById
);

router.get(
  '/:id/invoice',
  getBookingByIdValidation,
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getBookingInvoice
);

router.get(
  '/:id/timeline',
  getBookingByIdValidation,
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getBookingTimeline
);

router.get(
  '/:id/live',
  getBookingByIdValidation,
  permissionMiddleware(['view_bookings', 'manage_bookings']),
  BookingController.getLiveBookingStatus
);

// ==================== OPERATIONAL (PATCH) ROUTES ====================

router.patch(
  '/:id/cancel',
  cancelBookingValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  BookingController.cancelBooking
);

// BUG-0005 FIX: assign-rider moved from user routes (used userAuth/userSecret — admin JWTs always 401)
// to admin routes with proper adminAuth. Now accessible via PATCH /api/admin/bookings/:id/assign-rider
router.patch(
  '/:id/assign-rider',
  getBookingByIdValidation,
  permissionMiddleware(['manage_bookings']),
  BookingController.assignRider
);

router.patch(
  '/:id/reschedule',
  rescheduleBookingValidation,
  permissionMiddleware(['manage_bookings']),
  BookingController.rescheduleBooking
);

router.patch(
  '/:id/refund',
  refundBookingValidation,
  permissionMiddleware(['manage_bookings']),
  BookingController.refundBooking
);

router.patch(
  '/:id/reassign-rider',
  reassignRiderValidation,
  permissionMiddleware(['manage_bookings']),
  BookingController.reassignRider
);

router.patch(
  '/:id/contact-rider',
  contactValidation,
  permissionMiddleware(['manage_bookings']),
  BookingController.contactRider
);

router.patch(
  '/:id/contact-user',
  contactValidation,
  permissionMiddleware(['manage_bookings']),
  BookingController.contactUser
);

router.patch(
  '/:id/manual-complete',
  manualCompleteValidation,
  permissionMiddleware(['manage_bookings']),
  BookingController.manualCompleteBooking
);

router.patch(
  '/:id/manual-start',
  getBookingByIdValidation,
  permissionMiddleware(['manage_bookings']),
  BookingController.manualStartBooking
);

router.patch(
  '/:id/manual-arrival',
  getBookingByIdValidation,
  permissionMiddleware(['manage_bookings']),
  BookingController.manualArrivalBooking
);

router.patch(
  '/:id/update-payment',
  updatePaymentValidation,
  permissionMiddleware(['manage_bookings']),
  BookingController.updatePaymentStatus
);

router.patch(
  '/:id/update-fare',
  updateFareValidation,
  permissionMiddleware(['manage_bookings']),
  BookingController.updateFare
);

router.patch(
  '/:id/update-status',
  updateStatusValidation,
  permissionMiddleware(['manage_bookings']),
  BookingController.updateBookingStatus
);

module.exports = router;

