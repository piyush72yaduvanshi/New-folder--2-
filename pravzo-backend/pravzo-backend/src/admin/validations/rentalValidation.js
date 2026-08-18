const { body, param, query } = require('express-validator');

const getRentalsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Search query is too long'),
  query('status')
    .optional()
    .isIn([
      'CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'RESERVED', 
      'READY_FOR_PICKUP', 'ACTIVE', 'EXTENDED', 'RETURN_PENDING', 
      'INSPECTION_PENDING', 'COMPLETED', 'CANCELLED', 'FORCE_CLOSED', 
      'OVERDUE', 'FAILED'
    ]).withMessage('Invalid rental status'),
  query('branchId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid branch ID'),
  query('vehicleId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
  query('userId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  query('paymentStatus')
    .optional()
    .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']).withMessage('Invalid payment status'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  query('sortBy')
    .optional()
    .isIn(['created_at', 'start_date', 'end_date', 'total_amount', 'rental_id']).withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('Invalid sort order')
];

const getRentalByIdValidation = [
  param('id')
    .notEmpty().withMessage('Rental ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rental ID')
];

const pickupValidation = [
  param('id')
    .notEmpty().withMessage('Rental ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rental ID'),
  body('otp')
    .notEmpty().withMessage('Pickup OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 characters'),
  body('signature')
    .notEmpty().withMessage('Digital signature is required'),
  body('inspection')
    .notEmpty().withMessage('Inspection details are required')
    .isObject().withMessage('Inspection must be an object'),
  body('inspection.batteryOk')
    .notEmpty().withMessage('Battery status check is required')
    .isBoolean().withMessage('batteryOk must be boolean'),
  body('inspection.tyresOk')
    .notEmpty().withMessage('Tyres status check is required')
    .isBoolean().withMessage('tyresOk must be boolean'),
  body('inspection.brakeOk')
    .notEmpty().withMessage('Brakes status check is required')
    .isBoolean().withMessage('brakeOk must be boolean'),
  body('inspection.lightsOk')
    .notEmpty().withMessage('Lights status check is required')
    .isBoolean().withMessage('lightsOk must be boolean'),
  body('inspection.bodyOk')
    .notEmpty().withMessage('Body status check is required')
    .isBoolean().withMessage('bodyOk must be boolean'),
  body('inspection.mirrorOk')
    .notEmpty().withMessage('Mirrors status check is required')
    .isBoolean().withMessage('mirrorOk must be boolean'),
  body('inspection.helmetOk')
    .notEmpty().withMessage('Helmet status check is required')
    .isBoolean().withMessage('helmetOk must be boolean'),
  body('checklist')
    .notEmpty().withMessage('Checklist selection is required')
    .isObject().withMessage('Checklist must be an object'),
  body('customerConfirmation')
    .notEmpty().withMessage('Customer confirmation is required')
    .isBoolean().withMessage('customerConfirmation must be boolean'),
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array of string URLs')
];

const returnValidation = [
  param('id')
    .notEmpty().withMessage('Rental ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rental ID'),
  body('inspection')
    .notEmpty().withMessage('Inspection details are required')
    .isObject().withMessage('Inspection must be an object'),
  body('inspection.batteryOk')
    .notEmpty().withMessage('Battery status check is required')
    .isBoolean().withMessage('batteryOk must be boolean'),
  body('inspection.tyresOk')
    .notEmpty().withMessage('Tyres status check is required')
    .isBoolean().withMessage('tyresOk must be boolean'),
  body('inspection.brakeOk')
    .notEmpty().withMessage('Brakes status check is required')
    .isBoolean().withMessage('brakeOk must be boolean'),
  body('inspection.lightsOk')
    .notEmpty().withMessage('Lights status check is required')
    .isBoolean().withMessage('lightsOk must be boolean'),
  body('inspection.bodyOk')
    .notEmpty().withMessage('Body status check is required')
    .isBoolean().withMessage('bodyOk must be boolean'),
  body('inspection.mirrorOk')
    .notEmpty().withMessage('Mirrors status check is required')
    .isBoolean().withMessage('mirrorOk must be boolean'),
  body('inspection.helmetOk')
    .notEmpty().withMessage('Helmet status check is required')
    .isBoolean().withMessage('helmetOk must be boolean'),
  body('checklist')
    .notEmpty().withMessage('Checklist selection is required')
    .isObject().withMessage('Checklist must be an object'),
  body('customerConfirmation')
    .notEmpty().withMessage('Customer confirmation is required')
    .isBoolean().withMessage('customerConfirmation must be boolean'),
  body('damageCost')
    .optional()
    .isFloat({ min: 0 }).withMessage('Damage cost must be a non-negative number'),
  body('cleaningCost')
    .optional()
    .isFloat({ min: 0 }).withMessage('Cleaning cost must be a non-negative number'),
  body('missingAccessoriesCost')
    .optional()
    .isFloat({ min: 0 }).withMessage('Missing accessories cost must be a non-negative number'),
  body('fuelShortageCost')
    .optional()
    .isFloat({ min: 0 }).withMessage('Fuel shortage cost must be a non-negative number'),
  body('batteryIssueCost')
    .optional()
    .isFloat({ min: 0 }).withMessage('Battery issue cost must be a non-negative number'),
  body('policyViolationCost')
    .optional()
    .isFloat({ min: 0 }).withMessage('Policy violation cost must be a non-negative number')
];

const extendValidation = [
  param('id')
    .notEmpty().withMessage('Rental ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rental ID'),
  body('duration')
    .notEmpty().withMessage('Extension duration is required')
    .isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('durationUnit')
    .notEmpty().withMessage('Extension duration unit is required')
    .isIn(['hours', 'days', 'weeks']).withMessage('Duration unit must be hours, days, or weeks'),
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['CASH', 'WALLET', 'UPI', 'CARD', 'NETBANKING', 'GATEWAY']).withMessage('Invalid payment method'),
  body('paymentStatus')
    .notEmpty().withMessage('Payment status is required')
    .isIn(['PENDING', 'PAID']).withMessage('Payment status must be PENDING or PAID')
];

const cancelValidation = [
  param('id')
    .notEmpty().withMessage('Rental ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rental ID'),
  body('reason')
    .notEmpty().withMessage('Cancellation reason is required')
    .trim()
    .isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters')
];

const forceCloseValidation = [
  param('id')
    .notEmpty().withMessage('Rental ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rental ID'),
  body('reason')
    .notEmpty().withMessage('Force close reason is required')
    .trim()
    .isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters')
];

const manualInspectionValidation = [
  param('id')
    .notEmpty().withMessage('Rental ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rental ID'),
  body('inspectionType')
    .notEmpty().withMessage('Inspection type is required')
    .isIn(['PRE_RENTAL', 'POST_RENTAL']).withMessage('Invalid inspection type'),
  body('batteryOk')
    .notEmpty().withMessage('Battery check is required')
    .isBoolean().withMessage('batteryOk must be boolean'),
  body('tyresOk')
    .notEmpty().withMessage('Tyres check is required')
    .isBoolean().withMessage('tyresOk must be boolean'),
  body('brakeOk')
    .notEmpty().withMessage('Brakes check is required')
    .isBoolean().withMessage('brakeOk must be boolean'),
  body('lightsOk')
    .notEmpty().withMessage('Lights check is required')
    .isBoolean().withMessage('lightsOk must be boolean'),
  body('bodyOk')
    .notEmpty().withMessage('Body check is required')
    .isBoolean().withMessage('bodyOk must be boolean'),
  body('mirrorOk')
    .notEmpty().withMessage('Mirrors check is required')
    .isBoolean().withMessage('mirrorOk must be boolean'),
  body('helmetOk')
    .notEmpty().withMessage('Helmet check is required')
    .isBoolean().withMessage('helmetOk must be boolean')
];

const manualChecklistValidation = [
  param('id')
    .notEmpty().withMessage('Rental ID is required')
    .isInt({ min: 1 }).withMessage('Invalid rental ID'),
  body('checklistType')
    .notEmpty().withMessage('Checklist type is required')
    .isIn(['PICKUP', 'RETURN']).withMessage('Invalid checklist type'),
  body('items')
    .notEmpty().withMessage('Checklist items are required')
    .isObject().withMessage('items must be an object'),
  body('customerConfirmation')
    .notEmpty().withMessage('Customer confirmation is required')
    .isBoolean().withMessage('customerConfirmation must be boolean')
];

module.exports = {
  getRentalsValidation,
  getRentalByIdValidation,
  pickupValidation,
  returnValidation,
  extendValidation,
  cancelValidation,
  forceCloseValidation,
  manualInspectionValidation,
  manualChecklistValidation
};

