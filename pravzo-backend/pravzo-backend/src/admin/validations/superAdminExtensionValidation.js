const { body, param, query } = require('express-validator');

// Validation rules for System Settings
const updateSystemSettingValidation = [
  body('key')
    .trim()
    .notEmpty().withMessage('Setting key is required')
    .isLength({ max: 100 }).withMessage('Key must not exceed 100 characters'),
  body('value')
    .notEmpty().withMessage('Setting value is required')
];

// Validation rules for Vehicle Maintenance
const createMaintenanceValidation = [
  body('vehicle_id')
    .isInt({ min: 1 }).withMessage('Valid vehicle_id is required'),
  body('service_type')
    .trim()
    .notEmpty().withMessage('Service type is required'),
  body('service_date')
    .isISO8601().withMessage('Valid service date (YYYY-MM-DD) is required')
];

const updateMaintenanceStatusValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid maintenance ID is required'),
  body('status')
    .isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Invalid maintenance status')
];

// Validation rules for Insurance Policies
const createInsuranceValidation = [
  body('vehicle_id')
    .isInt({ min: 1 }).withMessage('Valid vehicle_id is required'),
  body('policy_number')
    .trim()
    .notEmpty().withMessage('Policy number is required'),
  body('provider_name')
    .trim()
    .notEmpty().withMessage('Provider name is required'),
  body('start_date')
    .isISO8601().withMessage('Valid start date is required'),
  body('expiry_date')
    .isISO8601().withMessage('Valid expiry date is required')
];

// Validation rules for Support Tickets
const createSupportTicketValidation = [
  body('user_id')
    .isInt({ min: 1 }).withMessage('Valid user_id is required'),
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
];

const updateSupportTicketValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid ticket ID is required'),
  body('status')
    .isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).withMessage('Invalid ticket status')
];

// Validation rules for Commission Rules
const createCommissionRuleValidation = [
  body('rule_name')
    .trim()
    .notEmpty().withMessage('Rule name is required'),
  body('commission_rate')
    .isFloat({ min: 0 }).withMessage('Valid commission rate is required')
];

// Validation rules for Tax Configurations
const createTaxConfigValidation = [
  body('tax_name')
    .trim()
    .notEmpty().withMessage('Tax name is required'),
  body('rate_percentage')
    .isFloat({ min: 0, max: 100 }).withMessage('Rate percentage must be between 0 and 100')
];

// Validation rules for Job Assignments
const createJobAssignmentValidation = [
  body().custom((val, { req }) => {
    const title = req.body.job_title || req.body.jobTitle || req.body.title;
    if (!title || !String(title).trim()) {
      throw new Error('Job title is required');
    }
    const assignedTo = req.body.assigned_to || req.body.assignedTo || req.body.userId || req.body.user_id || req.body.riderId || req.body.rider_id;
    if (!assignedTo || isNaN(parseInt(assignedTo, 10)) || parseInt(assignedTo, 10) < 1) {
      throw new Error('Valid assigned_to user ID is required');
    }
    return true;
  })
];

const updateJobStatusValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid job ID is required'),
  body('status')
    .custom((val) => {
      const allowed = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ACTIVE', 'CANCELLED', 'ASSIGNED', 'OPEN', 'TERMINATED', 'INACTIVE'];
      if (!val || !allowed.includes(String(val).toUpperCase())) {
        throw new Error('Invalid job status. Allowed: PENDING, IN_PROGRESS, COMPLETED, FAILED, ACTIVE, CANCELLED, TERMINATED');
      }
      return true;
    })
];

// Validation rules for Audit Logs
const auditLogIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid audit log ID is required')
];

const exportAuditLogsValidation = [
  query('module').optional().isString().withMessage('Module must be a string'),
  query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000')
];

// Maintenance Param Validation
const maintenanceIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid maintenance ID is required')
];

const updateMaintenanceValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid maintenance ID is required'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a non-negative number'),
  body('estimated_cost').optional().isFloat({ min: 0 }).withMessage('Estimated cost must be a non-negative number'),
  body('status').optional().isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Invalid maintenance status'),
  body('scheduled_date').optional().isISO8601().withMessage('Valid scheduled date (YYYY-MM-DD) required'),
  body('completed_date').optional().isISO8601().withMessage('Valid completed date (YYYY-MM-DD) required'),
  body('performed_by').optional().isInt({ min: 1 }).withMessage('Performed by must be a valid user ID'),
  body('remarks').optional().isString(),
  body('description').optional().isString(),
  body('maintenance_type').optional().isString()
];

// Insurance Param Validation
const insuranceIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid insurance ID is required')
];

const updateInsuranceValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid insurance ID is required'),
  body('policy_number').optional().trim().notEmpty().withMessage('Policy number cannot be empty'),
  body('provider').optional().trim().notEmpty().withMessage('Provider cannot be empty'),
  body('provider_name').optional().trim().notEmpty().withMessage('Provider name cannot be empty'),
  body('premium_amount').optional().isFloat({ min: 0 }).withMessage('Premium must be non-negative'),
  body('premium').optional().isFloat({ min: 0 }).withMessage('Premium must be non-negative'),
  body('coverage_amount').optional().isFloat({ min: 0 }).withMessage('Coverage amount must be non-negative'),
  body('start_date').optional().isISO8601().withMessage('Valid start date required'),
  body('expiry_date').optional().isISO8601().withMessage('Valid expiry date required'),
  body('status').optional().isIn(['ACTIVE', 'EXPIRED', 'CANCELLED']).withMessage('Invalid insurance status'),
  body('document_url').optional().isString()
];

// Support Ticket Param Validation
const ticketIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid ticket ID is required')
];

const updateTicketFullValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid ticket ID is required'),
  body('category').optional().isString().withMessage('Category must be a string'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Priority must be LOW, MEDIUM, HIGH, or CRITICAL'),
  body('status').optional().isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).withMessage('Status must be OPEN, IN_PROGRESS, RESOLVED, or CLOSED'),
  body('subject').optional().trim().notEmpty().withMessage('Subject cannot be empty'),
  body('description').optional().isString(),
  body('resolution_notes').optional().isString(),
  body('assigned_admin_id').optional().isInt({ min: 1 }).withMessage('Assigned admin must be a valid ID')
];

const resolveTicketValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid ticket ID is required'),
  body('resolution_notes').optional().isString().withMessage('Resolution notes must be a string')
];

// Commission Rule Param Validation
const commissionRuleIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid commission rule ID is required')
];

const updateCommissionRuleValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid commission rule ID is required'),
  body('rule_name').optional().trim().notEmpty().withMessage('Rule name cannot be empty'),
  body('vehicle_type').optional().isString(),
  body('city').optional().isString(),
  body('commission_percentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Commission percentage must be between 0 and 100'),
  body('commission_rate').optional().isFloat({ min: 0, max: 100 }).withMessage('Commission rate must be between 0 and 100'),
  body('min_commission').optional().isFloat({ min: 0 }).withMessage('Min commission must be non-negative'),
  body('max_commission').optional().isFloat({ min: 0 }).withMessage('Max commission must be non-negative'),
  body('is_active').optional().isInt({ min: 0, max: 1 }).withMessage('is_active must be 0 or 1'),
  body('priority').optional().isInt({ min: 0 }).withMessage('Priority must be a non-negative integer')
];

// Tax Config Param Validation
const taxConfigIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid tax configuration ID is required')
];

const updateTaxConfigValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid tax configuration ID is required'),
  body('tax_name').optional().trim().notEmpty().withMessage('Tax name cannot be empty'),
  body('rate_percentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Rate percentage must be between 0 and 100'),
  body('hsn_sac_code').optional().isString().withMessage('HSN/SAC code must be a string'),
  body('state_code').optional().isString().withMessage('State code must be a string'),
  body('is_active').optional().isInt({ min: 0, max: 1 }).withMessage('is_active must be 0 or 1')
];

module.exports = {
  updateSystemSettingValidation,
  createMaintenanceValidation,
  updateMaintenanceStatusValidation,
  maintenanceIdValidation,
  updateMaintenanceValidation,
  createInsuranceValidation,
  insuranceIdValidation,
  updateInsuranceValidation,
  createSupportTicketValidation,
  updateSupportTicketValidation,
  ticketIdValidation,
  updateTicketFullValidation,
  resolveTicketValidation,
  createCommissionRuleValidation,
  commissionRuleIdValidation,
  updateCommissionRuleValidation,
  createTaxConfigValidation,
  taxConfigIdValidation,
  updateTaxConfigValidation,
  createJobAssignmentValidation,
  updateJobStatusValidation,
  auditLogIdValidation,
  exportAuditLogsValidation
};

