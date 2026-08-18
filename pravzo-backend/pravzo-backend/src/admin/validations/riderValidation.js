const { body, param, query } = require('express-validator');

const getRidersValidation = [
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
  query('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'OFFLINE', 'ONLINE', 'SUSPENDED', 'UNDER_REVIEW']).withMessage('Invalid status'),
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long'),
  query('vehicleType')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Vehicle type too long'),
  query('onlineStatus')
    .optional()
    .isIn(['ONLINE', 'OFFLINE']).withMessage('Invalid online status'),
  query('availability')
    .optional()
    .isIn(['AVAILABLE', 'BUSY', 'OFFLINE']).withMessage('Invalid availability'),
  query('kycStatus')
    .optional()
    .isIn(['PENDING', 'APPROVED', 'REJECTED', 'REVERIFY_REQUIRED']).withMessage('Invalid KYC status'),
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  query('maxRating')
    .optional()
    .isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  query('sortBy')
    .optional()
    .isIn(['created_at', 'full_name', 'email', 'status', 'rating', 'assigned_city', 'kyc_status', 'online_status', 'total_earnings', 'completed_trips', 'updated_at']).withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('Invalid sort order')
];

const getRiderByIdValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID')
];

const blockRiderValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  body('reason')
    .notEmpty().withMessage('Block reason is required')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Block reason must be between 10 and 500 characters')
];

const unblockRiderValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID')
];

const updateRiderStatusValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['ACTIVE', 'INACTIVE', 'OFFLINE', 'ONLINE', 'SUSPENDED', 'UNDER_REVIEW']).withMessage('Invalid status value')
];

const updateRiderKYCValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  body('kycStatus')
    .notEmpty().withMessage('KYC status is required')
    .isIn(['APPROVED', 'REJECTED', 'REVERIFY_REQUIRED']).withMessage('Invalid KYC status value'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Remarks must not exceed 500 characters')
];

const updateRiderVehicleValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  body('vehicleId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
  body('action')
    .notEmpty().withMessage('Action is required')
    .isIn(['ASSIGN', 'REMOVE', 'REPLACE', 'UPDATE']).withMessage('Invalid action')
];

const updateRiderLocationValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('speed')
    .optional()
    .isFloat({ min: 0 }).withMessage('Speed must be positive'),
  body('heading')
    .optional()
    .isFloat({ min: 0, max: 360 }).withMessage('Heading must be between 0 and 360'),
  body('battery')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Battery must be between 0 and 100')
];

const updateRiderAvailabilityValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  body('availability')
    .notEmpty().withMessage('Availability is required')
    .isIn(['AVAILABLE', 'BUSY', 'OFFLINE']).withMessage('Invalid availability value')
];

const getRiderCurrentBookingValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID')
];

const getRiderBookingsValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']).withMessage('Invalid booking status'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
];

const getRiderPaymentsValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['EARNING', 'WALLET', 'SETTLEMENT', 'BONUS', 'INCENTIVE', 'PENALTY', 'REFUND']).withMessage('Invalid payment type')
];

const getRiderActivityValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

const getRiderLiveLocationValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID')
];

const exportRidersValidation = [
  query('format')
    .notEmpty().withMessage('Export format is required')
    .isIn(['csv', 'excel', 'CSV', 'EXCEL']).withMessage('Format must be csv or excel'),
  query('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'OFFLINE', 'ONLINE', 'SUSPENDED', 'UNDER_REVIEW']).withMessage('Invalid status'),
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long'),
  query('kycStatus')
    .optional()
    .isIn(['PENDING', 'APPROVED', 'REJECTED', 'REVERIFY_REQUIRED']).withMessage('Invalid KYC status'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
];

module.exports = {
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
  getRiderActivityValidation,
  getRiderLiveLocationValidation,
  exportRidersValidation
};


// ==================== ENTERPRISE RIDER MANAGEMENT VALIDATIONS ====================

const createRiderValidation = [
  body('fullName')
    .notEmpty().withMessage('Full name is required')
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Full name must be between 2 and 200 characters'),
  body('phoneNumber')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number format'),
  body('email')
    .optional()
    .isEmail().withMessage('Invalid email format'),
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Invalid date of birth format'),
  body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Invalid gender value'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address too long'),
  body('assignedCity')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long'),
  body('assignedZone')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Zone name too long'),
  body('branchId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid branch ID'),
  body('drivingLicenseNumber')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Driving license number too long'),
  body('aadharNumber')
    .optional()
    .matches(/^\d{12}$/).withMessage('Aadhaar number must be 12 digits'),
  body('bankAccountNumber')
    .optional()
    .trim()
    .isLength({ min: 8, max: 20 }).withMessage('Invalid bank account number'),
  body('ifscCode')
    .optional()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC code format'),
  body('emergencyContactName')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Emergency contact name too long'),
  body('emergencyContactNumber')
    .optional()
    .matches(/^\d{10}$/).withMessage('Invalid emergency contact number')
];

const updateRiderValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Full name must be between 2 and 200 characters'),
  body('phoneNumber')
    .optional()
    .matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number format'),
  body('email')
    .optional()
    .isEmail().withMessage('Invalid email format'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address too long'),
  body('assignedCity')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long'),
  body('emergencyContactName')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Emergency contact name too long'),
  body('emergencyContactNumber')
    .optional()
    .matches(/^\d{10}$/).withMessage('Invalid emergency contact number')
];


const verifyKYCValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  body('kycId')
    .notEmpty().withMessage('KYC ID is required')
    .isInt({ min: 1 }).withMessage('Invalid KYC ID'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['APPROVED', 'REJECTED', 'UNDER_REVIEW']).withMessage('Invalid status value'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Remarks must not exceed 500 characters'),
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Rejection reason must not exceed 500 characters')
];

const assignBranchValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  body('branchId')
    .notEmpty().withMessage('Branch ID is required')
    .isInt({ min: 1 }).withMessage('Invalid branch ID'),
  body('assignmentType')
    .optional()
    .isIn(['PRIMARY', 'TEMPORARY']).withMessage('Invalid assignment type')
];

const transferBranchValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  body('toBranchId')
    .notEmpty().withMessage('Destination branch ID is required')
    .isInt({ min: 1 }).withMessage('Invalid branch ID'),
  body('transferReason')
    .notEmpty().withMessage('Transfer reason is required')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Transfer reason must be between 10 and 500 characters')
];

const assignVehicleValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  body('vehicleId')
    .notEmpty().withMessage('Vehicle ID is required')
    .isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
  body('assignmentReason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Assignment reason too long'),
  body('odometerStart')
    .optional()
    .isFloat({ min: 0 }).withMessage('Odometer start must be a positive number')
];

const removeVehicleValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  body('removalReason')
    .notEmpty().withMessage('Removal reason is required')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Removal reason must be between 10 and 500 characters'),
  body('odometerEnd')
    .optional()
    .isFloat({ min: 0 }).withMessage('Odometer end must be a positive number')
];

const getRiderVehicleValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID')
];


const getRiderPerformanceValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  query('periodType')
    .optional()
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).withMessage('Invalid period type')
];

const getRiderEarningsValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID')
];

const getRiderWalletValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID')
];

const getRiderWalletTransactionsValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const getRiderJobsValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  query('status')
    .optional()
    .isIn(['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const getRiderActivityTimelineValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  query('activityType')
    .optional()
    .isIn([
      'REGISTRATION', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PROFILE_UPDATE',
      'KYC_SUBMISSION', 'KYC_APPROVAL', 'KYC_REJECTION', 'BRANCH_ASSIGNMENT',
      'BRANCH_TRANSFER', 'VEHICLE_ASSIGNMENT', 'VEHICLE_REMOVAL', 'JOB_ACCEPTED',
      'JOB_COMPLETED', 'JOB_CANCELLED', 'BOOKING_STARTED', 'BOOKING_COMPLETED',
      'STATUS_CHANGE', 'ONLINE_STATUS_CHANGE'
    ]).withMessage('Invalid activity type'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const getRiderLoginHistoryValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

const getRiderDocumentsValidation = [
  param('id')
    .notEmpty().withMessage('Rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID')
];

module.exports = {
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
  getRiderActivityValidation,
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
};

