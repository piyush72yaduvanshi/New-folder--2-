const express = require('express');
const CommunicationController = require('../controllers/CommunicationController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const {
  sendNotificationValidation,
  broadcastNotificationValidation,
  createTemplateValidation,
  createCampaignValidation,
  updatePreferencesValidation,
  incomingWebhookValidation,
  queryLogLimitValidation
} = require('../validations/communicationValidation');

// ------------------------------------------------------------
// NOTIFICATIONS ROUTER
// ------------------------------------------------------------
const notificationRouter = express.Router();

notificationRouter.use(authMiddleware);

// Get list of notifications
notificationRouter.get(
  '/',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  CommunicationController.getNotifications
);

// Get specific notification detail by ID
notificationRouter.get(
  '/:id',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  CommunicationController.getNotificationById
);

// Send instant notification
notificationRouter.post(
  '/send',
  sendNotificationValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  CommunicationController.sendNotification
);

// Broadcast bulk notifications
notificationRouter.post(
  '/broadcast',
  broadcastNotificationValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  CommunicationController.broadcastNotification
);

// Mark notification as read
notificationRouter.patch(
  '/:id/read',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  CommunicationController.readNotification
);

// Delete notification record
notificationRouter.delete(
  '/:id',
  permissionMiddleware(['SUPER_ADMIN']),
  CommunicationController.deleteNotification
);

// ------------------------------------------------------------
// TEMPLATE ROUTER
// ------------------------------------------------------------
const templateRouter = express.Router();

templateRouter.use(authMiddleware);

// Create template
templateRouter.post(
  '/',
  createTemplateValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  CommunicationController.createTemplate
);

// Get templates
templateRouter.get(
  '/',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  CommunicationController.getTemplates
);

// Get template by ID
templateRouter.get(
  '/:id',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  CommunicationController.getTemplateById
);

// Update template (PUT and PATCH)
templateRouter.put(
  '/:id',
  createTemplateValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  CommunicationController.updateTemplate
);

templateRouter.patch(
  '/:id',
  createTemplateValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  CommunicationController.updateTemplate
);

// Delete template
templateRouter.delete(
  '/:id',
  permissionMiddleware(['SUPER_ADMIN']),
  CommunicationController.deleteTemplate
);

// ------------------------------------------------------------
// CAMPAIGN ROUTER
// ------------------------------------------------------------
const campaignRouter = express.Router();

campaignRouter.use(authMiddleware);
campaignRouter.use(permissionMiddleware(['SUPER_ADMIN']));

// Create campaign draft
campaignRouter.post(
  '/',
  createCampaignValidation,
  CommunicationController.createCampaign
);

// Get campaigns list
campaignRouter.get(
  '/',
  CommunicationController.getCampaigns
);

// Start campaign running execution
campaignRouter.patch(
  '/:id/start',
  CommunicationController.startCampaign
);

// Stop/pause campaign execution
campaignRouter.patch(
  '/:id/stop',
  CommunicationController.stopCampaign
);

// ------------------------------------------------------------
// PREFERENCES ROUTER
// ------------------------------------------------------------
const preferencesRouter = express.Router();

preferencesRouter.use(authMiddleware);

// Get preference configuration list
preferencesRouter.get(
  '/',
  CommunicationController.getPreferences
);

// Update preferences details
preferencesRouter.patch(
  '/',
  updatePreferencesValidation,
  CommunicationController.updatePreferences
);

// ------------------------------------------------------------
// WEBHOOKS ROUTER
// ------------------------------------------------------------
const webhookRouter = express.Router();

// Incoming event receiver does not require auth (public gateway endpoint)
webhookRouter.post(
  '/events',
  incomingWebhookValidation,
  CommunicationController.postIncomingWebhookEvent
);

// Get logs trace requires SUPER_ADMIN auth
webhookRouter.get(
  '/logs',
  authMiddleware,
  queryLogLimitValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  CommunicationController.getWebhookLogs
);

module.exports = {
  notificationRouter,
  templateRouter,
  campaignRouter,
  preferencesRouter,
  webhookRouter
};

