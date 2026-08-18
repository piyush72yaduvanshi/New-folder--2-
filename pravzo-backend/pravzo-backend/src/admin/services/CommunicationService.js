const CommunicationRepository = require('../repositories/CommunicationRepository');
const eventBus = require('../../../src/utils/eventBus');
const notificationEngine = require('../../../src/utils/notificationEngine');
const logger = require('../../../src/utils/logger');
const db = require('../../../src/config/db');

class CommunicationService {
  constructor() {
    this.bootstrapEventListeners();
  }

  bootstrapEventListeners() {
    // 1. On user registration
    eventBus.subscribe('USER_REGISTERED', async (payload) => {
      logger.info('[CommunicationService] Event listener triggered: USER_REGISTERED', payload);
      const name = payload.name || 'User';
      const userId = payload.userId;

      // Queue Welcome Email
      await this.sendNotificationFromTemplate('WELCOME_EMAIL', 'USER', userId, { name });
      // Queue Welcome SMS
      await this.sendNotificationFromTemplate('WELCOME_SMS', 'USER', userId, { name });
    });

    // 2. On payment success
    eventBus.subscribe('PAYMENT_SUCCESS', async (payload) => {
      logger.info('[CommunicationService] Event listener triggered: PAYMENT_SUCCESS', payload);
      const name = payload.userName || 'Customer';
      const userId = payload.userId;
      const amount = payload.amount;
      const refId = payload.referenceId;

      await this.sendNotificationFromTemplate('PAYMENT_SUCCESS_SMS', 'USER', userId, { amount, refId });
      await this.sendNotificationFromTemplate('PAYMENT_SUCCESS_WHATSAPP', 'USER', userId, { name, amount, refId });
    });

    // 3. On rental starting
    eventBus.subscribe('RENTAL_STARTED', async (payload) => {
      logger.info('[CommunicationService] Event listener triggered: RENTAL_STARTED', payload);
      const name = payload.customerName || 'Customer';
      const userId = payload.userId;
      const rentalId = payload.rentalId;
      const regNo = payload.registrationNumber || 'Vehicle';

      await this.sendNotificationFromTemplate('RENTAL_STARTED_EMAIL', 'USER', userId, { name, rentalId, regNo });
      await this.sendNotificationFromTemplate('RENTAL_STARTED_PUSH', 'USER', userId, { rentalId, regNo });
    });
  }

  // ==================== TEMPLATE & DYNAMIC SENDERS ====================

  async sendNotificationFromTemplate(templateName, recipientType, recipientId, variables = {}, conn = db) {
    try {
      const template = await CommunicationRepository.findTemplateByName(templateName, conn);
      if (!template) {
        logger.warn(`[CommunicationService] Template not found: ${templateName}`);
        return null;
      }

      // Render content
      const subject = template.subject_template ? notificationEngine.renderTemplate(template.subject_template, variables) : null;
      const body = notificationEngine.renderTemplate(template.body_template, variables);

      // Create notification
      const notificationId = await CommunicationRepository.createNotification({
        recipient_type: recipientType,
        recipient_id: recipientId,
        channel_type: template.channel_type,
        subject,
        body,
        status: 'QUEUED'
      }, conn);

      // Add to queue
      await CommunicationRepository.addNotificationToQueue({
        notification_id: notificationId,
        priority: 1,
        status: 'PENDING'
      }, conn);

      // Trigger async send instantly
      setImmediate(async () => {
        const deliverConn = await CommunicationRepository.getConnection();
        try {
          await notificationEngine.deliverNotification(notificationId, deliverConn);
        } catch (err) {
          logger.error(`[CommunicationService] Async send failed for template notification:`, err);
        } finally {
          deliverConn.release();
        }
      });

      return notificationId;
    } catch (error) {
      logger.error(`[CommunicationService] sendNotificationFromTemplate Error (${templateName}):`, error);
      throw error;
    }
  }

  // ==================== NOTIFICATIONS ====================

  async getNotifications(filters, pagination) {
    try {
      return await CommunicationRepository.getNotifications(filters, pagination);
    } catch (error) {
      logger.error('CommunicationService.getNotifications Error:', error);
      throw error;
    }
  }

  async getNotificationById(id) {
    try {
      const notification = await CommunicationRepository.findNotificationById(id);
      if (!notification) {
        throw new Error('Notification not found');
      }
      return notification;
    } catch (error) {
      logger.error(`CommunicationService.getNotificationById Error (${id}):`, error);
      throw error;
    }
  }

  async sendNotification(recipientType, recipientId, channelType, subject, body, priority = 0) {
    const conn = await CommunicationRepository.getConnection();
    try {
      await conn.beginTransaction();

      const notificationId = await CommunicationRepository.createNotification({
        recipient_type: recipientType,
        recipient_id: recipientId,
        channel_type: channelType,
        subject,
        body,
        status: 'QUEUED'
      }, conn);

      await CommunicationRepository.addNotificationToQueue({
        notification_id: notificationId,
        priority: priority,
        status: 'PENDING'
      }, conn);

      await conn.commit();

      // Trigger async send
      setImmediate(async () => {
        const deliverConn = await CommunicationRepository.getConnection();
        try {
          await notificationEngine.deliverNotification(notificationId, deliverConn);
        } catch (err) {
          logger.error('Async send failed:', err);
        } finally {
          deliverConn.release();
        }
      });

      return { success: true, notificationId };
    } catch (error) {
      await conn.rollback();
      logger.error('CommunicationService.sendNotification Error:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async broadcastNotification(recipientType, channelType, subject, body) {
    const conn = await CommunicationRepository.getConnection();
    try {
      await conn.beginTransaction();

      // Find all target recipient IDs based on recipientType
      let query = '';
      if (recipientType === 'USER') {
        query = 'SELECT user_id as id FROM users WHERE status = ?';
      } else if (recipientType === 'RIDER') {
        query = 'SELECT rider_id as id FROM riders WHERE status = ?';
      } else if (recipientType === 'ADMIN') {
        query = "SELECT user_id as id FROM users WHERE user_type IN ('ADMIN', 'SUPER_ADMIN', 'BRANCH_ADMIN') AND status = ?";
      } else {
        throw new Error(`Unsupported broadcast target: ${recipientType}`);
      }

      const [recipients] = await conn.query(query, ['ACTIVE']);

      const notificationIds = [];
      for (const r of recipients) {
        const notificationId = await CommunicationRepository.createNotification({
          recipient_type: recipientType,
          recipient_id: r.id,
          channel_type: channelType,
          subject,
          body,
          status: 'QUEUED'
        }, conn);

        await CommunicationRepository.addNotificationToQueue({
          notification_id: notificationId,
          priority: 0,
          status: 'PENDING'
        }, conn);

        notificationIds.push(notificationId);
      }

      await CommunicationRepository.logCommunicationActivity(
        'ADMIN',
        0,
        'BROADCAST',
        `Broadcast sent to ${recipients.length} ${recipientType} recipients via ${channelType}`,
        conn
      );

      await conn.commit();

      // Trigger async batch deliver
      setImmediate(async () => {
        const deliverConn = await CommunicationRepository.getConnection();
        try {
          for (const nid of notificationIds) {
            await notificationEngine.deliverNotification(nid, deliverConn);
          }
        } catch (err) {
          logger.error('Async broadcast send failed:', err);
        } finally {
          deliverConn.release();
        }
      });

      return { success: true, count: recipients.length };
    } catch (error) {
      await conn.rollback();
      logger.error('CommunicationService.broadcastNotification Error:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async readNotification(id) {
    try {
      const conn = await CommunicationRepository.getConnection();
      try {
        // Schema A status ENUM doesn't have 'READ' — use 'SENT' as the delivered/read equivalent
        await conn.query("UPDATE notifications SET status = 'SENT', updated_at = NOW() WHERE notification_id = ?", [id]);
        return { success: true };
      } finally {
        conn.release();
      }
    } catch (error) {
      logger.error(`CommunicationService.readNotification Error (${id}):`, error);
      throw error;
    }
  }

  async deleteNotification(id) {
    try {
      return await CommunicationRepository.deleteNotification(id);
    } catch (error) {
      logger.error(`CommunicationService.deleteNotification Error (${id}):`, error);
      throw error;
    }
  }

  // ==================== TEMPLATES ====================

  async createTemplate(templateData) {
    try {
      return await CommunicationRepository.createTemplate(templateData);
    } catch (error) {
      logger.error('CommunicationService.createTemplate Error:', error);
      throw error;
    }
  }

  async getTemplates(filters) {
    try {
      return await CommunicationRepository.getTemplates(filters);
    } catch (error) {
      logger.error('CommunicationService.getTemplates Error:', error);
      throw error;
    }
  }

  async getTemplateById(id) {
    try {
      const template = await CommunicationRepository.findTemplateById(id);
      if (!template) {
        throw new Error('Template not found');
      }
      return template;
    } catch (error) {
      logger.error(`CommunicationService.getTemplateById Error (${id}):`, error);
      throw error;
    }
  }

  async updateTemplate(id, updateData) {
    try {
      const template = await CommunicationRepository.findTemplateById(id);
      if (!template) {
        throw new Error('Template not found');
      }
      return await CommunicationRepository.updateTemplate(id, updateData);
    } catch (error) {
      logger.error(`CommunicationService.updateTemplate Error (${id}):`, error);
      throw error;
    }
  }

  async deleteTemplate(id) {
    try {
      const template = await CommunicationRepository.findTemplateById(id);
      if (!template) {
        throw new Error('Template not found');
      }
      return await CommunicationRepository.deleteTemplate(id);
    } catch (error) {
      logger.error(`CommunicationService.deleteTemplate Error (${id}):`, error);
      throw error;
    }
  }

  // ==================== CAMPAIGNS ====================

  async createCampaign(campaignData) {
    const conn = await CommunicationRepository.getConnection();
    try {
      await conn.beginTransaction();

      const campaignId = await CommunicationRepository.createCampaign(campaignData, conn);

      await conn.commit();
      return { success: true, campaignId };
    } catch (error) {
      await conn.rollback();
      logger.error('CommunicationService.createCampaign Error:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async getCampaigns(filters) {
    try {
      return await CommunicationRepository.getCampaigns(filters);
    } catch (error) {
      logger.error('CommunicationService.getCampaigns Error:', error);
      throw error;
    }
  }

  async startCampaign(campaignId, adminId = 0) {
    const conn = await CommunicationRepository.getConnection();
    try {
      await conn.beginTransaction();

      const campaign = await CommunicationRepository.findCampaignById(campaignId, conn);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.status === 'RUNNING' || campaign.status === 'COMPLETED') {
        throw new Error(`Cannot start. Campaign is already ${campaign.status}`);
      }

      // Mark running
      await CommunicationRepository.updateCampaignStatus(campaignId, 'RUNNING', conn);

      // Retrieve template
      const template = await CommunicationRepository.findTemplateById(campaign.template_id, conn);
      if (!template) {
        throw new Error('Campaign template not found');
      }

      // Segment query conditions (audience selection)
      // E.g., send to users
      const [users] = await conn.query('SELECT user_id as id, full_name as name FROM users WHERE status = ?', ['ACTIVE']);

      const notificationIds = [];
      for (const u of users) {
        const body = notificationEngine.renderTemplate(template.body_template, { name: u.name });
        const subject = template.subject_template ? notificationEngine.renderTemplate(template.subject_template, { name: u.name }) : null;

        const nid = await CommunicationRepository.createNotification({
          recipient_type: 'USER',
          recipient_id: u.id,
          channel_type: template.channel_type,
          subject,
          body,
          status: 'QUEUED'
        }, conn);

        await CommunicationRepository.addNotificationToQueue({
          notification_id: nid,
          priority: 0,
          status: 'PENDING'
        }, conn);

        notificationIds.push(nid);
      }

      await CommunicationRepository.logCommunicationActivity(
        'ADMIN',
        adminId,
        'CAMPAIGN_STARTED',
        `Campaign ID ${campaignId} running. Sent ${users.length} notifications`,
        conn
      );

      await conn.commit();

      // Deliver campaign notifications async
      setImmediate(async () => {
        const deliverConn = await CommunicationRepository.getConnection();
        try {
          for (const nid of notificationIds) {
            await notificationEngine.deliverNotification(nid, deliverConn);
          }
          // Mark campaign completed
          await CommunicationRepository.updateCampaignStatus(campaignId, 'COMPLETED');
        } catch (err) {
          logger.error('Campaign delivery failed:', err);
        } finally {
          deliverConn.release();
        }
      });

      return { success: true, totalTarget: users.length };
    } catch (error) {
      await conn.rollback();
      logger.error(`CommunicationService.startCampaign Error (${campaignId}):`, error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async stopCampaign(campaignId, adminId = 0) {
    try {
      const campaign = await CommunicationRepository.findCampaignById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      await CommunicationRepository.updateCampaignStatus(campaignId, 'STOPPED');
      await CommunicationRepository.logCommunicationActivity(
        'ADMIN',
        adminId,
        'CAMPAIGN_STOPPED',
        `Campaign ID ${campaignId} stopped manually`
      );

      return { success: true };
    } catch (error) {
      logger.error(`CommunicationService.stopCampaign Error (${campaignId}):`, error);
      throw error;
    }
  }

  // ==================== USER PREFERENCES ====================

  async getPreferences(recipientType, recipientId) {
    try {
      return await CommunicationRepository.getPreferences(recipientType, recipientId);
    } catch (error) {
      logger.error('CommunicationService.getPreferences Error:', error);
      throw error;
    }
  }

  async updatePreferences(recipientType, recipientId, preferences) {
    const conn = await CommunicationRepository.getConnection();
    try {
      await conn.beginTransaction();

      for (const pref of preferences) {
        // Prevent disabling transactional preferences
        if (pref.category === 'TRANSACTIONAL' && pref.enabled === false) {
          throw new Error('Transactional notifications cannot be disabled for essential channel operations');
        }

        await CommunicationRepository.upsertPreference({
          recipient_type: recipientType,
          recipient_id: recipientId,
          channel_type: pref.channelType,
          category: pref.category,
          enabled: pref.enabled ? 1 : 0
        }, conn);
      }

      await conn.commit();
      return { success: true };
    } catch (error) {
      await conn.rollback();
      logger.error('CommunicationService.updatePreferences Error:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // ==================== OUTBOUND WEBHOOK DISPATCH ====================

  async postIncomingWebhookEvent(eventType, payload, signatureHeader) {
    const conn = await CommunicationRepository.getConnection();
    try {
      await conn.beginTransaction();

      // Verify signature (Mock check)
      if (signatureHeader && signatureHeader === 'invalid_signature') {
        throw new Error('Webhook signature verification failed');
      }

      const eventId = await CommunicationRepository.createWebhookEvent({
        event_type: eventType,
        payload
      }, conn);

      // Simulate sending webhooks to registered subscriber URLs
      const targetUrls = ['https://partner-portal.pravzo.com/webhooks/rentals'];
      for (const url of targetUrls) {
        await CommunicationRepository.createWebhookDelivery({
          event_id: eventId,
          target_url: url,
          response_status: 200,
          response_body: JSON.stringify({ success: true }),
          status: 'SUCCESS'
        }, conn);
      }

      await conn.commit();
      return { success: true, eventId };
    } catch (error) {
      await conn.rollback();
      logger.error('CommunicationService.postIncomingWebhookEvent Error:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async getWebhookLogs(limit) {
    try {
      return await CommunicationRepository.getWebhookLogs(limit);
    } catch (error) {
      logger.error('CommunicationService.getWebhookLogs Error:', error);
      throw error;
    }
  }

  // ==================== BACKGROUND QUEUE RUNNERS ====================

  async processNotificationQueue() {
    const conn = await CommunicationRepository.getConnection();
    try {
      const pendingItems = await CommunicationRepository.getPendingQueue(conn);

      for (const item of pendingItems) {
        // Mark queue processing
        await conn.query(
          "UPDATE notification_queue SET status = ? WHERE queue_id = ?",
          ['PROCESSING', item.queue_id]
        );

        const success = await notificationEngine.deliverNotification(item.notification_id, conn);

        if (success) {
          await conn.query(
            "UPDATE notification_queue SET status = ? WHERE queue_id = ?",
            ['COMPLETED', item.queue_id]
          );
        } else {
          await conn.query(
            "UPDATE notification_queue SET status = ? WHERE queue_id = ?",
            ['FAILED', item.queue_id]
          );
        }
      }
    } catch (err) {
      logger.error('[CommunicationService] Queue processor run failed:', err);
    } finally {
      conn.release();
    }
  }
}

module.exports = new CommunicationService();

