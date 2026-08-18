const express = require('express');
const router = express.Router();
const FleetController = require('../controllers/FleetController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const {
  getFleetDashboardValidation,
  getFleetLiveLocationValidation,
  getFleetAvailabilityValidation,
  bulkAssignRidersValidation,
  bulkRemoveRidersValidation,
  getFleetStatisticsValidation
} = require('../validations/fleetValidation');

// All routes require authentication
router.use(authMiddleware);

// GET: Fleet dashboard
router.get(
  '/dashboard',
  getFleetDashboardValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  FleetController.getFleetDashboard
);

// GET: Fleet live locations
router.get(
  '/live-locations',
  getFleetLiveLocationValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  FleetController.getFleetLiveLocations
);

// GET: Fleet availability
router.get(
  '/availability',
  getFleetAvailabilityValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  FleetController.getFleetAvailability
);

// GET: Fleet statistics
router.get(
  '/statistics',
  getFleetStatisticsValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  FleetController.getFleetStatistics
);

// PATCH: Bulk assign riders to vehicles
router.patch(
  '/assign',
  bulkAssignRidersValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  FleetController.bulkAssignRiders
);

// PATCH: Bulk remove riders from vehicles
router.patch(
  '/remove',
  bulkRemoveRidersValidation,
  checkPermission(['SUPER_ADMIN', 'ADMIN']),
  FleetController.bulkRemoveRiders
);

module.exports = router;

