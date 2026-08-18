const express = require('express');
const router = express.Router();
const AdminManagementController = require('../controllers/AdminManagementController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const {
  createAdminValidation,
  updateAdminValidation,
  getAdminByIdValidation,
  getAdminsValidation,
  blockAdminValidation,
  unblockAdminValidation,
  resetPasswordValidation,
  deleteAdminValidation,
  getActivityLogsValidation,
  assignBranchValidation,
  transferBranchValidation,
  removeBranchValidation,
  getAssignmentHistoryValidation,
  getLoginHistoryValidation,
  updatePermissionsValidation,
  getPermissionsValidation,
  getActiveSessionsValidation,
  revokeSessionValidation,
  updateAdminStatusValidation
} = require('../validations/adminManagementValidation');

// All routes require authentication
router.use(authMiddleware);

// ==================== ADMIN MANAGEMENT ROUTES ====================

// Get admin statistics
router.get(
  '/statistics',
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.getAdminStatistics
);

// Get all admins with filters and pagination
router.get(
  '/list',
  getAdminsValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.getAllAdmins
);

// Create new admin
router.post(
  '/create',
  createAdminValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.createAdmin
);

// Get admin by ID
router.get(
  '/:id',
  getAdminByIdValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.getAdminById
);

// Update admin
router.put(
  '/:id',
  updateAdminValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.updateAdmin
);

// Update admin status
router.patch(
  '/:id/status',
  updateAdminStatusValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.updateAdminStatus
);

// Block admin (deprecated - use status update instead)
router.post(
  '/:id/block',
  blockAdminValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.blockAdmin
);

// Unblock admin (deprecated - use status update instead)
router.post(
  '/:id/unblock',
  unblockAdminValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.unblockAdmin
);

// Reset admin password
router.patch(
  '/:id/reset-password',
  resetPasswordValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.resetAdminPassword
);

// Delete admin
router.delete(
  '/:id',
  deleteAdminValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.deleteAdmin
);

// ==================== BRANCH ASSIGNMENT ROUTES ====================

// Assign admin to branch
router.post(
  '/:id/assign-branch',
  assignBranchValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.assignBranch
);

// Transfer admin to another branch
router.patch(
  '/:id/transfer-branch',
  transferBranchValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.transferBranch
);

// Remove admin from branch
router.patch(
  '/:id/remove-branch',
  removeBranchValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.removeBranch
);

// Get admin assignment history
router.get(
  '/:id/assignment-history',
  getAssignmentHistoryValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.getAssignmentHistory
);

// ==================== ACTIVITY & HISTORY ROUTES ====================

// Get admin activity logs
router.get(
  '/:id/activity',
  getActivityLogsValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.getAdminActivityLogs
);

// Get admin login history
router.get(
  '/:id/login-history',
  getLoginHistoryValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.getLoginHistory
);

// ==================== PERMISSIONS ROUTES ====================

// Get admin permissions
router.get(
  '/:id/permissions',
  getPermissionsValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.getPermissions
);

// Update admin permissions
router.patch(
  '/:id/permissions',
  updatePermissionsValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.updatePermissions
);

// ==================== SESSION ROUTES ====================

// Get admin active sessions
router.get(
  '/:id/sessions',
  getActiveSessionsValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.getActiveSessions
);

// Revoke specific session
router.delete(
  '/:id/sessions/:session_id',
  revokeSessionValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  AdminManagementController.revokeSession
);

module.exports = router;

