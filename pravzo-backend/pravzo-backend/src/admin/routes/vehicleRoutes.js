const express = require('express');
const router = express.Router();
const VehicleController = require('../controllers/VehicleController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const {
  getVehiclesValidation,
  getVehicleByIdValidation,
  createVehicleValidation,
  updateVehicleValidation,
  deleteVehicleValidation,
  updateVehicleStatusValidation,
  updateMaintenanceValidation,
  blockVehicleValidation,
  unblockVehicleValidation,
  assignRiderValidation,
  removeRiderValidation,
  getVehicleHistoryValidation,
  exportVehiclesValidation,
  assignBranchValidation,
  transferBranchValidation,
  startMaintenanceValidation,
  completeMaintenanceValidation,
  addDocumentValidation,
  vehicleIdParamValidation,
  deleteDocumentValidation
} = require('../validations/vehicleValidation');

// All routes require authentication
router.use(authMiddleware);

// GET: Vehicle Statistics
router.get(
  '/statistics',
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.getVehicleStatistics
);

// GET: Export Vehicles
router.get(
  '/export',
  exportVehiclesValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.exportVehicles
);

// GET: List all vehicles (with filters & pagination)
router.get(
  '/',
  getVehiclesValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.getVehicles
);

// GET: Get vehicle by ID
router.get(
  '/:id',
  getVehicleByIdValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.getVehicleById
);

// GET: Get vehicle history
router.get(
  '/:id/history',
  getVehicleHistoryValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.getVehicleHistory
);

// POST: Create new vehicle
router.post(
  '/',
  createVehicleValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.createVehicle
);

// PATCH: Update vehicle
router.patch(
  '/:id',
  updateVehicleValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.updateVehicle
);

// DELETE: Delete vehicle
router.delete(
  '/:id',
  deleteVehicleValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.deleteVehicle
);

// PATCH: Update vehicle status
router.patch(
  '/:id/status',
  updateVehicleStatusValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.updateVehicleStatus
);

// PATCH: Update maintenance
router.patch(
  '/:id/maintenance',
  updateMaintenanceValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.updateMaintenance
);

// PATCH: Block vehicle
router.patch(
  '/:id/block',
  blockVehicleValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.blockVehicle
);

// PATCH: Unblock vehicle
router.patch(
  '/:id/unblock',
  unblockVehicleValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.unblockVehicle
);

// PATCH: Assign rider to vehicle
router.patch(
  '/:id/assign-rider',
  assignRiderValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.assignRider
);

// PATCH: Remove rider from vehicle
router.patch(
  '/:id/remove-rider',
  removeRiderValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.removeRider
);

// ==================== ENTERPRISE ROUTES ====================

// POST: Assign vehicle to branch
router.post(
  '/:id/assign-branch',
  assignBranchValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.assignBranch
);

// PATCH: Transfer vehicle to another branch
router.patch(
  '/:id/transfer-branch',
  transferBranchValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.transferBranch
);

// GET: Branch assignment history
router.get(
  '/:id/branch-history',
  vehicleIdParamValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.getVehicleBranchHistory
);

// POST: Start maintenance
router.post(
  '/:id/start-maintenance',
  startMaintenanceValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.startMaintenance
);

// PATCH: Complete maintenance
router.patch(
  '/:id/complete-maintenance',
  completeMaintenanceValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.completeMaintenance
);

// GET: Maintenance history (enterprise)
router.get(
  '/:id/maintenance-history',
  vehicleIdParamValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.getMaintenanceHistory
);

// GET: Service history
router.get(
  '/:id/service-history',
  vehicleIdParamValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.getServiceHistory
);

// GET: Inspection history
router.get(
  '/:id/inspection-history',
  vehicleIdParamValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.getInspectionHistory
);

// GET: Location history
router.get(
  '/:id/location-history',
  vehicleIdParamValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.getLocationHistory
);

// GET: Vehicle documents
router.get(
  '/:id/documents',
  vehicleIdParamValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.getDocuments
);

// POST: Upload vehicle document
router.post(
  '/:id/documents',
  addDocumentValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.addDocument
);

// DELETE: Delete vehicle document
router.delete(
  '/:id/documents/:documentId',
  deleteDocumentValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.deleteDocument
);

// GET: Activity log
router.get(
  '/:id/activity',
  vehicleIdParamValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.getActivity
);

// GET: Expenses
router.get(
  '/:id/expenses',
  vehicleIdParamValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  VehicleController.getExpenses
);

module.exports = router;

