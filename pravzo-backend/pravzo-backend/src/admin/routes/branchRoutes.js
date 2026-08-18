const express = require('express');
const router = express.Router();
const BranchController = require('../controllers/BranchController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const {
  createBranchValidation,
  updateBranchValidation,
  updateBranchStatusValidation,
  getBranchByIdValidation,
  getBranchesValidation,
  deleteBranchValidation,
  getActivityLogsValidation,
  updateBranchSettingsValidation
} = require('../validations/branchValidation');

// All routes require authentication and SUPER_ADMIN permission
router.use(authMiddleware);
router.use(permissionMiddleware(['SUPER_ADMIN']));

// ==================== BRANCH MANAGEMENT ROUTES ====================

// Create new branch
router.post(
  '/',
  createBranchValidation,
  BranchController.createBranch
);

// Get all branches with filters and pagination
router.get(
  '/',
  getBranchesValidation,
  BranchController.getAllBranches
);

// Get branch statistics
router.get(
  '/:id/statistics',
  getBranchByIdValidation,
  BranchController.getBranchStatistics
);

// Get branch activity logs
router.get(
  '/:id/activity',
  getActivityLogsValidation,
  BranchController.getBranchActivityLogs
);

// Get branch settings
router.get(
  '/:id/settings',
  getBranchByIdValidation,
  BranchController.getBranchSettings
);

// Get branch by ID (must be after specific routes)
router.get(
  '/:id',
  getBranchByIdValidation,
  BranchController.getBranchById
);

// Update branch
router.put(
  '/:id',
  updateBranchValidation,
  BranchController.updateBranch
);

// Update branch settings
router.put(
  '/:id/settings',
  updateBranchSettingsValidation,
  BranchController.updateBranchSettings
);

// Update branch status
router.patch(
  '/:id/status',
  updateBranchStatusValidation,
  BranchController.updateBranchStatus
);

// Delete branch (soft delete)
router.delete(
  '/:id',
  deleteBranchValidation,
  BranchController.deleteBranch
);

module.exports = router;

