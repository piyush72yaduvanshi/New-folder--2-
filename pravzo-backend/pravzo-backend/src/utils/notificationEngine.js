'use strict';

const db = require('../config/db');
const logger = require('./logger');

class NotificationEngine {
  renderTemplate(template, variables = {}) {
    if (!template) return '';
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  async checkDeliveryPreference(recipientType, recipientId, channelType, category, conn = db) {
    if (category === 'TRANSACTIONAL') {
      return true;
    }
    return true; // Default to enabled
  }

  async deliverNotification(notificationId, conn = db) {
    const [rows] = await conn.query(
      'SELECT * FROM notifications WHERE notification_id = ?',
      [notificationId]
    );

    if (rows.length === 0) {
      throw new Error(`Notification not found for ID: ${notificationId}`);
    }

    const notification = rows[0];
    const channel = notification.channel || notification.channel_type || 'IN_APP';

    // Mark as SENDING
    await conn.query("UPDATE notifications SET status = 'SENDING', updated_at = NOW() WHERE notification_id = ?", [notificationId]);

    try {
      let deliveryRes;
      switch (String(channel).toUpperCase()) {
        case 'EMAIL':
          deliveryRes = await this.sendMockEmail(notification, conn);
          break;
        case 'SMS':
          deliveryRes = await this.sendMockSMS(notification, conn);
          break;
        case 'PUSH':
          deliveryRes = await this.sendMockPush(notification, conn);
          break;
        case 'WHATSAPP':
          deliveryRes = await this.sendMockWhatsApp(notification, conn);
          break;
        case 'IN_APP':
        default:
          deliveryRes = { success: true, status: 'DELIVERED', messageId: 'in_app_' + Date.now() };
          break;
      }

      if (deliveryRes.success) {
        await conn.query(
          "UPDATE notifications SET status = 'SENT', sent_at = NOW(), completed_at = NOW(), total_delivered = total_delivered + 1, updated_at = NOW() WHERE notification_id = ?",
          [notificationId]
        );

        await conn.query(
          `INSERT INTO notification_deliveries 
           (notification_id, recipient_type, recipient_id, delivery_status, channel, delivered_at, channel_response, created_at, updated_at)
           VALUES (?, ?, ?, 'DELIVERED', ?, NOW(), ?, NOW(), NOW())`,
          [
            notificationId,
            notification.recipient_type || 'USER',
            notification.created_by || 1,
            channel,
            JSON.stringify(deliveryRes)
          ]
        );
        return true;
      } else {
        throw new Error(deliveryRes.error || 'Gateway delivery failed');
      }
    } catch (err) {
      const newRetry = (notification.retry_count || 0) + 1;
      const status = newRetry >= (notification.max_retries || 3) ? 'FAILED' : 'SCHEDULED';
      
      await conn.query(
        "UPDATE notifications SET status = ?, retry_count = ?, last_retry_at = NOW(), total_failed = total_failed + 1, updated_at = NOW() WHERE notification_id = ?",
        [status, newRetry, notificationId]
      );

      await conn.query(
        `INSERT INTO notification_deliveries 
         (notification_id, recipient_type, recipient_id, delivery_status, channel, failed_at, error_message, created_at, updated_at)
         VALUES (?, ?, ?, 'FAILED', ?, NOW(), ?, NOW(), NOW())`,
        [
          notificationId,
          notification.recipient_type || 'USER',
          notification.created_by || 1,
          channel,
          err.message
        ]
      );
      return false;
    }
  }

  // --- MOCK ADAPTER SENDERS ---

  async sendMockEmail(notification, conn) {
    logger.info(`[NotificationEngine] Dispatching Email payload for notification ID ${notification.notification_id}`);
    const messageId = 'msg_email_' + Math.random().toString(36).substring(7);
    return { success: true, status: 'DELIVERED', messageId };
  }

  async sendMockSMS(notification, conn) {
    logger.info(`[NotificationEngine] Dispatching SMS payload for notification ID ${notification.notification_id}`);
    const gatewayResponse = 'sms_gw_' + Math.random().toString(36).substring(7);
    return { success: true, status: 'DELIVERED', gatewayResponse };
  }

  async sendMockPush(notification, conn) {
    logger.info(`[NotificationEngine] Dispatching Push notification payload for notification ID ${notification.notification_id}`);
    const deviceToken = 'token_' + Math.random().toString(36).substring(7);
    return { success: true, status: 'DELIVERED', deviceToken };
  }

  async sendMockWhatsApp(notification, conn) {
    logger.info(`[NotificationEngine] Dispatching WhatsApp payload for notification ID ${notification.notification_id}`);
    const messageSid = 'wa_sid_' + Math.random().toString(36).substring(7);
    return { success: true, status: 'DELIVERED', messageSid };
  }
}

module.exports = new NotificationEngine();
