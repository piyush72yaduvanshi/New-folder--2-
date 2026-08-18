const { query } = require('express-validator');

// Common date range validation
const dateRangeValidation = [
  query('period')
    .optional()
    .isIn(['today', 'yesterday', 'last7days', 'last30days', 'last90days', 'currentMonth', 'previousMonth', 'currentYear', 'custom'])
    .withMessage('Invalid period'),
  query('startDate')
    .optional()
    .isDate()
    .withMessage('Invalid start date'),
  query('endDate')
    .optional()
    .isDate()
    .withMessage('Invalid end date'),
  query('city')
    .optional()
    .trim(),
  query('vehicleType')
    .optional()
    .trim()
];

// Revenue report validation
const revenueReportValidation = [
  ...dateRangeValidation,
  query('paymentMethod')
    .optional()
    .isIn(['CASH', 'CARD', 'UPI', 'WALLET', 'NET_BANKING'])
    .withMessage('Invalid payment method'),
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Invalid groupBy value')
];

// Booking report validation
const bookingReportValidation = [
  ...dateRangeValidation,
  query('status')
    .optional()
    .isIn(['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'REJECTED'])
    .withMessage('Invalid booking status'),
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month', 'hour'])
    .withMessage('Invalid groupBy value')
];

// User report validation
const userReportValidation = [
  ...dateRangeValidation,
  query('status')
    .optional()
    .isIn(['ACTIVE', 'BLOCKED', 'INACTIVE'])
    .withMessage('Invalid user status')
];

// Rider report validation
const riderReportValidation = [
  ...dateRangeValidation,
  query('status')
    .optional()
    .isIn(['ACTIVE', 'OFFLINE', 'BLOCKED', 'SUSPENDED'])
    .withMessage('Invalid rider status')
];

// Vehicle report validation
const vehicleReportValidation = [
  ...dateRangeValidation,
  query('status')
    .optional()
    .isIn(['ACTIVE', 'MAINTENANCE', 'BLOCKED', 'INACTIVE'])
    .withMessage('Invalid vehicle status')
];

// Payment report validation
const paymentReportValidation = [
  ...dateRangeValidation,
  query('paymentStatus')
    .optional()
    .isIn(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PROCESSING'])
    .withMessage('Invalid payment status')
];

// Support report validation
const supportReportValidation = [
  ...dateRangeValidation,
  query('status')
    .optional()
    .isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'PENDING'])
    .withMessage('Invalid support status')
];

// KYC report validation
const kycReportValidation = [
  ...dateRangeValidation,
  query('status')
    .optional()
    .isIn(['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'])
    .withMessage('Invalid KYC status')
];

// Top lists validation
const topListValidation = [
  ...dateRangeValidation,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Download report validation
const downloadReportValidation = [
  query('type')
    .isIn(['revenue', 'bookings', 'users', 'riders', 'vehicles', 'payments', 'support', 'kyc'])
    .withMessage('Invalid report type'),
  query('format')
    .isIn(['csv', 'excel', 'pdf'])
    .withMessage('Format must be csv, excel, or pdf'),
  ...dateRangeValidation
];

// Chart data validation
const chartDataValidation = [
  ...dateRangeValidation,
  query('interval')
    .optional()
    .isIn(['hourly', 'daily', 'weekly', 'monthly'])
    .withMessage('Invalid interval')
];

module.exports = {
  dateRangeValidation,
  revenueReportValidation,
  bookingReportValidation,
  userReportValidation,
  riderReportValidation,
  vehicleReportValidation,
  paymentReportValidation,
  supportReportValidation,
  kycReportValidation,
  topListValidation,
  downloadReportValidation,
  chartDataValidation
};

