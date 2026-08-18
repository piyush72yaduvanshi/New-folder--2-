const { body, param, query } = require('express-validator');

const getFleetDashboardValidation = [
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long')
];

const getFleetLiveLocationValidation = [
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long'),
  query('vehicleType')
    .optional()
    .isIn(['BIKE', 'SCOOTER', 'E_BIKE', 'E_SCOOTER', 'CYCLE']).withMessage('Invalid vehicle type'),
  query('status')
    .optional()
    .isIn(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'CHARGING', 'OFFLINE', 'BLOCKED']).withMessage('Invalid status')
];

const getFleetAvailabilityValidation = [
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long'),
  query('vehicleType')
    .optional()
    .isIn(['BIKE', 'SCOOTER', 'E_BIKE', 'E_SCOOTER', 'CYCLE']).withMessage('Invalid vehicle type')
];

const bulkAssignRidersValidation = [
  body('assignments')
    .notEmpty().withMessage('Assignments array is required')
    .isArray({ min: 1, max: 50 }).withMessage('Assignments must be an array with 1-50 items'),
  body('assignments.*.vehicleId')
    .notEmpty().withMessage('Vehicle ID is required')
    .isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
  body('assignments.*.riderId')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID')
];

const bulkRemoveRidersValidation = [
  body('vehicleIds')
    .notEmpty().withMessage('Vehicle IDs array is required')
    .isArray({ min: 1, max: 50 }).withMessage('Vehicle IDs must be an array with 1-50 items'),
  body('vehicleIds.*')
    .isInt({ min: 1 }).withMessage('Each vehicle ID must be a positive integer'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
];

const getFleetStatisticsValidation = [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'year', 'custom']).withMessage('Invalid period'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long')
];

module.exports = {
  getFleetDashboardValidation,
  getFleetLiveLocationValidation,
  getFleetAvailabilityValidation,
  bulkAssignRidersValidation,
  bulkRemoveRidersValidation,
  getFleetStatisticsValidation
};

