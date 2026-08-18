const { query, param, body } = require('express-validator');

// Get notifications validation
const getNotificationsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional({ checkFalsy: true }).isIn(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED']).withMessage('Invalid status'),
  query('notificationType').optional({ checkFalsy: true }).isIn(['PUSH', 'EMAIL', 'SMS', 'IN_APP']).withMessage('Invalid notification type'),
  query('recipientType').optional({ checkFalsy: true }).isIn(['SINGLE_USER', 'MULTIPLE_USERS', 'SINGLE_RIDER', 'MULTIPLE_RIDERS', 'ADMIN', 'ALL_USERS', 'ALL_RIDERS', 'ALL_ADMINS', 'CITY', 'VEHICLE_TYPE', 'USER_GROUP']).withMessage('Invalid recipient type'),
  query('sortBy').optional({ checkFalsy: true }).isIn(['created_at', 'scheduled_at', 'sent_at', 'status']).withMessage('Invalid sort field'),
  query('sortOrder').optional({ checkFalsy: true }).isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC')
];

// Get notification by ID validation
const getNotificationByIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Notification ID must be a positive integer')
];

// Send notification validation
const sendNotificationValidation = [
  body('title').notEmpty().withMessage('Title is required').trim().isLength({ max: 255 }).withMessage('Title must not exceed 255 characters'),
  body('message').notEmpty().withMessage('Message is required').trim(),
  body('notification_type').optional().isIn(['PUSH', 'EMAIL', 'SMS', 'IN_APP']).withMessage('Invalid notification type'),
  body('recipient_type').isIn(['SINGLE_USER', 'MULTIPLE_USERS', 'SINGLE_RIDER', 'MULTIPLE_RIDERS', 'ADMIN']).withMessage('Invalid recipient type'),
  body('recipient_id').if(body('recipient_type').isIn(['SINGLE_USER', 'SINGLE_RIDER'])).isInt({ min: 1 }).withMessage('Recipient ID must be a positive integer'),
  body('recipient_ids').if(body('recipient_type').isIn(['MULTIPLE_USERS', 'MULTIPLE_RIDERS'])).isArray({ min: 1 }).withMessage('Recipient IDs must be an array with at least one ID'),
  body('recipient_ids.*').if(body('recipient_type').isIn(['MULTIPLE_USERS', 'MULTIPLE_RIDERS'])).isInt({ min: 1 }).withMessage('Each recipient ID must be a positive integer'),
  body('channel').optional().isString().trim(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('action_type').optional().isString().trim(),
  body('action_data').optional().isObject().withMessage('Action data must be an object'),
  body('image_url').optional().isURL().withMessage('Image URL must be a valid URL'),
  body('template_id').optional().isInt({ min: 1 }).withMessage('Template ID must be a positive integer')
];

// Broadcast notification validation
const broadcastNotificationValidation = [
  body('title').notEmpty().withMessage('Title is required').trim().isLength({ max: 255 }).withMessage('Title must not exceed 255 characters'),
  body('message').notEmpty().withMessage('Message is required').trim(),
  body('notification_type').optional().isIn(['PUSH', 'EMAIL', 'SMS', 'IN_APP']).withMessage('Invalid notification type'),
  body('broadcast_to').isIn(['ALL_USERS', 'ALL_RIDERS', 'ALL_ADMINS', 'CITY', 'VEHICLE_TYPE', 'USER_GROUP']).withMessage('Invalid broadcast type'),
  body('filter_city').if(body('broadcast_to').equals('CITY')).notEmpty().withMessage('City filter is required for CITY broadcast').trim(),
  body('filter_vehicle_type').if(body('broadcast_to').equals('VEHICLE_TYPE')).notEmpty().withMessage('Vehicle type filter is required for VEHICLE_TYPE broadcast').trim(),
  body('filter_user_group').if(body('broadcast_to').equals('USER_GROUP')).notEmpty().withMessage('User group filter is required for USER_GROUP broadcast').trim(),
  body('channel').optional().isString().trim(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('action_type').optional().isString().trim(),
  body('action_data').optional().isObject().withMessage('Action data must be an object'),
  body('image_url').optional().isURL().withMessage('Image URL must be a valid URL')
];

// Schedule notification validation
const scheduleNotificationValidation = [
  body('title').notEmpty().withMessage('Title is required').trim().isLength({ max: 255 }).withMessage('Title must not exceed 255 characters'),
  body('message').notEmpty().withMessage('Message is required').trim(),
  body('notification_type').optional().isIn(['PUSH', 'EMAIL', 'SMS', 'IN_APP']).withMessage('Invalid notification type'),
  body('recipient_type').isIn(['SINGLE_USER', 'MULTIPLE_USERS', 'SINGLE_RIDER', 'MULTIPLE_RIDERS', 'ADMIN', 'ALL_USERS', 'ALL_RIDERS', 'ALL_ADMINS', 'CITY', 'VEHICLE_TYPE', 'USER_GROUP']).withMessage('Invalid recipient type'),
  body('recipient_id').if(body('recipient_type').isIn(['SINGLE_USER', 'SINGLE_RIDER'])).isInt({ min: 1 }).withMessage('Recipient ID must be a positive integer'),
  body('recipient_ids').if(body('recipient_type').isIn(['MULTIPLE_USERS', 'MULTIPLE_RIDERS'])).isArray({ min: 1 }).withMessage('Recipient IDs must be an array with at least one ID'),
  body('recipient_ids.*').if(body('recipient_type').isIn(['MULTIPLE_USERS', 'MULTIPLE_RIDERS'])).isInt({ min: 1 }).withMessage('Each recipient ID must be a positive integer'),
  body('scheduled_at').notEmpty().withMessage('Scheduled date/time is required').isISO8601().withMessage('Scheduled date must be in ISO 8601 format'),
  body('channel').optional().isString().trim(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('action_type').optional().isString().trim(),
  body('action_data').optional().isObject().withMessage('Action data must be an object'),
  body('image_url').optional().isURL().withMessage('Image URL must be a valid URL'),
  body('template_id').optional().isInt({ min: 1 }).withMessage('Template ID must be a positive integer')
];

// Get history validation
const getHistoryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('adminId').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Admin ID must be a positive integer'),
  query('notificationType').optional({ checkFalsy: true }).isIn(['PUSH', 'EMAIL', 'SMS', 'IN_APP']).withMessage('Invalid notification type'),
  query('startDate').optional({ checkFalsy: true }).isDate().withMessage('Invalid start date'),
  query('endDate').optional({ checkFalsy: true }).isDate().withMessage('Invalid end date')
];

// Get templates validation
const getTemplatesValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('templateType').optional({ checkFalsy: true }).isIn(['PUSH', 'EMAIL', 'SMS', 'IN_APP']).withMessage('Invalid template type'),
  query('category').optional({ checkFalsy: true }).isString().trim(),
  query('isActive').optional({ checkFalsy: true }).isBoolean().withMessage('isActive must be a boolean')
];

// Create template validation
const createTemplateValidation = [
  body('template_name').notEmpty().withMessage('Template name is required').trim().isLength({ max: 100 }).withMessage('Template name must not exceed 100 characters'),
  body('template_type').isIn(['PUSH', 'EMAIL', 'SMS', 'IN_APP']).withMessage('Invalid template type'),
  body('title').notEmpty().withMessage('Title is required').trim().isLength({ max: 255 }).withMessage('Title must not exceed 255 characters'),
  body('message').notEmpty().withMessage('Message is required').trim(),
  body('subject').optional().trim().isLength({ max: 255 }).withMessage('Subject must not exceed 255 characters'),
  body('html_content').optional().isString().withMessage('HTML content must be a string'),
  body('sms_text').optional().isString().trim().isLength({ max: 500 }).withMessage('SMS text must not exceed 500 characters'),
  body('variables').optional().isArray().withMessage('Variables must be an array'),
  body('category').optional().isString().trim().isLength({ max: 50 }).withMessage('Category must not exceed 50 characters')
];

// Update template validation
const updateTemplateValidation = [
  param('id').isInt({ min: 1 }).withMessage('Template ID must be a positive integer'),
  body('title').notEmpty().withMessage('Title is required').trim().isLength({ max: 255 }).withMessage('Title must not exceed 255 characters'),
  body('message').notEmpty().withMessage('Message is required').trim(),
  body('subject').optional().trim().isLength({ max: 255 }).withMessage('Subject must not exceed 255 characters'),
  body('html_content').optional().isString().withMessage('HTML content must be a string'),
  body('sms_text').optional().isString().trim().isLength({ max: 500 }).withMessage('SMS text must not exceed 500 characters'),
  body('variables').optional().isArray().withMessage('Variables must be an array'),
  body('category').optional().isString().trim().isLength({ max: 50 }).withMessage('Category must not exceed 50 characters'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
];

// Delete template validation
const deleteTemplateValidation = [
  param('id').isInt({ min: 1 }).withMessage('Template ID must be a positive integer')
];

module.exports = {
  getNotificationsValidation,
  getNotificationByIdValidation,
  sendNotificationValidation,
  broadcastNotificationValidation,
  scheduleNotificationValidation,
  getHistoryValidation,
  getTemplatesValidation,
  createTemplateValidation,
  updateTemplateValidation,
  deleteTemplateValidation
};

