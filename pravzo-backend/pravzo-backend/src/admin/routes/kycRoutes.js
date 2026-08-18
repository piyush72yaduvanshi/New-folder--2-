const express = require('express');
const router = express.Router();
const KYCController = require('../controllers/KYCController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const {
  getKYCListValidation,
  getKYCByIdValidation,
  approveKYCValidation,
  rejectKYCValidation,
  reverifyKYCValidation,
  updateKYCStatusValidation,
  getKYCTimelineValidation,
  downloadKYCValidation,
  exportKYCValidation
} = require('../validations/kycValidation');

// All routes require authentication
router.use(authMiddleware);

// KYC statistics (available to all authorized admins)
router.get(
  '/statistics',
  checkPermission(['view_users', 'manage_users', 'approve_kyc']),
  KYCController.getKYCStatistics
);

// Export KYC
router.get(
  '/export',
  exportKYCValidation,
  checkPermission(['manage_users', 'approve_kyc', 'export_reports']),
  KYCController.exportKYC
);

// Get pending KYC requests
router.get(
  '/pending',
  checkPermission(['view_users', 'manage_users', 'approve_kyc']),
  KYCController.getPendingKYC
);

// Get verified KYC
router.get(
  '/verified',
  checkPermission(['view_users', 'manage_users', 'approve_kyc']),
  KYCController.getVerifiedKYC
);

// Get rejected KYC
router.get(
  '/rejected',
  checkPermission(['view_users', 'manage_users', 'approve_kyc']),
  KYCController.getRejectedKYC
);

// Get all KYC (paginated with filters)
router.get(
  '/',
  getKYCListValidation,
  checkPermission(['view_users', 'manage_users', 'approve_kyc']),
  KYCController.getKYCList
);

// Get KYC by ID (complete details)
router.get(
  '/:id',
  getKYCByIdValidation,
  checkPermission(['view_users', 'manage_users', 'approve_kyc']),
  KYCController.getKYCById
);

// Get KYC timeline for user
router.get(
  '/timeline/:id',
  getKYCTimelineValidation,
  checkPermission(['view_users', 'manage_users', 'approve_kyc']),
  KYCController.getKYCTimeline
);

// Download KYC document
router.get(
  '/download/:id',
  downloadKYCValidation,
  checkPermission(['view_users', 'manage_users', 'approve_kyc']),
  KYCController.downloadKYC
);

// Approve KYC
router.patch(
  '/approve',
  approveKYCValidation,
  checkPermission(['manage_users', 'approve_kyc']),
  KYCController.approveKYC
);

// Reject KYC
router.patch(
  '/reject',
  rejectKYCValidation,
  checkPermission(['manage_users', 'approve_kyc']),
  KYCController.rejectKYC
);

// Reverify KYC (move back to pending)
router.patch(
  '/reverify',
  reverifyKYCValidation,
  checkPermission(['manage_users', 'approve_kyc']),
  KYCController.reverifyKYC
);

// Update KYC status
router.patch(
  '/update-status',
  updateKYCStatusValidation,
  checkPermission(['manage_users', 'approve_kyc']),
  KYCController.updateKYCStatus
);

module.exports = router;

