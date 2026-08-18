const { body, param, query } = require('express-validator');

const getKYCListValidation = [
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
    .isIn(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVERIFY_REQUIRED']).withMessage('Invalid status'),
  query('verificationType')
    .optional()
    .isIn(['DRIVING_LICENSE', 'AADHAR_CARD', 'PAN_CARD', 'BANK_STATEMENT', 'OTHER']).withMessage('Invalid verification type'),
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  query('sortBy')
    .optional()
    .isIn(['created_at', 'verified_at', 'user_id']).withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('Invalid sort order')
];

const getKYCByIdValidation = [
  param('id')
    .notEmpty().withMessage('Document ID is required')
    .isInt({ min: 1 }).withMessage('Invalid document ID')
];

const approveKYCValidation = [
  body().custom((value, { req }) => {
    const id = req.body.userId || req.body.user_id || req.body.documentId || req.body.kycId || req.body.kyc_id;
    if (!id || isNaN(parseInt(id, 10)) || parseInt(id, 10) < 1) {
      throw new Error('Valid User ID or Document ID is required');
    }
    return true;
  }),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Remarks must not exceed 500 characters')
];

const rejectKYCValidation = [
  body().custom((value, { req }) => {
    const id = req.body.userId || req.body.user_id || req.body.documentId || req.body.kycId || req.body.kyc_id;
    if (!id || isNaN(parseInt(id, 10)) || parseInt(id, 10) < 1) {
      throw new Error('Valid User ID or Document ID is required');
    }
    return true;
  }),
  body('reason')
    .notEmpty().withMessage('Rejection reason is required')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Remarks must not exceed 500 characters')
];

const reverifyKYCValidation = [
  body().custom((value, { req }) => {
    const id = req.body.userId || req.body.user_id || req.body.documentId || req.body.kycId || req.body.kyc_id;
    if (!id || isNaN(parseInt(id, 10)) || parseInt(id, 10) < 1) {
      throw new Error('Valid User ID or Document ID is required');
    }
    return true;
  }),
  body('reason')
    .notEmpty().withMessage('Reverify reason is required')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters')
];

const updateKYCStatusValidation = [
  body().custom((value, { req }) => {
    const id = req.body.userId || req.body.user_id || req.body.documentId || req.body.kycId || req.body.kyc_id;
    if (!id || isNaN(parseInt(id, 10)) || parseInt(id, 10) < 1) {
      throw new Error('Valid User ID or Document ID is required');
    }
    return true;
  }),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVERIFY_REQUIRED']).withMessage('Invalid status value')
];

const getKYCTimelineValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID')
];

const downloadKYCValidation = [
  param('id')
    .notEmpty().withMessage('Document ID is required')
    .isInt({ min: 1 }).withMessage('Invalid document ID')
];

const exportKYCValidation = [
  query('format')
    .notEmpty().withMessage('Export format is required')
    .isIn(['csv', 'excel', 'CSV', 'EXCEL']).withMessage('Format must be csv or excel'),
  query('status')
    .optional()
    .isIn(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVERIFY_REQUIRED']).withMessage('Invalid status'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
];

module.exports = {
  getKYCListValidation,
  getKYCByIdValidation,
  approveKYCValidation,
  rejectKYCValidation,
  reverifyKYCValidation,
  updateKYCStatusValidation,
  getKYCTimelineValidation,
  downloadKYCValidation,
  exportKYCValidation
};

