const { body, param, query } = require('express-validator');

const getBookingsValidation = [
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
  query('bookingStatus')
    .optional()
    .isIn(['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'REJECTED']).withMessage('Invalid booking status'),
  query('rideType')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Ride type too long'),
  query('vehicleType')
    .optional()
    .isIn(['BIKE', 'SCOOTER', 'E_BIKE', 'E_SCOOTER', 'CYCLE']).withMessage('Invalid vehicle type'),
  query('paymentStatus')
    .optional()
    .isIn(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']).withMessage('Invalid payment status'),
  query('paymentMethod')
    .optional()
    .isIn(['CASH', 'CARD', 'WALLET', 'UPI', 'NET_BANKING']).withMessage('Invalid payment method'),
  query('riderId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  query('userId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long'),
  query('couponCode')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Coupon code too long'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  query('sortBy')
    .optional()
    .isIn(['created_at', 'fare_amount', 'distance_km', 'duration_minutes', 'updated_at']).withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('Invalid sort order')
];

const getBookingByIdValidation = [
  param('id')
    .notEmpty().withMessage('Booking ID is required')
    .isInt({ min: 1 }).withMessage('Invalid booking ID')
];

const exportBookingsValidation = [
  query('format')
    .notEmpty().withMessage('Export format is required')
    .isIn(['csv', 'excel']).withMessage('Format must be csv or excel'),
  query('bookingStatus')
    .optional()
    .isIn(['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'REJECTED']).withMessage('Invalid booking status'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
];

const cancelBookingValidation = [
  param('id')
    .notEmpty().withMessage('Booking ID is required')
    .isInt({ min: 1 }).withMessage('Invalid booking ID'),
  body('reason')
    .notEmpty().withMessage('Cancellation reason is required')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters'),
  body('cancelledBy')
    .notEmpty().withMessage('Cancelled by is required')
    .isIn(['ADMIN', 'CUSTOMER', 'RIDER', 'SYSTEM']).withMessage('Invalid cancelled by value')
];

const rescheduleBookingValidation = [
  param('id')
    .notEmpty().withMessage('Booking ID is required')
    .isInt({ min: 1 }).withMessage('Invalid booking ID'),
  body('newPickupTime')
    .notEmpty().withMessage('New pickup time is required')
    .isISO8601().withMessage('Invalid date format')
];

const refundBookingValidation = [
  param('id')
    .notEmpty().withMessage('Booking ID is required')
    .isInt({ min: 1 }).withMessage('Invalid booking ID'),
  body('refundAmount')
    .notEmpty().withMessage('Refund amount is required')
    .isFloat({ min: 0 }).withMessage('Refund amount must be a positive number'),
  body('refundReason')
    .notEmpty().withMessage('Refund reason is required')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters')
];

const reassignRiderValidation = [
  param('id')
    .notEmpty().withMessage('Booking ID is required')
    .isInt({ min: 1 }).withMessage('Invalid booking ID'),
  body('newRiderId')
    .notEmpty().withMessage('New rider ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rider ID'),
  body('reason')
    .notEmpty().withMessage('Reassignment reason is required')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters')
];

const contactValidation = [
  param('id')
    .notEmpty().withMessage('Booking ID is required')
    .isInt({ min: 1 }).withMessage('Invalid booking ID'),
  body('message')
    .notEmpty().withMessage('Message is required')
    .trim()
    .isLength({ min: 5, max: 500 }).withMessage('Message must be between 5 and 500 characters')
];

const manualCompleteValidation = [
  param('id')
    .notEmpty().withMessage('Booking ID is required')
    .isInt({ min: 1 }).withMessage('Invalid booking ID'),
  body('finalFare')
    .optional()
    .isFloat({ min: 0 }).withMessage('Final fare must be a positive number'),
  body('completionNotes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes too long')
];

const updatePaymentValidation = [
  param('id')
    .notEmpty().withMessage('Booking ID is required')
    .isInt({ min: 1 }).withMessage('Invalid booking ID'),
  body('paymentStatus')
    .notEmpty().withMessage('Payment status is required')
    .isIn(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']).withMessage('Invalid payment status'),
  body('paymentMethod')
    .optional()
    .isIn(['CASH', 'CARD', 'WALLET', 'UPI', 'NET_BANKING']).withMessage('Invalid payment method'),
  body('transactionId')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Transaction ID too long')
];

const updateFareValidation = [
  param('id')
    .notEmpty().withMessage('Booking ID is required')
    .isInt({ min: 1 }).withMessage('Invalid booking ID'),
  body('newFare')
    .notEmpty().withMessage('New fare is required')
    .isFloat({ min: 0 }).withMessage('Fare must be a positive number'),
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters')
];

const updateStatusValidation = [
  param('id')
    .notEmpty().withMessage('Booking ID is required')
    .isInt({ min: 1 }).withMessage('Invalid booking ID'),
  body('newStatus')
    .notEmpty().withMessage('New status is required')
    .isIn(['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'REJECTED']).withMessage('Invalid status'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason too long')
];

const analyticsDateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'year', 'custom']).withMessage('Invalid period'),
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long')
];

module.exports = {
  getBookingsValidation,
  getBookingByIdValidation,
  exportBookingsValidation,
  cancelBookingValidation,
  rescheduleBookingValidation,
  refundBookingValidation,
  reassignRiderValidation,
  contactValidation,
  manualCompleteValidation,
  updatePaymentValidation,
  updateFareValidation,
  updateStatusValidation,
  analyticsDateRangeValidation
};

