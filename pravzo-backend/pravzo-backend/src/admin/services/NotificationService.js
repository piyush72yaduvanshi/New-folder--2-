const NotificationRepository = require('../repositories/NotificationRepository');
const logger = require('../../../src/utils/logger');

class NotificationService {
  // ==================== NOTIFICATION METHODS ====================

  // Get notifications list
  async getNotifications(filters, pagination) {
    try {
      const result = await NotificationRepository.getNotifications(filters, pagination);
      
      // Format response data
      result.notifications = result.notifications.map(notification => ({
        notificationId: notification.notification_id,
        title: notification.title,
        message: notification.message,
        notificationType: notification.notification_type,
        recipientType: notification.recipient_type,
        recipientCount: notification.recipient_count,
        status: notification.status,
        tracking: {
          totalSent: notification.total_sent,
          totalDelivered: notification.total_delivered,
          totalRead: notification.total_read,
          totalFailed: notification.total_failed
        },
        channel: notification.channel,
        priority: notification.priority,
        scheduledAt: notification.scheduled_at,
        sentAt: notification.sent_at,
        completedAt: notification.completed_at,
        template: notification.template_name ? {
          templateId: notification.template_id,
          templateName: notification.template_name
        } : null,
        createdBy: {
          adminId: notification.created_by,
          name: notification.created_by_name,
          email: notification.created_by_email
        },
        createdAt: notification.created_at,
        updatedAt: notification.updated_at
      }));

      return result;
    } catch (error) {
      logger.error('NotificationService - Get Notifications Error:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  // Get notification by ID
  async getNotificationById(notificationId) {
    try {
      const notification = await NotificationRepository.getNotificationDetails(notificationId);

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Get delivery details
      const deliveries = await NotificationRepository.getDeliveriesByNotification(notificationId, 50);

      return {
        notificationInfo: {
          notificationId: notification.notification_id,
          title: notification.title,
          message: notification.message,
          notificationType: notification.notification_type,
          status: notification.status,
          priority: notification.priority,
          channel: notification.channel,
          createdAt: notification.created_at,
          updatedAt: notification.updated_at
        },
        recipient: {
          type: notification.recipient_type,
          ids: notification.recipient_ids,
          count: notification.recipient_count
        },
        filters: notification.filter_city || notification.filter_vehicle_type || notification.filter_user_group ? {
          city: notification.filter_city,
          vehicleType: notification.filter_vehicle_type,
          userGroup: notification.filter_user_group
        } : null,
        tracking: {
          totalSent: notification.total_sent,
          totalDelivered: notification.total_delivered,
          totalRead: notification.total_read,
          totalFailed: notification.total_failed,
          retryCount: notification.retry_count,
          maxRetries: notification.max_retries,
          lastRetryAt: notification.last_retry_at
        },
        schedule: notification.scheduled_at ? {
          scheduledAt: notification.scheduled_at,
          sentAt: notification.sent_at,
          completedAt: notification.completed_at
        } : null,
        template: notification.template_id ? {
          templateId: notification.template_id,
          templateName: notification.template_name,
          templateType: notification.template_type
        } : null,
        action: notification.action_type ? {
          type: notification.action_type,
          data: notification.action_data,
          imageUrl: notification.image_url
        } : null,
        createdBy: {
          adminId: notification.created_by,
          name: notification.created_by_name,
          email: notification.created_by_email
        },
        deliveries: deliveries.map(d => ({
          deliveryId: d.delivery_id,
          recipientType: d.recipient_type,
          recipientId: d.recipient_id,
          status: d.delivery_status,
          sentAt: d.sent_at,
          deliveredAt: d.delivered_at,
          readAt: d.read_at,
          failedAt: d.failed_at,
          errorMessage: d.error_message,
          failureReason: d.failure_reason
        }))
      };
    } catch (error) {
      logger.error('NotificationService - Get Notification By ID Error:', error);
      if (error.message === 'Notification not found') {
        throw error;
      }
      throw new Error('Failed to fetch notification details');
    }
  }

  // Send notification instantly
  async sendNotification(notificationData, adminId, requestInfo) {
    try {
      // Get recipients based on type
      const recipients = await this.getRecipients(notificationData);

      if (recipients.length === 0) {
        throw new Error('No recipients found for the specified criteria');
      }

      // Create notification record
      const notificationPayload = {
        title: notificationData.title,
        message: notificationData.message,
        notification_type: notificationData.notification_type || 'PUSH',
        recipient_type: notificationData.recipient_type,
        recipient_ids: notificationData.recipient_ids ? notificationData.recipient_ids.join(',') : null,
        recipient_count: recipients.length,
        filter_city: notificationData.filter_city || null,
        filter_vehicle_type: notificationData.filter_vehicle_type || null,
        filter_user_group: notificationData.filter_user_group || null,
        status: 'SENDING',
        channel: notificationData.channel || 'Firebase',
        scheduled_at: null,
        template_id: notificationData.template_id || null,
        priority: notificationData.priority || 'MEDIUM',
        action_type: notificationData.action_type || null,
        action_data: notificationData.action_data ? JSON.stringify(notificationData.action_data) : null,
        image_url: notificationData.image_url || null,
        created_by: adminId
      };

      const notificationId = await NotificationRepository.createNotification(notificationPayload);

      // Create audit log
      await NotificationRepository.createAuditLog({
        notification_id: notificationId,
        action: 'CREATED',
        description: `Notification created and sent to ${recipients.length} recipients`,
        recipient_count: recipients.length,
        performed_by: adminId,
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      // Send notifications (in real implementation, this would call notification service)
      await this.processNotificationSending(notificationId, recipients, notificationData);

      logger.info('Notification sent successfully', {
        notificationId,
        recipientCount: recipients.length,
        adminId
      });

      return {
        notificationId,
        recipientCount: recipients.length,
        status: 'SENDING'
      };
    } catch (error) {
      logger.error('NotificationService - Send Notification Error:', error);
      throw error;
    }
  }

  // Broadcast notification
  async broadcastNotification(broadcastData, adminId, requestInfo) {
    try {
      // Validate broadcast type
      const validBroadcastTypes = [
        'ALL_USERS',
        'ALL_RIDERS',
        'ALL_ADMINS',
        'CITY',
        'VEHICLE_TYPE',
        'USER_GROUP'
      ];

      if (!validBroadcastTypes.includes(broadcastData.broadcast_to)) {
        throw new Error('Invalid broadcast type');
      }

      // Prepare notification data
      const notificationData = {
        title: broadcastData.title,
        message: broadcastData.message,
        notification_type: broadcastData.notification_type || 'PUSH',
        recipient_type: broadcastData.broadcast_to,
        channel: broadcastData.channel || 'Firebase',
        priority: broadcastData.priority || 'MEDIUM',
        action_type: broadcastData.action_type || null,
        action_data: broadcastData.action_data || null,
        image_url: broadcastData.image_url || null,
        filter_city: broadcastData.filter_city || null,
        filter_vehicle_type: broadcastData.filter_vehicle_type || null,
        filter_user_group: broadcastData.filter_user_group || null
      };

      // Send using existing method
      return await this.sendNotification(notificationData, adminId, requestInfo);
    } catch (error) {
      logger.error('NotificationService - Broadcast Notification Error:', error);
      throw error;
    }
  }

  // Schedule notification
  async scheduleNotification(scheduleData, adminId, requestInfo) {
    try {
      const scheduledAt = new Date(scheduleData.scheduled_at);
      const now = new Date();

      if (scheduledAt <= now) {
        throw new Error('Scheduled time must be in the future');
      }

      // Get recipients
      const recipients = await this.getRecipients(scheduleData);

      if (recipients.length === 0) {
        throw new Error('No recipients found for the specified criteria');
      }

      // Create scheduled notification
      const notificationPayload = {
        title: scheduleData.title,
        message: scheduleData.message,
        notification_type: scheduleData.notification_type || 'PUSH',
        recipient_type: scheduleData.recipient_type,
        recipient_ids: scheduleData.recipient_ids ? scheduleData.recipient_ids.join(',') : null,
        recipient_count: recipients.length,
        filter_city: scheduleData.filter_city || null,
        filter_vehicle_type: scheduleData.filter_vehicle_type || null,
        filter_user_group: scheduleData.filter_user_group || null,
        status: 'SCHEDULED',
        channel: scheduleData.channel || 'Firebase',
        scheduled_at: scheduleData.scheduled_at,
        template_id: scheduleData.template_id || null,
        priority: scheduleData.priority || 'MEDIUM',
        action_type: scheduleData.action_type || null,
        action_data: scheduleData.action_data ? JSON.stringify(scheduleData.action_data) : null,
        image_url: scheduleData.image_url || null,
        created_by: adminId
      };

      const notificationId = await NotificationRepository.createNotification(notificationPayload);

      // Create audit log
      await NotificationRepository.createAuditLog({
        notification_id: notificationId,
        action: 'SCHEDULED',
        description: `Notification scheduled for ${scheduleData.scheduled_at}`,
        recipient_count: recipients.length,
        performed_by: adminId,
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      logger.info('Notification scheduled successfully', {
        notificationId,
        scheduledAt: scheduleData.scheduled_at,
        adminId
      });

      return {
        notificationId,
        recipientCount: recipients.length,
        scheduledAt: scheduleData.scheduled_at,
        status: 'SCHEDULED'
      };
    } catch (error) {
      logger.error('NotificationService - Schedule Notification Error:', error);
      throw error;
    }
  }

  // Cancel scheduled notification
  async cancelScheduledNotification(notificationId, adminId, requestInfo) {
    try {
      const notification = await NotificationRepository.findById(notificationId);

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.status !== 'SCHEDULED') {
        throw new Error('Only scheduled notifications can be cancelled');
      }

      await NotificationRepository.cancelScheduledNotification(notificationId);

      // Create audit log
      await NotificationRepository.createAuditLog({
        notification_id: notificationId,
        action: 'CANCELLED',
        description: 'Scheduled notification cancelled',
        recipient_count: 0,
        performed_by: adminId,
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      logger.info('Scheduled notification cancelled', {
        notificationId,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('NotificationService - Cancel Scheduled Notification Error:', error);
      throw error;
    }
  }

  // Resend notification
  async resendNotification(notificationId, adminId, requestInfo) {
    try {
      const notification = await NotificationRepository.findById(notificationId);

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.status !== 'FAILED') {
        throw new Error('Only failed notifications can be resent');
      }

      if (notification.retry_count >= notification.max_retries) {
        throw new Error('Maximum retry attempts reached');
      }

      // Increment retry count
      await NotificationRepository.incrementRetryCount(notificationId);

      // Update status to sending
      const { formatMySQLDate } = require('../../../src/utils/helpers');
      await NotificationRepository.updateNotificationStatus(notificationId, 'SENDING', {
        sent_at: formatMySQLDate()
      });

      // Create audit log
      await NotificationRepository.createAuditLog({
        notification_id: notificationId,
        action: 'RETRIED',
        description: `Notification retry attempt ${notification.retry_count + 1}`,
        recipient_count: notification.recipient_count,
        performed_by: adminId,
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      // Get recipients and resend
      const recipientIds = notification.recipient_ids ? notification.recipient_ids.split(',').map(Number) : [];
      const recipients = await this.getRecipientsFromIds(notification.recipient_type, recipientIds);

      await this.processNotificationSending(notificationId, recipients, notification);

      logger.info('Notification resent successfully', {
        notificationId,
        retryCount: notification.retry_count + 1,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('NotificationService - Resend Notification Error:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, adminId, requestInfo) {
    try {
      const notification = await NotificationRepository.findById(notificationId);

      if (!notification) {
        throw new Error('Notification not found');
      }

      await NotificationRepository.softDeleteNotification(notificationId);

      logger.info('Notification deleted', {
        notificationId,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('NotificationService - Delete Notification Error:', error);
      throw error;
    }
  }

  // Get notification history
  async getNotificationHistory(filters, pagination) {
    try {
      const result = await NotificationRepository.getNotificationHistory(filters, pagination);
      
      return result;
    } catch (error) {
      logger.error('NotificationService - Get Notification History Error:', error);
      throw new Error('Failed to fetch notification history');
    }
  }

  // Get notification statistics
  async getNotificationStatistics() {
    try {
      const stats = await NotificationRepository.getNotificationStatistics();

      return {
        overview: {
          totalNotifications: stats.total_notifications,
          totalSent: stats.total_sent,
          totalFailed: stats.total_failed,
          totalScheduled: stats.total_scheduled,
          totalDraft: stats.total_draft,
          totalPending: stats.total_pending
        },
        messages: {
          sent: stats.messages_sent,
          delivered: stats.messages_delivered,
          read: stats.messages_read,
          failed: stats.messages_failed
        },
        metrics: {
          successRate: parseFloat(stats.success_rate || 0),
          todayCount: stats.today_count,
          monthlyCount: stats.monthly_count
        }
      };
    } catch (error) {
      logger.error('NotificationService - Get Statistics Error:', error);
      throw new Error('Failed to fetch notification statistics');
    }
  }

  // ==================== TEMPLATE METHODS ====================

  // Get templates
  async getTemplates(filters, pagination) {
    try {
      const result = await NotificationRepository.getTemplates(filters, pagination);
      
      result.templates = result.templates.map(template => ({
        templateId: template.template_id,
        templateName: template.template_name,
        templateType: template.template_type,
        title: template.title,
        message: template.message,
        subject: template.subject,
        category: template.category,
        variables: (() => {
          if (!template.variables) return [];
          try {
            return typeof template.variables === 'string' && template.variables.trim().startsWith('[')
              ? JSON.parse(template.variables)
              : String(template.variables).split(',').map(s => s.trim()).filter(Boolean);
          } catch (e) {
            return String(template.variables).split(',').map(s => s.trim()).filter(Boolean);
          }
        })(),
        isActive: template.is_active === 1,
        createdBy: {
          adminId: template.created_by,
          name: template.created_by_name
        },
        createdAt: template.created_at,
        updatedAt: template.updated_at
      }));

      return result;
    } catch (error) {
      logger.error('NotificationService - Get Templates Error:', error);
      throw new Error('Failed to fetch templates');
    }
  }

  // Create template
  async createTemplate(templateData, adminId) {
    try {
      // Check if template name exists
      const existing = await NotificationRepository.getTemplateByName(templateData.template_name);
      if (existing) {
        throw new Error('Template name already exists');
      }

      const templatePayload = {
        template_name: templateData.template_name,
        template_type: templateData.template_type,
        title: templateData.title,
        message: templateData.message,
        subject: templateData.subject || null,
        html_content: templateData.html_content || null,
        sms_text: templateData.sms_text || null,
        variables: templateData.variables ? JSON.stringify(templateData.variables) : null,
        category: templateData.category || null,
        created_by: adminId
      };

      const templateId = await NotificationRepository.createTemplate(templatePayload);

      logger.info('Template created successfully', {
        templateId,
        templateName: templateData.template_name,
        adminId
      });

      return templateId;
    } catch (error) {
      logger.error('NotificationService - Create Template Error:', error);
      throw error;
    }
  }

  // Update template
  async updateTemplate(templateId, templateData, adminId) {
    try {
      const template = await NotificationRepository.getTemplateById(templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      const updatePayload = {
        title: templateData.title,
        message: templateData.message,
        subject: templateData.subject || null,
        html_content: templateData.html_content || null,
        sms_text: templateData.sms_text || null,
        variables: templateData.variables ? JSON.stringify(templateData.variables) : null,
        category: templateData.category || null,
        is_active: templateData.is_active !== undefined ? templateData.is_active : 1
      };

      await NotificationRepository.updateTemplate(templateId, updatePayload);

      logger.info('Template updated successfully', {
        templateId,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('NotificationService - Update Template Error:', error);
      throw error;
    }
  }

  // Delete template
  async deleteTemplate(templateId, adminId) {
    try {
      const template = await NotificationRepository.getTemplateById(templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      await NotificationRepository.softDeleteTemplate(templateId);

      logger.info('Template deleted', {
        templateId,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('NotificationService - Delete Template Error:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  // Get recipients based on notification data
  async getRecipients(notificationData) {
    const recipientType = notificationData.recipient_type;

    switch (recipientType) {
      case 'SINGLE_USER':
        return await NotificationRepository.getUsersByIds([notificationData.recipient_id]);
      
      case 'MULTIPLE_USERS':
        return await NotificationRepository.getUsersByIds(notificationData.recipient_ids);
      
      case 'SINGLE_RIDER':
        return await NotificationRepository.getRidersByIds([notificationData.recipient_id]);
      
      case 'MULTIPLE_RIDERS':
        return await NotificationRepository.getRidersByIds(notificationData.recipient_ids);
      
      case 'ADMIN':
        return await NotificationRepository.getAllAdmins();
      
      case 'ALL_USERS':
        return await NotificationRepository.getAllUsers();
      
      case 'ALL_RIDERS':
        return await NotificationRepository.getAllRiders();
      
      case 'ALL_ADMINS':
        return await NotificationRepository.getAllAdmins();
      
      case 'CITY':
        if (notificationData.filter_city) {
          const users = await NotificationRepository.getUsersByCity(notificationData.filter_city);
          const riders = await NotificationRepository.getRidersByCity(notificationData.filter_city);
          return [...users, ...riders];
        }
        return [];
      
      case 'VEHICLE_TYPE':
        if (notificationData.filter_vehicle_type) {
          return await NotificationRepository.getRidersByVehicleType(notificationData.filter_vehicle_type);
        }
        return [];
      
      default:
        throw new Error('Invalid recipient type');
    }
  }

  // Get recipients from IDs
  async getRecipientsFromIds(recipientType, ids) {
    if (recipientType.includes('USER')) {
      return await NotificationRepository.getUsersByIds(ids);
    } else if (recipientType.includes('RIDER')) {
      return await NotificationRepository.getRidersByIds(ids);
    }
    return [];
  }

  // Process notification sending
  async processNotificationSending(notificationId, recipients, notificationData) {
    const { formatMySQLDate } = require('../../../src/utils/helpers');
    const sentAt = formatMySQLDate();

    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        // Determine recipient type and ID
        let recipientType, recipientId, deviceToken;
        
        if (recipient.user_id) {
          recipientType = 'USER';
          recipientId = recipient.user_id;
          deviceToken = recipient.fcm_token;
        } else if (recipient.rider_id) {
          recipientType = 'RIDER';
          recipientId = recipient.rider_id;
          deviceToken = recipient.fcm_token;
        } else if (recipient.admin_id) {
          recipientType = 'ADMIN';
          recipientId = recipient.admin_id;
          deviceToken = null;
        }

        // Create delivery record
        const deliveryId = await NotificationRepository.createDelivery({
          notification_id: notificationId,
          recipient_type: recipientType,
          recipient_id: recipientId,
          delivery_status: 'PENDING',
          channel: notificationData.channel || 'Firebase',
          device_token: deviceToken,
          device_type: recipient.device_type
        });

        // In real implementation, call notification service (Firebase, Email, SMS, etc.)
        // For now, simulate success
        const sendSuccess = true; // Replace with actual sending logic

        if (sendSuccess) {
          await NotificationRepository.updateDeliveryStatus(deliveryId, 'DELIVERED', {
            sent_at: sentAt,
            delivered_at: sentAt
          });
          sentCount++;
          deliveredCount++;
        } else {
          await NotificationRepository.updateDeliveryStatus(deliveryId, 'FAILED', {
            failed_at: sentAt,
            error_message: 'Delivery failed',
            failure_reason: 'Service unavailable'
          });
          failedCount++;
        }
      } catch (error) {
        logger.error('Error sending notification to recipient:', error);
        failedCount++;
      }
    }

    // Update notification tracking
    const completedAt = formatMySQLDate();
    const status = failedCount === recipients.length ? 'FAILED' : 'SENT';

    await NotificationRepository.updateNotificationStatus(notificationId, status, {
      sent_at: sentAt,
      completed_at: completedAt,
      total_sent: sentCount,
      total_delivered: deliveredCount,
      total_failed: failedCount
    });
  }
}

module.exports = new NotificationService();

