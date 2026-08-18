const { body, param, query } = require('express-validator');

const getUsersValidation = [
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
    .isIn(['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING', 'SUSPENDED']).withMessage('Invalid status'),
  query('role')
    .optional()
    .isIn(['USER', 'DELIVERY', 'RENT_A_VEHICLE']).withMessage('Invalid role'),
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long'),
  query('gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Invalid gender'),
  query('verified')
    .optional()
    .isIn(['true', 'false', '1', '0']).withMessage('Verified must be boolean'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  query('sortBy')
    .optional()
    .isIn(['created_at', 'full_name', 'wallet_amount', 'updated_at']).withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('Invalid sort order')
];

const getUserByIdValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .custom((val) => {
      const clean = String(val).replace(/\D/g, '');
      if (!clean || parseInt(clean, 10) < 1) {
        throw new Error('Invalid user ID');
      }
      return true;
    })
];

const blockUserValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('reason')
    .notEmpty().withMessage('Block reason is required')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Block reason must be between 10 and 500 characters')
];

const unblockUserValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID')
];

const verifyUserValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Remarks must not exceed 500 characters')
];

const updateUserStatusValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']).withMessage('Invalid status value')
];

const deleteUserValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('reason')
    .notEmpty().withMessage('Delete reason is required')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Delete reason must be between 10 and 500 characters')
];

const exportUsersValidation = [
  query('format')
    .notEmpty().withMessage('Export format is required')
    .isIn(['csv', 'excel', 'CSV', 'EXCEL']).withMessage('Format must be csv or excel'),
  query('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING', 'SUSPENDED']).withMessage('Invalid status'),
  query('role')
    .optional()
    .isIn(['USER', 'DELIVERY', 'RENT_A_VEHICLE']).withMessage('Invalid role'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
];

const getUserLoginHistoryValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const getUserBookingsValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'SOS']).withMessage('Invalid booking status')
];

const getUserPaymentsValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['BOOKING', 'WALLET', 'REFUND', 'PENALTY', 'COMMISSION', 'OTHER']).withMessage('Invalid payment type')
];

const getUserActivityValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

module.exports = {
  getUsersValidation,
  getUserByIdValidation,
  blockUserValidation,
  unblockUserValidation,
  verifyUserValidation,
  updateUserStatusValidation,
  deleteUserValidation,
  exportUsersValidation,
  getUserLoginHistoryValidation,
  getUserBookingsValidation,
  getUserPaymentsValidation,
  getUserActivityValidation
};


// ==================== ENTERPRISE USER MANAGEMENT VALIDATIONS ====================

const updateUserValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Full name must be between 2 and 200 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format'),
  body('phone_number')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/).withMessage('Phone number must be 10 digits'),
  body('date_of_birth')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Invalid gender'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address too long')
];

const verifyKYCValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('kycId')
    .notEmpty().withMessage('KYC ID is required')
    .isInt({ min: 1 }).withMessage('Invalid KYC ID'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['APPROVED', 'REJECTED', 'UNDER_REVIEW', 'REVERIFY_REQUIRED']).withMessage('Invalid KYC status'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Remarks too long'),
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Rejection reason too long')
];

const resetPasswordValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID')
];

const transferBranchValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('branchId')
    .notEmpty().withMessage('Branch ID is required')
    .isInt({ min: 1 }).withMessage('Invalid branch ID'),
  body('reason')
    .notEmpty().withMessage('Transfer reason is required')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes too long')
];

const getWalletValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID')
];

const getWalletTransactionsValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['CREDIT', 'DEBIT']).withMessage('Invalid transaction type'),
  query('status')
    .optional()
    .isIn(['PENDING', 'COMPLETED', 'FAILED', 'REVERSED']).withMessage('Invalid transaction status'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
];

const creditWalletValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description')
    .notEmpty().withMessage('Description is required')
    .trim()
    .isLength({ min: 5, max: 255 }).withMessage('Description must be between 5 and 255 characters'),
  body('referenceType')
    .notEmpty().withMessage('Reference type is required')
    .trim()
    .isLength({ max: 50 }).withMessage('Reference type too long'),
  body('referenceId')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Reference ID too long'),
  body('paymentMethod')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Payment method too long'),
  body('paymentReference')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Payment reference too long')
];

const debitWalletValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description')
    .notEmpty().withMessage('Description is required')
    .trim()
    .isLength({ min: 5, max: 255 }).withMessage('Description must be between 5 and 255 characters'),
  body('referenceType')
    .notEmpty().withMessage('Reference type is required')
    .trim()
    .isLength({ max: 50 }).withMessage('Reference type too long'),
  body('referenceId')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Reference ID too long'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes too long')
];

const getUserRentalsValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['ACTIVE', 'COMPLETED', 'CANCELLED', 'PENDING']).withMessage('Invalid rental status')
];

const getUserJobsValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Status too long')
];

const getActivityTimelineValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('activityType')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Activity type too long'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
];

const getLoginHistoryDetailedValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['SUCCESS', 'FAILED', 'BLOCKED', 'SUSPENDED']).withMessage('Invalid login status'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
];

const getDevicesValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID')
];

const getDocumentsValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID')
];

module.exports = {
  getUsersValidation,
  getUserByIdValidation,
  blockUserValidation,
  unblockUserValidation,
  verifyUserValidation,
  updateUserStatusValidation,
  deleteUserValidation,
  exportUsersValidation,
  getUserLoginHistoryValidation,
  getUserBookingsValidation,
  getUserPaymentsValidation,
  getUserActivityValidation,
  // Enterprise validations
  updateUserValidation,
  verifyKYCValidation,
  resetPasswordValidation,
  transferBranchValidation,
  getWalletValidation,
  getWalletTransactionsValidation,
  creditWalletValidation,
  debitWalletValidation,
  getUserRentalsValidation,
  getUserJobsValidation,
  getActivityTimelineValidation,
  getLoginHistoryDetailedValidation,
  getDevicesValidation,
  getDocumentsValidation
};

