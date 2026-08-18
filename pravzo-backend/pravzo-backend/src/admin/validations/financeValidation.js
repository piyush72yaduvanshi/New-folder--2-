const { body, query, param } = require('express-validator');

const creditDebitWalletValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0.00'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description must be less than 255 characters')
];

const createPaymentValidation = [
  body('referenceType')
    .isIn(['RENTAL', 'BOOKING', 'WALLET_CREDIT'])
    .withMessage('Invalid reference type. Must be RENTAL, BOOKING, or WALLET_CREDIT'),
  body('referenceId')
    .notEmpty()
    .withMessage('Reference ID is required'),
  body('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('paymentMethod')
    .isIn(['Wallet', 'Cash', 'UPI', 'Card', 'Net Banking', 'Razorpay', 'Stripe', 'PhonePe', 'Custom Gateway'])
    .withMessage('Invalid payment method'),
  body('gatewayProvider')
    .optional()
    .isIn(['RAZORPAY', 'STRIPE', 'PHONEPE', 'CASH', 'WALLET'])
    .withMessage('Invalid gateway provider')
];

const verifyPaymentValidation = [
  param('id').isInt({ min: 1 }).withMessage('Payment ID must be a positive integer'),
  body('gatewayPaymentId')
    .optional()
    .isString()
    .trim(),
  body('razorpaySignature')
    .optional()
    .isString()
    .trim(),
  body('razorpayPaymentId')
    .optional()
    .isString()
    .trim(),
  body('razorpayOrderId')
    .optional()
    .isString()
    .trim()
];

const processRefundValidation = [
  param('id').isInt({ min: 1 }).withMessage('Payment ID must be a positive integer'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0'),
  body('reason')
    .notEmpty()
    .withMessage('Refund reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
];

const runSettlementValidation = [
  body('period')
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL'])
    .withMessage('Invalid settlement period. Must be DAILY, WEEKLY, MONTHLY, or MANUAL')
];

const completeSettlementValidation = [
  param('id').isInt({ min: 1 }).withMessage('Settlement ID must be a positive integer'),
  body('transactionId')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Transaction ID cannot be empty if provided')
];

const queryDateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date string'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date string')
];

module.exports = {
  creditDebitWalletValidation,
  createPaymentValidation,
  verifyPaymentValidation,
  processRefundValidation,
  runSettlementValidation,
  completeSettlementValidation,
  queryDateRangeValidation
};

