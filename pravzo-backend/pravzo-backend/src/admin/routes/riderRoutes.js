const express = require('express');
const router = express.Router();
const RiderController = require('../controllers/RiderController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const {
  getRidersValidation,
  getRiderByIdValidation,
  blockRiderValidation,
  unblockRiderValidation,
  updateRiderStatusValidation,
  updateRiderKYCValidation,
  updateRiderVehicleValidation,
  updateRiderLocationValidation,
  updateRiderAvailabilityValidation,
  getRiderCurrentBookingValidation,
  getRiderBookingsValidation,
  getRiderPaymentsValidation,
  getRiderLiveLocationValidation,
  exportRidersValidation,
  createRiderValidation,
  updateRiderValidation,
  verifyKYCValidation,
  assignBranchValidation,
  transferBranchValidation,
  assignVehicleValidation,
  removeVehicleValidation,
  getRiderVehicleValidation,
  getRiderPerformanceValidation,
  getRiderEarningsValidation,
  getRiderWalletValidation,
  getRiderWalletTransactionsValidation,
  getRiderJobsValidation,
  getRiderActivityTimelineValidation,
  getRiderLoginHistoryValidation,
  getRiderDocumentsValidation
} = require('../validations/riderValidation');

// All routes require authentication
router.use(authMiddleware);

// Rider statistics (available to all authorized admins)
router.get(
  '/statistics',
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders']),
  RiderController.getRiderStatistics
);

// Export riders
router.get(
  '/export',
  exportRidersValidation,
  checkPermission(['manage_users', 'manage_riders', 'export_reports']),
  RiderController.exportRiders
);

// Get all riders (paginated with filters)
router.get(
  '/',
  getRidersValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders']),
  RiderController.getRiders
);

// ==================== ENTERPRISE RIDER MANAGEMENT ROUTES ====================

// Create rider
router.post(
  '/',
  createRiderValidation,
  checkPermission(['manage_users', 'manage_riders']),
  RiderController.createRider
);

// Get rider by ID (complete profile)
router.get(
  '/:id',
  getRiderByIdValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders']),
  RiderController.getRiderById
);

// Update rider
router.put(
  '/:id',
  updateRiderValidation,
  checkPermission(['manage_users', 'manage_riders']),
  RiderController.updateRider
);

// Verify KYC
router.patch(
  '/:id/verify-kyc',
  verifyKYCValidation,
  checkPermission(['manage_users', 'manage_riders', 'approve_kyc']),
  RiderController.verifyKYC
);

// Assign branch
router.post(
  '/:id/assign-branch',
  assignBranchValidation,
  checkPermission(['manage_users', 'manage_riders', 'manage_branches']),
  RiderController.assignBranch
);

// Transfer branch
router.patch(
  '/:id/transfer-branch',
  transferBranchValidation,
  checkPermission(['manage_users', 'manage_riders', 'manage_branches']),
  RiderController.transferBranch
);

// Assign vehicle
router.post(
  '/:id/assign-vehicle',
  assignVehicleValidation,
  checkPermission(['manage_users', 'manage_riders', 'manage_vehicles']),
  RiderController.assignVehicle
);

// Remove vehicle
router.patch(
  '/:id/remove-vehicle',
  removeVehicleValidation,
  checkPermission(['manage_users', 'manage_riders', 'manage_vehicles']),
  RiderController.removeVehicle
);

// Get rider vehicle
router.get(
  '/:id/vehicle',
  getRiderVehicleValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders']),
  RiderController.getRiderVehicle
);

// Get rider performance
router.get(
  '/:id/performance',
  getRiderPerformanceValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders']),
  RiderController.getRiderPerformance
);

// Get rider earnings
router.get(
  '/:id/earnings',
  getRiderEarningsValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders', 'view_transactions']),
  RiderController.getRiderEarnings
);

// Get rider wallet
router.get(
  '/:id/wallet',
  getRiderWalletValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders', 'view_transactions']),
  RiderController.getRiderWallet
);

// Get rider wallet transactions
router.get(
  '/:id/wallet/transactions',
  getRiderWalletTransactionsValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders', 'view_transactions']),
  RiderController.getRiderWalletTransactions
);

// Get rider jobs
router.get(
  '/:id/jobs',
  getRiderJobsValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders', 'view_bookings']),
  RiderController.getRiderJobs
);

// Get rider activity timeline
router.get(
  '/:id/activity',
  getRiderActivityTimelineValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders']),
  RiderController.getRiderActivityTimeline
);

// Get rider login history
router.get(
  '/:id/login-history',
  getRiderLoginHistoryValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders']),
  RiderController.getRiderLoginHistory
);

// Get rider documents
router.get(
  '/:id/documents',
  getRiderDocumentsValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders']),
  RiderController.getRiderDocuments
);

// ==================== EXISTING ROUTES ====================

// Get rider current booking
router.get(
  '/:id/current-booking',
  getRiderCurrentBookingValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders', 'view_bookings']),
  RiderController.getRiderCurrentBooking
);

// Get rider bookings
router.get(
  '/:id/bookings',
  getRiderBookingsValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders', 'view_bookings']),
  RiderController.getRiderBookings
);

// Get rider payments
router.get(
  '/:id/payments',
  getRiderPaymentsValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders', 'view_transactions']),
  RiderController.getRiderPayments
);

// NOTE: /:id/activity is already registered above (getRiderActivityTimeline).
// The duplicate route below was dead code — removed in Phase 1 refactor.
// RiderController.getRiderActivity is preserved but accessible via the first /:id/activity route.

// Get rider live location
router.get(
  '/:id/live-location',
  getRiderLiveLocationValidation,
  checkPermission(['view_users', 'manage_users', 'view_riders', 'manage_riders']),
  RiderController.getRiderLiveLocation
);

// Block rider
router.patch(
  '/:id/block',
  blockRiderValidation,
  checkPermission(['manage_users', 'manage_riders']),
  RiderController.blockRider
);

// Unblock rider
router.patch(
  '/:id/unblock',
  unblockRiderValidation,
  checkPermission(['manage_users', 'manage_riders']),
  RiderController.unblockRider
);

// Update rider status
router.patch(
  '/:id/status',
  updateRiderStatusValidation,
  checkPermission(['manage_users', 'manage_riders']),
  RiderController.updateRiderStatus
);

// Update rider KYC
router.patch(
  '/:id/kyc',
  updateRiderKYCValidation,
  checkPermission(['manage_users', 'manage_riders', 'approve_kyc']),
  RiderController.updateRiderKYC
);

// Update rider vehicle
router.patch(
  '/:id/vehicle',
  updateRiderVehicleValidation,
  checkPermission(['manage_users', 'manage_riders', 'manage_vehicles']),
  RiderController.updateRiderVehicle
);

// Update rider location
router.patch(
  '/:id/location',
  updateRiderLocationValidation,
  checkPermission(['manage_users', 'manage_riders']),
  RiderController.updateRiderLocation
);

// Update rider availability
router.patch(
  '/:id/availability',
  updateRiderAvailabilityValidation,
  checkPermission(['manage_users', 'manage_riders']),
  RiderController.updateRiderAvailability
);

module.exports = router;

