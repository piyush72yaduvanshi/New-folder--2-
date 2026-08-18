const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const {
  getUsersValidation,
  getUserByIdValidation,
  blockUserValidation,
  unblockUserValidation,
  verifyUserValidation,
  updateUserStatusValidation,
  deleteUserValidation,
  exportUsersValidation,
  getUserLoginHistoryValidation,
  getUserBookingsValidation,
  getUserPaymentsValidation,
  getUserActivityValidation,
  // Enterprise validations
  updateUserValidation,
  verifyKYCValidation,
  resetPasswordValidation,
  transferBranchValidation,
  getWalletValidation,
  getWalletTransactionsValidation,
  creditWalletValidation,
  debitWalletValidation,
  getUserRentalsValidation,
  getUserJobsValidation,
  getActivityTimelineValidation,
  getLoginHistoryDetailedValidation,
  getDevicesValidation,
  getDocumentsValidation
} = require('../validations/userValidation');

// All routes require authentication
router.use(authMiddleware);

// User statistics (available to all authorized admins)
router.get(
  '/statistics',
  checkPermission(['view_users', 'manage_users']),
  UserController.getUserStatistics
);

// Export users
router.get(
  '/export',
  exportUsersValidation,
  checkPermission(['manage_users', 'export_reports']),
  UserController.exportUsers
);

// Get all users (paginated with filters)
router.get(
  '/',
  getUsersValidation,
  checkPermission(['view_users', 'manage_users']),
  UserController.getUsers
);

// Get user by ID (complete profile)
router.get(
  '/:id',
  getUserByIdValidation,
  checkPermission(['view_users', 'manage_users']),
  UserController.getUserById
);

// Get user login history
router.get(
  '/:id/login-history',
  getUserLoginHistoryValidation,
  checkPermission(['view_users', 'manage_users']),
  UserController.getUserLoginHistory
);

// Get user bookings
router.get(
  '/:id/bookings',
  getUserBookingsValidation,
  checkPermission(['view_users', 'manage_users', 'view_bookings']),
  UserController.getUserBookings
);

// Get user payments
router.get(
  '/:id/payments',
  getUserPaymentsValidation,
  checkPermission(['view_users', 'manage_users', 'view_transactions']),
  UserController.getUserPayments
);

// Get user activity
router.get(
  '/:id/activity',
  getUserActivityValidation,
  checkPermission(['view_users', 'manage_users']),
  UserController.getUserActivity
);

router.patch(
  '/:id/status',
  updateUserStatusValidation,
  checkPermission(['manage_users']),
  UserController.updateUserStatus
);

// Block user
router.patch(
  '/:id/block',
  blockUserValidation,
  checkPermission(['manage_users']),
  UserController.blockUser
);

// Unblock user
router.patch(
  '/:id/unblock',
  unblockUserValidation,
  checkPermission(['manage_users']),
  UserController.unblockUser
);

// Verify user
router.patch(
  '/:id/verify',
  verifyUserValidation,
  checkPermission(['manage_users', 'approve_kyc']),
  UserController.verifyUser
);

// NOTE: PATCH /:id/status is registered above (Phase 2 addition).
// The duplicate below was removed to prevent dead code.

// Delete user (soft delete)
router.delete(
  '/:id',
  deleteUserValidation,
  checkPermission(['manage_users']),
  UserController.deleteUser
);

// ==================== ENTERPRISE USER MANAGEMENT ROUTES ====================

// Update user details
router.put(
  '/:id',
  updateUserValidation,
  checkPermission(['manage_users']),
  UserController.updateUser
);

// Verify KYC
router.patch(
  '/:id/verify-kyc',
  verifyKYCValidation,
  checkPermission(['manage_users', 'approve_kyc']),
  UserController.verifyKYC
);

// Reset password
router.patch(
  '/:id/reset-password',
  resetPasswordValidation,
  checkPermission(['manage_users']),
  UserController.resetPassword
);

// Transfer branch
router.patch(
  '/:id/transfer-branch',
  transferBranchValidation,
  checkPermission(['manage_users', 'SUPER_ADMIN']),
  UserController.transferBranch
);

// Get wallet
router.get(
  '/:id/wallet',
  getWalletValidation,
  checkPermission(['view_users', 'manage_users', 'view_transactions']),
  UserController.getWallet
);

// Get wallet transactions
router.get(
  '/:id/wallet/transactions',
  getWalletTransactionsValidation,
  checkPermission(['view_users', 'manage_users', 'view_transactions']),
  UserController.getWalletTransactions
);

// Credit wallet
router.post(
  '/:id/wallet/credit',
  creditWalletValidation,
  checkPermission(['manage_users', 'manage_transactions']),
  UserController.creditWallet
);

// Debit wallet
router.post(
  '/:id/wallet/debit',
  debitWalletValidation,
  checkPermission(['manage_users', 'manage_transactions']),
  UserController.debitWallet
);

// Get rentals
router.get(
  '/:id/rentals',
  getUserRentalsValidation,
  checkPermission(['view_users', 'manage_users', 'view_bookings']),
  UserController.getUserRentals
);

// Get jobs
router.get(
  '/:id/jobs',
  getUserJobsValidation,
  checkPermission(['view_users', 'manage_users']),
  UserController.getUserJobs
);

// Get activity timeline (replacing the old activity endpoint for enterprise features)
router.get(
  '/:id/activity-timeline',
  getActivityTimelineValidation,
  checkPermission(['view_users', 'manage_users']),
  UserController.getActivityTimeline
);

// Get login history detailed (enterprise version)
router.get(
  '/:id/login-history-detailed',
  getLoginHistoryDetailedValidation,
  checkPermission(['view_users', 'manage_users']),
  UserController.getLoginHistoryDetailed
);

// Get devices
router.get(
  '/:id/devices',
  getDevicesValidation,
  checkPermission(['view_users', 'manage_users']),
  UserController.getDevices
);

// Get documents
router.get(
  '/:id/documents',
  getDocumentsValidation,
  checkPermission(['view_users', 'manage_users']),
  UserController.getDocuments
);

// Get KYC details
router.get(
  '/:id/kyc',
  getUserByIdValidation,
  checkPermission(['view_users', 'manage_users', 'approve_kyc']),
  UserController.getKYCDetails
);

// Get branch assignment history
router.get(
  '/:id/branch-history',
  getUserByIdValidation,
  checkPermission(['view_users', 'manage_users']),
  UserController.getBranchAssignmentHistory
);

module.exports = router;

