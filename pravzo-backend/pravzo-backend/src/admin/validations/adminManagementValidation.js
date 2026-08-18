const { body, param, query } = require('express-validator');

// Validation for creating admin
const createAdminValidation = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 255 }).withMessage('Full name must be between 2 and 255 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phone_number')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-()]+$/).withMessage('Invalid phone number format'),
  
  body('role')
    .optional()
    .isIn(['SUPER_ADMIN', 'ADMIN'])
    .withMessage('Invalid role. Must be SUPER_ADMIN or ADMIN'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department must not exceed 100 characters')
];

// Validation for updating admin
const updateAdminValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer'),
  
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 255 }).withMessage('Full name must be between 2 and 255 characters'),
  
  body('phone_number')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-()]+$/).withMessage('Invalid phone number format'),
  
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['SUPER_ADMIN', 'ADMIN'])
    .withMessage('Invalid role. Must be SUPER_ADMIN or ADMIN'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department must not exceed 100 characters')
];

// Validation for getting admin by ID
const getAdminByIdValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer')
];

// Validation for getting admins list
const getAdminsValidation = [
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
  
  query('role')
    .optional()
    .isIn(['SUPER_ADMIN', 'ADMIN'])
    .withMessage('Invalid role filter'),
  
  query('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'BLOCKED', 'SUSPENDED', 'PENDING'])
    .withMessage('Invalid status filter'),
  
  query('sortBy')
    .optional()
    .isIn(['created_at', 'full_name', 'email', 'last_login_at'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Invalid sort order')
];

// Validation for blocking admin
const blockAdminValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
];

// Validation for unblocking admin
const unblockAdminValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer')
];

// Validation for resetting password
const resetPasswordValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer')
];

// Validation for deleting admin
const deleteAdminValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer')
];

// Validation for getting activity logs
const getActivityLogsValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Validation for assigning branch
const assignBranchValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer'),
  
  body('branch_id')
    .notEmpty().withMessage('Branch ID is required')
    .isInt({ min: 1 }).withMessage('Branch ID must be a positive integer'),
  
  body('assignment_type')
    .optional()
    .isIn(['PRIMARY', 'TEMPORARY', 'BACKUP'])
    .withMessage('Invalid assignment type. Must be PRIMARY, TEMPORARY, or BACKUP')
];

// Validation for transferring branch
const transferBranchValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer'),
  
  body('new_branch_id')
    .notEmpty().withMessage('New branch ID is required')
    .isInt({ min: 1 }).withMessage('New branch ID must be a positive integer'),
  
  body('transfer_reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Transfer reason must not exceed 500 characters'),
  
  body('transfer_notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Transfer notes must not exceed 1000 characters')
];

// Validation for removing branch
const removeBranchValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer')
];

// Validation for getting assignment history
const getAssignmentHistoryValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Validation for getting login history
const getLoginHistoryValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Validation for updating permissions
const updatePermissionsValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer'),
  
  body('dashboard').optional().isBoolean().withMessage('Dashboard must be boolean'),
  body('users').optional().isBoolean().withMessage('Users must be boolean'),
  body('riders').optional().isBoolean().withMessage('Riders must be boolean'),
  body('vehicles').optional().isBoolean().withMessage('Vehicles must be boolean'),
  body('bookings').optional().isBoolean().withMessage('Bookings must be boolean'),
  body('rentals').optional().isBoolean().withMessage('Rentals must be boolean'),
  body('jobs').optional().isBoolean().withMessage('Jobs must be boolean'),
  body('reports').optional().isBoolean().withMessage('Reports must be boolean'),
  body('payments').optional().isBoolean().withMessage('Payments must be boolean'),
  body('notifications').optional().isBoolean().withMessage('Notifications must be boolean'),
  body('settings').optional().isBoolean().withMessage('Settings must be boolean'),
  body('landing_cms').optional().isBoolean().withMessage('Landing CMS must be boolean'),
  body('branches').optional().isBoolean().withMessage('Branches must be boolean'),
  body('admin_management').optional().isBoolean().withMessage('Admin Management must be boolean')
];

// Validation for getting permissions
const getPermissionsValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer')
];

// Validation for getting active sessions
const getActiveSessionsValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer')
];

// Validation for revoking session
const revokeSessionValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer'),
  
  param('session_id')
    .notEmpty().withMessage('Session ID is required')
    .isString().withMessage('Session ID must be a string')
];

// Validation for updating admin status
const updateAdminStatusValidation = [
  param('id')
    .notEmpty().withMessage('Admin ID is required')
    .isInt({ min: 1 }).withMessage('Admin ID must be a positive integer'),
  
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['ACTIVE', 'INACTIVE', 'BLOCKED', 'SUSPENDED', 'PENDING', 'LOCKED'])
    .withMessage('Invalid status')
];

module.exports = {
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
};

