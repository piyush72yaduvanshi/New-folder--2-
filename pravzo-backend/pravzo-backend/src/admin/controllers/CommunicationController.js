const { validationResult } = require('express-validator');
const CommunicationService = require('../services/CommunicationService');
const { successResponse, errorResponse } = require('../../../src/utils/response');
const logger = require('../../../src/utils/logger');

class CommunicationController {
  // ==================== NOTIFICATIONS ====================

  async getNotifications(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        recipientType: req.query.recipientType,
        recipientId: req.query.recipientId ? parseInt(req.query.recipientId) : null,
        channelType: req.query.channelType,
        status: req.query.status
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await CommunicationService.getNotifications(filters, pagination);
      return successResponse(res, 200, 'Notifications retrieved successfully', result);
    } catch (error) {
      logger.error('CommunicationController.getNotifications Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  async getNotificationById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const id = parseInt(req.params.id);
      const notification = await CommunicationService.getNotificationById(id);
      return successResponse(res, 200, 'Notification retrieved successfully', notification);
    } catch (error) {
      logger.error('CommunicationController.getNotificationById Error:', error);
      return errorResponse(res, error.message === 'Notification not found' ? 404 : 500, error.message);
    }
  }

  async sendNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const { recipientType, recipientId, channelType, subject, body, priority } = req.body;
      const result = await CommunicationService.sendNotification(
        recipientType,
        recipientId,
        channelType,
        subject,
        body,
        priority
      );

      return successResponse(res, 201, 'Notification enqueued successfully', result);
    } catch (error) {
      logger.error('CommunicationController.sendNotification Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  async broadcastNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const { recipientType, channelType, subject, body } = req.body;
      const result = await CommunicationService.broadcastNotification(
        recipientType,
        channelType,
        subject,
        body
      );

      return successResponse(res, 201, 'Broadcast enqueued successfully', result);
    } catch (error) {
      logger.error('CommunicationController.broadcastNotification Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  async readNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const id = parseInt(req.params.id);
      const result = await CommunicationService.readNotification(id);
      return successResponse(res, 200, 'Notification marked as read', result);
    } catch (error) {
      logger.error('CommunicationController.readNotification Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  async deleteNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const id = parseInt(req.params.id);
      const deleted = await CommunicationService.deleteNotification(id);
      
      if (!deleted) {
        return errorResponse(res, 404, 'Notification not found');
      }

      return successResponse(res, 200, 'Notification deleted successfully');
    } catch (error) {
      logger.error('CommunicationController.deleteNotification Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // ==================== TEMPLATES ====================

  async createTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const templateId = await CommunicationService.createTemplate(req.body);
      return successResponse(res, 201, 'Template created successfully', { templateId });
    } catch (error) {
      logger.error('CommunicationController.createTemplate Error:', error);
      // Duplicate template name — return 409 instead of 500
      if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate entry'))) {
        return errorResponse(res, 409, 'A template with this name already exists');
      }
      return errorResponse(res, 500, error.message);
    }
  }

  async getTemplates(req, res) {
    try {
      const filters = {
        channelType: req.query.channelType
      };

      const templates = await CommunicationService.getTemplates(filters);
      return successResponse(res, 200, 'Templates list retrieved', templates);
    } catch (error) {
      logger.error('CommunicationController.getTemplates Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  async getTemplateById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const template = await CommunicationService.getTemplateById(id);
      return successResponse(res, 200, 'Template details retrieved', template);
    } catch (error) {
      logger.error('CommunicationController.getTemplateById Error:', error);
      return errorResponse(res, error.message === 'Template not found' ? 404 : 500, error.message);
    }
  }

  async updateTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const id = parseInt(req.params.id);
      await CommunicationService.updateTemplate(id, req.body);
      return successResponse(res, 200, 'Template updated successfully');
    } catch (error) {
      logger.error('CommunicationController.updateTemplate Error:', error);
      return errorResponse(res, error.message === 'Template not found' ? 404 : 500, error.message);
    }
  }

  async deleteTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const id = parseInt(req.params.id);
      await CommunicationService.deleteTemplate(id);
      return successResponse(res, 200, 'Template deleted successfully');
    } catch (error) {
      logger.error('CommunicationController.deleteTemplate Error:', error);
      return errorResponse(res, error.message === 'Template not found' ? 404 : 500, error.message);
    }
  }

  // ==================== CAMPAIGNS ====================

  async createCampaign(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const result = await CommunicationService.createCampaign(req.body);
      return successResponse(res, 201, 'Campaign scheduled successfully', result);
    } catch (error) {
      logger.error('CommunicationController.createCampaign Error:', error);
      // Migration not yet run — return 503 with actionable message
      if (error.message && error.message.includes('not yet available')) {
        return errorResponse(res, 503, error.message);
      }
      return errorResponse(res, 500, error.message);
    }
  }

  async getCampaigns(req, res) {
    try {
      const filters = {
        status: req.query.status
      };
      const campaigns = await CommunicationService.getCampaigns(filters);
      return successResponse(res, 200, 'Campaigns list retrieved', campaigns);
    } catch (error) {
      logger.error('CommunicationController.getCampaigns Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  async startCampaign(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const campaignId = parseInt(req.params.id);
      const adminId = req.admin ? req.admin.admin_id : 0;

      const result = await CommunicationService.startCampaign(campaignId, adminId);
      return successResponse(res, 200, 'Campaign processing initiated', result);
    } catch (error) {
      logger.error('CommunicationController.startCampaign Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  async stopCampaign(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const campaignId = parseInt(req.params.id);
      const adminId = req.admin ? req.admin.admin_id : 0;

      const result = await CommunicationService.stopCampaign(campaignId, adminId);
      return successResponse(res, 200, 'Campaign execution paused', result);
    } catch (error) {
      logger.error('CommunicationController.stopCampaign Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // ==================== PREFERENCES ====================

  async getPreferences(req, res) {
    try {
      // Allow user preference check (req.user exists if user role token mapped, otherwise check role query details)
      // E.g., user is standard customer
      const recipientType = req.user ? 'USER' : (req.rider ? 'RIDER' : 'USER');
      const recipientId = req.user ? req.user.user_id : (req.rider ? req.rider.rider_id : 1);

      const prefs = await CommunicationService.getPreferences(recipientType, recipientId);
      return successResponse(res, 200, 'Notification preferences retrieved', prefs);
    } catch (error) {
      logger.error('CommunicationController.getPreferences Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  async updatePreferences(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const recipientType = req.user ? 'USER' : (req.rider ? 'RIDER' : 'USER');
      const recipientId = req.user ? req.user.user_id : (req.rider ? req.rider.rider_id : 1);
      const { preferences } = req.body;

      const result = await CommunicationService.updatePreferences(recipientType, recipientId, preferences);
      return successResponse(res, 200, 'Preferences saved successfully', result);
    } catch (error) {
      logger.error('CommunicationController.updatePreferences Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // ==================== WEBHOOK PROCESS ====================

  async postIncomingWebhookEvent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const { eventType, payload } = req.body;
      const signatureHeader = req.headers['x-pravzo-signature'];

      const result = await CommunicationService.postIncomingWebhookEvent(eventType, payload, signatureHeader);
      return successResponse(res, 201, 'Webhook processed successfully', result);
    } catch (error) {
      logger.error('CommunicationController.postIncomingWebhookEvent Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  async getWebhookLogs(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const limit = parseInt(req.query.limit) || 100;
      const logs = await CommunicationService.getWebhookLogs(limit);
      return successResponse(res, 200, 'Webhook logs list retrieved', logs);
    } catch (error) {
      logger.error('CommunicationController.getWebhookLogs Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }
}

module.exports = new CommunicationController();

