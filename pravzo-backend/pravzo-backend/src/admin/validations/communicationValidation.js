const { body, param, query } = require('express-validator');

const sendNotificationValidation = [
  body('recipientType')
    .isIn(['USER', 'RIDER', 'BRANCH', 'PARTNER', 'ADMIN'])
    .withMessage('Invalid recipient type. Must be USER, RIDER, BRANCH, PARTNER, or ADMIN'),
  body('recipientId')
    .isInt({ min: 1 })
    .withMessage('Recipient ID must be a positive integer'),
  body('channelType')
    .isIn(['EMAIL', 'SMS', 'PUSH', 'WHATSAPP', 'IN_APP'])
    .withMessage('Invalid channel type. Must be EMAIL, SMS, PUSH, WHATSAPP, or IN_APP'),
  body('subject')
    .optional()
    .isString()
    .trim(),
  body('body')
    .notEmpty()
    .withMessage('Message body is required')
];

const broadcastNotificationValidation = [
  body('recipientType')
    .isIn(['USER', 'RIDER', 'ADMIN'])
    .withMessage('Invalid recipient type for broadcast. Must be USER, RIDER, or ADMIN'),
  body('channelType')
    .isIn(['EMAIL', 'SMS', 'PUSH', 'WHATSAPP', 'IN_APP'])
    .withMessage('Invalid channel type'),
  body('subject')
    .optional()
    .isString()
    .trim(),
  body('body')
    .notEmpty()
    .withMessage('Broadcast body is required')
];

const createTemplateValidation = [
  body('template_name')
    .notEmpty()
    .withMessage('Template name is required')
    .isString()
    .trim(),
  body('subject_template')
    .optional()
    .isString()
    .trim(),
  body('body_template')
    .notEmpty()
    .withMessage('Body template content is required'),
  body('channel_type')
    .isIn(['EMAIL', 'SMS', 'PUSH', 'WHATSAPP', 'IN_APP'])
    .withMessage('Invalid channel type'),
  body('language')
    .optional()
    .isString()
    .trim()
];

const createCampaignValidation = [
  body('campaign_name')
    .notEmpty()
    .withMessage('Campaign name is required'),
  body('template_id')
    .isInt({ min: 1 })
    .withMessage('Template ID must be a positive integer'),
  body('group_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Group ID must be a positive integer'),
  body('schedule_time')
    .optional()
    .isISO8601()
    .withMessage('Schedule time must be a valid ISO 8601 timestamp')
];

const updatePreferencesValidation = [
  body('preferences')
    .isArray({ min: 1 })
    .withMessage('Preferences array is required and cannot be empty'),
  body('preferences.*.channelType')
    .isIn(['EMAIL', 'SMS', 'PUSH', 'WHATSAPP'])
    .withMessage('Invalid channelType in preferences list'),
  body('preferences.*.category')
    .isIn(['MARKETING', 'TRANSACTIONAL'])
    .withMessage('Invalid preference category. Must be MARKETING or TRANSACTIONAL'),
  body('preferences.*.enabled')
    .isBoolean()
    .withMessage('Preference status enabled must be a boolean value')
];

const incomingWebhookValidation = [
  body('eventType')
    .notEmpty()
    .withMessage('eventType is required'),
  body('payload')
    .notEmpty()
    .withMessage('payload object is required')
];

const queryLogLimitValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit must be an integer between 1 and 200')
];

module.exports = {
  sendNotificationValidation,
  broadcastNotificationValidation,
  createTemplateValidation,
  createCampaignValidation,
  updatePreferencesValidation,
  incomingWebhookValidation,
  queryLogLimitValidation
};

