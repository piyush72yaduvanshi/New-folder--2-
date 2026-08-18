const { body, param, query } = require('express-validator');

const getVehiclesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Search query too long'),
  query('vehicleType')
    .optional()
    .isIn(['BIKE', 'SCOOTER', 'E_BIKE', 'E_SCOOTER', 'CYCLE']).withMessage('Invalid vehicle type'),
  query('fuelType')
    .optional()
    .isIn(['PETROL', 'DIESEL', 'ELECTRIC', 'CNG', 'HYBRID']).withMessage('Invalid fuel type'),
  query('status')
    .optional()
    .isIn(['AVAILABLE', 'RENTED', 'ASSIGNED', 'MAINTENANCE', 'CHARGING', 'OFFLINE', 'BLOCKED', 'DAMAGED', 'OUT_OF_SERVICE', 'INACTIVE']).withMessage('Invalid status'),
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long'),
  query('assignedRider')
    .optional()
    .isIn(['YES', 'NO', 'ALL']).withMessage('Invalid assigned rider filter'),
  query('availability')
    .optional()
    .isIn(['AVAILABLE', 'BUSY', 'OFFLINE']).withMessage('Invalid availability'),
  query('minBattery')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Battery must be between 0 and 100'),
  query('maxBattery')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Battery must be between 0 and 100'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  query('sortBy')
    .optional()
    .isIn(['created_at', 'registration_number', 'vehicle_type', 'status', 'model_name', 'updated_at']).withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('Invalid sort order')
];

const getVehicleByIdValidation = [
  param('id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isInt({ min: 1 }).withMessage('Invalid vehicle ID')
];

const createVehicleValidation = [
  body('vehicleType')
    .notEmpty().withMessage('Vehicle type is required')
    .isIn(['BIKE', 'SCOOTER', 'E_BIKE', 'E_SCOOTER', 'CYCLE']).withMessage('Invalid vehicle type'),
  body('modelName')
    .notEmpty().withMessage('Model name is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Model name must be between 2 and 100 characters'),
  body('registrationNumber')
    .notEmpty().withMessage('Registration number is required')
    .trim()
    .isLength({ min: 5, max: 50 }).withMessage('Registration number must be between 5 and 50 characters'),
  body('color')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Color must not exceed 50 characters'),
  body('yearOfManufacture')
    .optional()
    .isInt({ min: 1900, max: 2100 }).withMessage('Invalid year of manufacture'),
  body('fuelType')
    .optional()
    .isIn(['PETROL', 'DIESEL', 'ELECTRIC', 'CNG', 'HYBRID']).withMessage('Invalid fuel type'),
  body('chassisNumber')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Chassis number too long'),
  body('engineNumber')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Engine number too long'),
  body('rcNumber')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('RC number too long'),
  body('rcImageUrl')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('RC image URL too long'),
  body('insuranceNumber')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Insurance number too long'),
  body('insuranceExpiryDate')
    .optional()
    .isISO8601().withMessage('Invalid insurance expiry date format'),
  body('insuranceImageUrl')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Insurance image URL too long'),
  body('fitnessCertificateNumber')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Fitness certificate number too long'),
  body('fitnessCertificateExpiryDate')
    .optional()
    .isISO8601().withMessage('Invalid fitness certificate expiry date'),
  body('fitnessCertificateImageUrl')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Fitness certificate image URL too long'),
  body('pucNumber')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('PUC number too long'),
  body('pucExpiryDate')
    .optional()
    .isISO8601().withMessage('Invalid PUC expiry date'),
  body('pucImageUrl')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('PUC image URL too long'),
  body('ownerName')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Owner name too long'),
  body('ownerPhone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Owner phone too long'),
  body('assignedCity')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long')
];

const updateVehicleValidation = [
  param('id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
  body('modelName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Model name must be between 2 and 100 characters'),
  body('color')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Color must not exceed 50 characters'),
  body('yearOfManufacture')
    .optional()
    .isInt({ min: 1900, max: 2100 }).withMessage('Invalid year of manufacture'),
  body('fuelType')
    .optional()
    .isIn(['PETROL', 'DIESEL', 'ELECTRIC', 'CNG', 'HYBRID']).withMessage('Invalid fuel type'),
  body('insuranceNumber')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Insurance number too long'),
  body('insuranceExpiryDate')
    .optional()
    .isISO8601().withMessage('Invalid insurance expiry date format'),
  body('insuranceImageUrl')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Insurance image URL too long'),
  body('fitnessCertificateNumber')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Fitness certificate number too long'),
  body('fitnessCertificateExpiryDate')
    .optional()
    .isISO8601().withMessage('Invalid fitness certificate expiry date'),
  body('fitnessCertificateImageUrl')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Fitness certificate image URL too long'),
  body('pucNumber')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('PUC number too long'),
  body('pucExpiryDate')
    .optional()
    .isISO8601().withMessage('Invalid PUC expiry date'),
  body('pucImageUrl')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('PUC image URL too long'),
  body('ownerName')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Owner name too long'),
  body('ownerPhone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Owner phone too long'),
  body('assignedCity')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long')
];

const deleteVehicleValidation = [
  param('id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isInt({ min: 1 }).withMessage('Invalid vehicle ID')
];

const updateVehicleStatusValidation = [
  param('id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['AVAILABLE', 'RENTED', 'ASSIGNED', 'MAINTENANCE', 'CHARGING', 'OFFLINE', 'BLOCKED', 'DAMAGED', 'OUT_OF_SERVICE', 'INACTIVE']).withMessage('Invalid status value')
];

const updateMaintenanceValidation = [
  param('id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
  body('maintenanceType')
    .notEmpty().withMessage('Maintenance type is required')
    .isIn(['STARTED', 'COMPLETED']).withMessage('Maintenance type must be STARTED or COMPLETED'),
  body('estimatedCost')
    .optional()
    .isFloat({ min: 0 }).withMessage('Estimated cost must be a positive number'),
  body('actualCost')
    .optional()
    .isFloat({ min: 0 }).withMessage('Actual cost must be a positive number'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Remarks must not exceed 500 characters'),
  body('nextServiceDate')
    .optional()
    .isISO8601().withMessage('Invalid next service date format')
];

const blockVehicleValidation = [
  param('id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
  body('reason')
    .notEmpty().withMessage('Block reason is required')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Block reason must be between 10 and 500 characters')
];

const unblockVehicleValidation = [
  param('id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isInt({ min: 1 }).withMessage('Invalid vehicle ID')
];

const assignRiderValidation = [
  param('id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
  body('riderId')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
];

const removeRiderValidation = [
  param('id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
];

const getVehicleHistoryValidation = [
  param('id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isInt({ min: 1 }).withMessage('Invalid vehicle ID')
];

const exportVehiclesValidation = [
  query('format')
    .optional()
    .isIn(['CSV', 'EXCEL']).withMessage('Invalid export format')
];

module.exports = {
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
  // Enterprise
  assignBranchValidation: [
    param('id').notEmpty().isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
    body('branchId').notEmpty().isInt({ min: 1 }).withMessage('Branch ID required'),
    body('notes').optional().trim().isLength({ max: 500 })
  ],
  transferBranchValidation: [
    param('id').notEmpty().isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
    body('toBranchId').notEmpty().isInt({ min: 1 }).withMessage('Target branch ID required'),
    body('transferReason').notEmpty().trim().isLength({ min: 5, max: 500 }).withMessage('Transfer reason required (5-500 chars)')
  ],
  startMaintenanceValidation: [
    param('id').notEmpty().isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
    body('maintenanceType').optional().isIn(['ROUTINE_SERVICE','REPAIR','EMERGENCY','BATTERY_SERVICE','TYRE_SERVICE','BRAKE_SERVICE','SCHEDULED']),
    body('estimatedCost').optional().isFloat({ min: 0 }),
    body('serviceCenter').optional().trim().isLength({ max: 255 }),
    body('priority').optional().isIn(['LOW','MEDIUM','HIGH','CRITICAL']),
    body('remarks').optional().trim().isLength({ max: 1000 })
  ],
  completeMaintenanceValidation: [
    param('id').notEmpty().isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
    body('maintenanceId').notEmpty().isInt({ min: 1 }).withMessage('Maintenance ID required'),
    body('actualCost').optional().isFloat({ min: 0 }),
    body('nextServiceDate').optional().isISO8601(),
    body('remarks').optional().trim().isLength({ max: 1000 })
  ],
  addDocumentValidation: [
    param('id').notEmpty().isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
    body('documentType').notEmpty().isIn(['REGISTRATION_CERTIFICATE','INSURANCE','PUC','FITNESS_CERTIFICATE','PERMIT','ROAD_TAX','INVOICE','BATTERY_WARRANTY','IMAGE','VIDEO','OTHER']).withMessage('Invalid document type'),
    body('documentTitle').notEmpty().trim().isLength({ min: 2, max: 255 }).withMessage('Document title required'),
    body('documentUrl').notEmpty().trim().isLength({ max: 1000 }).withMessage('Document URL required'),
    body('expiryDate').optional().isISO8601(),
    body('issueDate').optional().isISO8601()
  ],
  vehicleIdParamValidation: [
    param('id').notEmpty().isInt({ min: 1 }).withMessage('Invalid vehicle ID')
  ],
  deleteDocumentValidation: [
    param('id').notEmpty().isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
    param('documentId').notEmpty().isInt({ min: 1 }).withMessage('Invalid document ID')
  ]
};

