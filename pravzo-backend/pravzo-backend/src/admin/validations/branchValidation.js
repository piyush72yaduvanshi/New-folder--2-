const { body, param, query } = require('express-validator');

// Validation for creating branch
const createBranchValidation = [
  body('branch_name')
    .trim()
    .notEmpty().withMessage('Branch name is required')
    .isLength({ min: 3, max: 255 }).withMessage('Branch name must be between 3 and 255 characters'),
  
  body('branch_code')
    .trim()
    .notEmpty().withMessage('Branch code is required')
    .isLength({ min: 2, max: 50 }).withMessage('Branch code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9_-]+$/).withMessage('Branch code must contain only uppercase letters, numbers, hyphens, and underscores'),
  
  body('branch_type')
    .optional()
    .isIn(['MAIN', 'SUB', 'FRANCHISE', 'WAREHOUSE'])
    .withMessage('Invalid branch type. Must be MAIN, SUB, FRANCHISE, or WAREHOUSE'),
  
  body('branch_status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'SUSPENDED'])
    .withMessage('Invalid branch status'),
  
  body('address_line1')
    .trim()
    .notEmpty().withMessage('Address line 1 is required')
    .isLength({ max: 255 }).withMessage('Address line 1 must not exceed 255 characters'),
  
  body('address_line2')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Address line 2 must not exceed 255 characters'),
  
  body('city')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ max: 100 }).withMessage('City must not exceed 100 characters'),
  
  body('state')
    .trim()
    .notEmpty().withMessage('State is required')
    .isLength({ max: 100 }).withMessage('State must not exceed 100 characters'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Country must not exceed 100 characters'),
  
  body('pin_code')
    .trim()
    .notEmpty().withMessage('Pin code is required')
    .matches(/^[0-9]{6}$/).withMessage('Pin code must be a 6-digit number'),
  
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phone_number')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format (E.164 format)'),
  
  body('alternate_phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid alternate phone number format'),
  
  body('gst_number')
    .optional()
    .trim()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GST number format'),
  
  body('pan_number')
    .optional()
    .trim()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Invalid PAN number format'),
  
  body('business_license')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Business license must not exceed 100 characters'),
  
  body('opening_date')
    .optional()
    .isISO8601().withMessage('Invalid opening date format (YYYY-MM-DD)'),
  
  body('admin_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer'),
  
  body('manager_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Admin/Manager ID must be a positive integer'),
  
  body('employee_count')
    .optional()
    .isInt({ min: 0 }).withMessage('Employee count must be a non-negative integer'),
  
  body('service_radius_km')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Service radius must be between 0 and 100 km'),
  
  // Settings validations
  body('settings.timezone')
    .optional()
    .isLength({ max: 50 }).withMessage('Timezone must not exceed 50 characters'),
  
  body('settings.currency')
    .optional()
    .isLength({ max: 10 }).withMessage('Currency must not exceed 10 characters'),
  
  body('settings.max_riders')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Max riders must be between 1 and 1000'),
  
  body('settings.max_vehicles')
    .optional()
    .isInt({ min: 1, max: 5000 }).withMessage('Max vehicles must be between 1 and 5000'),
  
  body('settings.max_daily_bookings')
    .optional()
    .isInt({ min: 1, max: 10000 }).withMessage('Max daily bookings must be between 1 and 10000'),
  
  body('settings.booking_radius_km')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Booking radius must be between 0 and 100 km'),
  
  body('settings.commission_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Commission percentage must be between 0 and 100')
];

// Validation for updating branch
const updateBranchValidation = [
  param('id')
    .notEmpty().withMessage('Branch ID is required')
    .isInt({ min: 1 }).withMessage('Branch ID must be a positive integer'),
  
  body('branch_name')
    .trim()
    .notEmpty().withMessage('Branch name is required')
    .isLength({ min: 3, max: 255 }).withMessage('Branch name must be between 3 and 255 characters'),
  
  body('branch_type')
    .optional()
    .isIn(['MAIN', 'SUB', 'FRANCHISE', 'PARTNER'])
    .withMessage('Invalid branch type'),
  
  body('address_line1')
    .trim()
    .notEmpty().withMessage('Address line 1 is required')
    .isLength({ max: 255 }).withMessage('Address line 1 must not exceed 255 characters'),
  
  body('address_line2')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Address line 2 must not exceed 255 characters'),
  
  body('city')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ max: 100 }).withMessage('City must not exceed 100 characters'),
  
  body('state')
    .trim()
    .notEmpty().withMessage('State is required')
    .isLength({ max: 100 }).withMessage('State must not exceed 100 characters'),
  
  body('country')
    .trim()
    .notEmpty().withMessage('Country is required')
    .isLength({ max: 100 }).withMessage('Country must not exceed 100 characters'),
  
  body('pin_code')
    .trim()
    .notEmpty().withMessage('Pin code is required')
    .matches(/^[0-9]{6}$/).withMessage('Pin code must be a 6-digit number'),
  
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phone_number')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
  
  body('alternate_phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid alternate phone number format'),
  
  body('gst_number')
    .optional()
    .trim()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GST number format'),
  
  body('pan_number')
    .optional()
    .trim()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Invalid PAN number format'),
  
  body('admin_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer'),
  
  body('manager_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Admin/Manager ID must be a positive integer'),
  
  body('employee_count')
    .optional()
    .isInt({ min: 0 }).withMessage('Employee count must be a non-negative integer'),
  
  body('service_radius_km')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Service radius must be between 0 and 100 km')
];

// Validation for updating branch status
const updateBranchStatusValidation = [
  param('id')
    .notEmpty().withMessage('Branch ID is required')
    .isInt({ min: 1 }).withMessage('Branch ID must be a positive integer'),
  
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'SUSPENDED'])
    .withMessage('Invalid status. Must be ACTIVE, INACTIVE, MAINTENANCE, or SUSPENDED')
];

// Validation for getting branch by ID
const getBranchByIdValidation = [
  param('id')
    .notEmpty().withMessage('Branch ID is required')
    .isInt({ min: 1 }).withMessage('Branch ID must be a positive integer')
];

// Validation for getting branches list
const getBranchesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Search term must not exceed 255 characters'),
  
  query('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'SUSPENDED'])
    .withMessage('Invalid status filter'),
  
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City must not exceed 100 characters'),
  
  query('state')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('State must not exceed 100 characters'),
  
  query('branchType')
    .optional()
    .isIn(['MAIN', 'SUB', 'FRANCHISE', 'WAREHOUSE'])
    .withMessage('Invalid branch type filter'),
  
  query('sortBy')
    .optional()
    .isIn(['created_at', 'branch_name', 'branch_code', 'city', 'state', 'branch_status'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Invalid sort order')
];

// Validation for deleting branch
const deleteBranchValidation = [
  param('id')
    .notEmpty().withMessage('Branch ID is required')
    .isInt({ min: 1 }).withMessage('Branch ID must be a positive integer')
];

// Validation for getting activity logs
const getActivityLogsValidation = [
  param('id')
    .notEmpty().withMessage('Branch ID is required')
    .isInt({ min: 1 }).withMessage('Branch ID must be a positive integer'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Validation for updating branch settings
const updateBranchSettingsValidation = [
  param('id')
    .notEmpty().withMessage('Branch ID is required')
    .isInt({ min: 1 }).withMessage('Branch ID must be a positive integer'),
  
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Timezone must not exceed 50 characters'),
  
  body('currency')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Currency must not exceed 10 characters'),
  
  body('language')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Language must not exceed 10 characters'),
  
  body('max_riders')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Max riders must be between 1 and 1000'),
  
  body('max_vehicles')
    .optional()
    .isInt({ min: 1, max: 5000 }).withMessage('Max vehicles must be between 1 and 5000'),
  
  body('max_daily_bookings')
    .optional()
    .isInt({ min: 1, max: 10000 }).withMessage('Max daily bookings must be between 1 and 10000'),
  
  body('booking_radius_km')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Booking radius must be between 0 and 100 km'),
  
  body('min_booking_amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Min booking amount must be non-negative'),
  
  body('commission_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Commission percentage must be between 0 and 100'),
  
  body('auto_assign_riders')
    .optional()
    .isBoolean().withMessage('Auto assign riders must be a boolean'),
  
  body('auto_accept_bookings')
    .optional()
    .isBoolean().withMessage('Auto accept bookings must be a boolean'),
  
  body('enable_email_notifications')
    .optional()
    .isBoolean().withMessage('Enable email notifications must be a boolean'),
  
  body('enable_sms_notifications')
    .optional()
    .isBoolean().withMessage('Enable SMS notifications must be a boolean'),
  
  body('enable_push_notifications')
    .optional()
    .isBoolean().withMessage('Enable push notifications must be a boolean'),
  
  body('accept_cash')
    .optional()
    .isBoolean().withMessage('Accept cash must be a boolean'),
  
  body('accept_online')
    .optional()
    .isBoolean().withMessage('Accept online must be a boolean'),
  
  body('accept_wallet')
    .optional()
    .isBoolean().withMessage('Accept wallet must be a boolean')
];

module.exports = {
  createBranchValidation,
  updateBranchValidation,
  updateBranchStatusValidation,
  getBranchByIdValidation,
  getBranchesValidation,
  deleteBranchValidation,
  getActivityLogsValidation,
  updateBranchSettingsValidation
};

