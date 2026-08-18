const { query, param, body } = require('express-validator');

// Get payments validation
const getPaymentsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('paymentStatus').optional().isIn(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PROCESSING']).withMessage('Invalid payment status'),
  query('paymentMethod').optional().isIn(['CASH', 'CARD', 'UPI', 'WALLET', 'NET_BANKING']).withMessage('Invalid payment method'),
  query('sortBy').optional().isIn(['created_at', 'amount', 'payment_status']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC')
];

// Get payment by ID validation
const getPaymentByIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Payment ID must be a positive integer')
];

// Export payments validation
const exportPaymentsValidation = [
  query('format').isIn(['csv', 'excel']).withMessage('Format must be csv or excel')
];

// Process refund validation
const processRefundValidation = [
  param('id').isInt({ min: 1 }).withMessage('Payment ID must be a positive integer'),
  body('refundAmount').isFloat({ min: 0.01 }).withMessage('Refund amount must be greater than 0'),
  body('refundReason').notEmpty().withMessage('Refund reason is required').trim()
];

// Update payment status validation
const updatePaymentStatusValidation = [
  param('id').isInt({ min: 1 }).withMessage('Payment ID must be a positive integer'),
  body('status').isIn(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PROCESSING']).withMessage('Invalid payment status')
];

// Wallet operation validation
const walletOperationValidation = [
  param('id').isInt({ min: 1 }).withMessage('User/Rider ID must be a positive integer'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').notEmpty().withMessage('Description is required').trim()
];

// Get settlements validation
const getSettlementsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).withMessage('Invalid settlement status')
];

// Process settlement validation
const processSettlementValidation = [
  param('id').isInt({ min: 1 }).withMessage('Settlement ID must be a positive integer'),
  body('transactionReference').notEmpty().withMessage('Transaction reference is required').trim(),
  body('utrNumber').optional().trim()
];

// Analytics date range validation
const analyticsDateRangeValidation = [
  query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Invalid period'),
  query('startDate').optional().isDate().withMessage('Invalid start date'),
  query('endDate').optional().isDate().withMessage('Invalid end date'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

module.exports = {
  getPaymentsValidation,
  getPaymentByIdValidation,
  exportPaymentsValidation,
  processRefundValidation,
  updatePaymentStatusValidation,
  walletOperationValidation,
  getSettlementsValidation,
  processSettlementValidation,
  analyticsDateRangeValidation
};

