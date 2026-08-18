const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const {
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
} = require('../validations/notificationValidation');

// All routes require authentication
router.use(authMiddleware);

// ==================== IMPORTANT: Route Order Matters! ====================
// Specific routes MUST be defined BEFORE parameterized routes (:id)
// ========================================================================

// ==================== NOTIFICATION ROUTES (Specific paths first) ====================

// Get notification statistics
router.get(
  '/statistics',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  NotificationController.getNotificationStatistics
);

// Get notification history
router.get(
  '/history',
  getHistoryValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  NotificationController.getNotificationHistory
);

// Send notification instantly
router.post(
  '/send',
  sendNotificationValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  NotificationController.sendNotification
);

// Broadcast notification
router.post(
  '/broadcast',
  broadcastNotificationValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  NotificationController.broadcastNotification
);

// Schedule notification
router.post(
  '/schedule',
  scheduleNotificationValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  NotificationController.scheduleNotification
);

// ==================== TEMPLATE ROUTES ====================

// Get all templates
router.get(
  '/templates',
  getTemplatesValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  NotificationController.getTemplates
);

// Create template
router.post(
  '/templates',
  createTemplateValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  NotificationController.createTemplate
);

// Update template
router.patch(
  '/templates/:id',
  updateTemplateValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  NotificationController.updateTemplate
);

// Delete template
router.delete(
  '/templates/:id',
  deleteTemplateValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  NotificationController.deleteTemplate
);

// ==================== NOTIFICATION ROUTES (Parameterized - MUST be last) ====================

// Get notifications list
router.get(
  '/',
  getNotificationsValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  NotificationController.getNotifications
);

// Get notification by ID
router.get(
  '/:id',
  getNotificationByIdValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  NotificationController.getNotificationById
);

// Cancel scheduled notification
router.patch(
  '/:id/cancel-schedule',
  getNotificationByIdValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  NotificationController.cancelScheduledNotification
);

// Resend notification
router.patch(
  '/:id/resend',
  getNotificationByIdValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  NotificationController.resendNotification
);

// Delete notification
router.delete(
  '/:id',
  getNotificationByIdValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  NotificationController.deleteNotification
);

module.exports = router;

