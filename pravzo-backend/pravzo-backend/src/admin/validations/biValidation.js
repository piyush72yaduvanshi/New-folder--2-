const { body, query, param } = require('express-validator');

const getDashboardValidation = [
  query('dashboardType')
    .optional()
    .isIn(['EXECUTIVE', 'OPERATIONS', 'FINANCE', 'FLEET', 'RENTAL', 'PARTNER', 'BRANCH', 'SUPPORT'])
    .withMessage('Invalid dashboardType specified')
];

const widgetCrudValidation = [
  body('widget_name')
    .notEmpty()
    .withMessage('Widget name is required'),
  body('widget_type')
    .isIn(['CARD', 'CHART', 'TABLE'])
    .withMessage('Widget type must be CARD, CHART, or TABLE'),
  body('data_source')
    .notEmpty()
    .withMessage('Data source service reference is required')
];

const generateReportValidation = [
  body('templateId')
    .isInt({ min: 1 })
    .withMessage('Template ID must be a positive integer'),
  body('parameters')
    .optional()
    .isObject()
    .withMessage('Parameters must be a JSON object')
];

const scheduleReportValidation = [
  body('templateId')
    .isInt({ min: 1 })
    .withMessage('Template ID must be a positive integer'),
  body('frequency')
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
    .withMessage('Invalid recurrence frequency'),
  body('recipientEmail')
    .isEmail()
    .withMessage('A valid recipient email is required')
];

const exportValidation = [
  body('reportType')
    .isIn(['REVENUE', 'RENTALS', 'JOBS', 'RIDERS', 'FLEET', 'PAYMENTS', 'BRANCHES', 'SYSTEM'])
    .withMessage('Invalid reportType to export'),
  body('format')
    .isIn(['CSV', 'EXCEL', 'PDF'])
    .withMessage('Invalid format. Must be CSV, EXCEL, or PDF'),
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be a JSON object')
];

module.exports = {
  getDashboardValidation,
  widgetCrudValidation,
  generateReportValidation,
  scheduleReportValidation,
  exportValidation
};

