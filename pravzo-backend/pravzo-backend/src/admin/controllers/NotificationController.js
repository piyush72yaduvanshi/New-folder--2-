const { validationResult } = require('express-validator');
const NotificationService = require('../services/NotificationService');
const { successResponse, errorResponse } = require('../../../src/utils/response');
const logger = require('../../../src/utils/logger');

class NotificationController {
  // ==================== NOTIFICATION ENDPOINTS ====================

  // Get notifications list
  async getNotifications(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        search: req.query.search,
        status: req.query.status,
        notificationType: req.query.notificationType,
        recipientType: req.query.recipientType,
        createdBy: req.query.createdBy,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await NotificationService.getNotifications(filters, pagination);

      return successResponse(res, 200, 'Notifications retrieved successfully', result);
    } catch (error) {
      logger.error('Get Notifications Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get notification by ID
  async getNotificationById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const notificationId = parseInt(req.params.id);

      const notification = await NotificationService.getNotificationById(notificationId);

      return successResponse(res, 200, 'Notification details retrieved successfully', notification);
    } catch (error) {
      logger.error('Get Notification By ID Controller Error:', error);
      return errorResponse(res, error.message === 'Notification not found' ? 404 : 500, error.message);
    }
  }

  // Send notification
  async sendNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const notificationData = {
        title: req.body.title,
        message: req.body.message,
        notification_type: req.body.notification_type,
        recipient_type: req.body.recipient_type,
        recipient_id: req.body.recipient_id,
        recipient_ids: req.body.recipient_ids,
        channel: req.body.channel,
        priority: req.body.priority,
        action_type: req.body.action_type,
        action_data: req.body.action_data,
        image_url: req.body.image_url,
        template_id: req.body.template_id
      };

      const adminId = req.admin.admin_id;
      const requestInfo = {
        ip: req.ip,
        userAgent: req.get('user-agent')
      };

      const result = await NotificationService.sendNotification(notificationData, adminId, requestInfo);

      return successResponse(res, 200, 'Notification sent successfully', result);
    } catch (error) {
      logger.error('Send Notification Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Broadcast notification
  async broadcastNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const broadcastData = {
        title: req.body.title,
        message: req.body.message,
        notification_type: req.body.notification_type,
        broadcast_to: req.body.broadcast_to,
        filter_city: req.body.filter_city,
        filter_vehicle_type: req.body.filter_vehicle_type,
        filter_user_group: req.body.filter_user_group,
        channel: req.body.channel,
        priority: req.body.priority,
        action_type: req.body.action_type,
        action_data: req.body.action_data,
        image_url: req.body.image_url
      };

      const adminId = req.admin.admin_id;
      const requestInfo = {
        ip: req.ip,
        userAgent: req.get('user-agent')
      };

      const result = await NotificationService.broadcastNotification(broadcastData, adminId, requestInfo);

      return successResponse(res, 200, 'Notification broadcasted successfully', result);
    } catch (error) {
      logger.error('Broadcast Notification Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Schedule notification
  async scheduleNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const scheduleData = {
        title: req.body.title,
        message: req.body.message,
        notification_type: req.body.notification_type,
        recipient_type: req.body.recipient_type,
        recipient_id: req.body.recipient_id,
        recipient_ids: req.body.recipient_ids,
        scheduled_at: req.body.scheduled_at,
        channel: req.body.channel,
        priority: req.body.priority,
        action_type: req.body.action_type,
        action_data: req.body.action_data,
        image_url: req.body.image_url,
        template_id: req.body.template_id
      };

      const adminId = req.admin.admin_id;
      const requestInfo = {
        ip: req.ip,
        userAgent: req.get('user-agent')
      };

      const result = await NotificationService.scheduleNotification(scheduleData, adminId, requestInfo);

      return successResponse(res, 200, 'Notification scheduled successfully', result);
    } catch (error) {
      logger.error('Schedule Notification Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Cancel scheduled notification
  async cancelScheduledNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const notificationId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;
      const requestInfo = {
        ip: req.ip,
        userAgent: req.get('user-agent')
      };

      await NotificationService.cancelScheduledNotification(notificationId, adminId, requestInfo);

      return successResponse(res, 200, 'Scheduled notification cancelled successfully');
    } catch (error) {
      logger.error('Cancel Scheduled Notification Controller Error:', error);
      return errorResponse(res, error.message === 'Notification not found' ? 404 : 400, error.message);
    }
  }

  // Resend notification
  async resendNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const notificationId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;
      const requestInfo = {
        ip: req.ip,
        userAgent: req.get('user-agent')
      };

      await NotificationService.resendNotification(notificationId, adminId, requestInfo);

      return successResponse(res, 200, 'Notification resent successfully');
    } catch (error) {
      logger.error('Resend Notification Controller Error:', error);
      return errorResponse(res, error.message === 'Notification not found' ? 404 : 400, error.message);
    }
  }

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const notificationId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;
      const requestInfo = {
        ip: req.ip,
        userAgent: req.get('user-agent')
      };

      await NotificationService.deleteNotification(notificationId, adminId, requestInfo);

      return successResponse(res, 200, 'Notification deleted successfully');
    } catch (error) {
      logger.error('Delete Notification Controller Error:', error);
      return errorResponse(res, error.message === 'Notification not found' ? 404 : 500, error.message);
    }
  }

  // Get notification history
  async getNotificationHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        adminId: req.query.adminId,
        notificationType: req.query.notificationType,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await NotificationService.getNotificationHistory(filters, pagination);

      return successResponse(res, 200, 'Notification history retrieved successfully', result);
    } catch (error) {
      logger.error('Get Notification History Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get notification statistics
  async getNotificationStatistics(req, res) {
    try {
      const statistics = await NotificationService.getNotificationStatistics();

      return successResponse(res, 200, 'Notification statistics retrieved successfully', statistics);
    } catch (error) {
      logger.error('Get Notification Statistics Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // ==================== TEMPLATE ENDPOINTS ====================

  // Get templates
  async getTemplates(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        templateType: req.query.templateType,
        category: req.query.category,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : null
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await NotificationService.getTemplates(filters, pagination);

      return successResponse(res, 200, 'Templates retrieved successfully', result);
    } catch (error) {
      logger.error('Get Templates Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Create template
  async createTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const templateData = {
        template_name: req.body.template_name,
        template_type: req.body.template_type,
        title: req.body.title,
        message: req.body.message,
        subject: req.body.subject,
        html_content: req.body.html_content,
        sms_text: req.body.sms_text,
        variables: req.body.variables,
        category: req.body.category
      };

      const adminId = req.admin.admin_id;

      const templateId = await NotificationService.createTemplate(templateData, adminId);

      return successResponse(res, 201, 'Template created successfully', { templateId });
    } catch (error) {
      logger.error('Create Template Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Update template
  async updateTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const templateId = parseInt(req.params.id);
      const templateData = {
        title: req.body.title,
        message: req.body.message,
        subject: req.body.subject,
        html_content: req.body.html_content,
        sms_text: req.body.sms_text,
        variables: req.body.variables,
        category: req.body.category,
        is_active: req.body.is_active
      };

      const adminId = req.admin.admin_id;

      await NotificationService.updateTemplate(templateId, templateData, adminId);

      return successResponse(res, 200, 'Template updated successfully');
    } catch (error) {
      logger.error('Update Template Controller Error:', error);
      return errorResponse(res, error.message === 'Template not found' ? 404 : 400, error.message);
    }
  }

  // Delete template
  async deleteTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const templateId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;

      await NotificationService.deleteTemplate(templateId, adminId);

      return successResponse(res, 200, 'Template deleted successfully');
    } catch (error) {
      logger.error('Delete Template Controller Error:', error);
      return errorResponse(res, error.message === 'Template not found' ? 404 : 500, error.message);
    }
  }
}

module.exports = new NotificationController();

