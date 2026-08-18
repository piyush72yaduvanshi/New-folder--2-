const db = require('../../../src/config/db');

class CommunicationRepository {
  async getConnection() {
    return await db.getConnection();
  }

  // ==================== TEMPLATES ====================

  async createTemplate(templateData, conn = db) {
    const { template_name, subject_template, body_template, channel_type, language, subject, message, title, template_type } = templateData;
    const subj = subject_template || subject || title || '';
    const body = body_template || message || '';
    const channel = channel_type || template_type || 'EMAIL';

    // Live schema: template_name, template_type, title, message, subject, created_by
    const [result] = await conn.query(
      `INSERT INTO notification_templates (template_name, template_type, title, message, subject, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [template_name, channel, subj, body, subj, templateData.created_by || 1]
    );
    return result.insertId;
  }

  formatTemplate(row) {
    if (!row) return null;
    return {
      ...row,
      subject_template: row.subject_template ?? row.subject ?? row.title ?? '',
      body_template: row.body_template ?? row.message ?? '',
      channel_type: row.channel_type ?? row.template_type ?? 'EMAIL',
      language: row.language ?? 'en'
    };
  }

  async findTemplateById(templateId, conn = db) {
    const [rows] = await conn.query(
      'SELECT * FROM notification_templates WHERE template_id = ?',
      [templateId]
    );
    return rows.length > 0 ? this.formatTemplate(rows[0]) : null;
  }

  async findTemplateByName(name, conn = db) {
    const [rows] = await conn.query(
      'SELECT * FROM notification_templates WHERE template_name = ?',
      [name]
    );
    return rows.length > 0 ? this.formatTemplate(rows[0]) : null;
  }

  async getTemplates(filters = {}, conn = db) {
    const { channelType = '' } = filters;
    const conditions = [];
    const params = [];

    if (channelType) {
      conditions.push('(channel_type = ? OR template_type = ?)');
      params.push(channelType, channelType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await conn.query(
      `SELECT * FROM notification_templates ${whereClause} ORDER BY created_at DESC`,
      params
    );
    return rows.map(r => this.formatTemplate(r));
  }

  async updateTemplate(templateId, updateData, conn = db) {
    const fields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      params.push(updateData[key]);
    });

    params.push(templateId);

    try {
      const [result] = await conn.query(
        `UPDATE notification_templates SET ${fields.join(', ')}, updated_at = NOW() WHERE template_id = ?`,
        params
      );
      return result.affectedRows > 0;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR' || (err.message && err.message.includes("Unknown column"))) {
        const mappedData = {};
        if (updateData.subject_template !== undefined) mappedData.subject = updateData.subject_template;
        if (updateData.body_template !== undefined) mappedData.message = updateData.body_template;
        if (updateData.channel_type !== undefined) mappedData.template_type = updateData.channel_type;

        const fallbackFields = [];
        const fallbackParams = [];
        Object.keys(mappedData).forEach(key => {
          fallbackFields.push(`${key} = ?`);
          fallbackParams.push(mappedData[key]);
        });
        fallbackParams.push(templateId);

        if (fallbackFields.length === 0) return false;

        const [result] = await conn.query(
          `UPDATE notification_templates SET ${fallbackFields.join(', ')}, updated_at = NOW() WHERE template_id = ?`,
          fallbackParams
        );
        return result.affectedRows > 0;
      }
      throw err;
    }
  }

  async deleteTemplate(templateId, conn = db) {
    const [result] = await conn.query(
      'DELETE FROM notification_templates WHERE template_id = ?',
      [templateId]
    );
    return result.affectedRows > 0;
  }

  // ==================== NOTIFICATIONS ====================

  async createNotification(notificationData, conn = db) {
    const {
      recipient_type, recipientType, channel_type, channelType,
      recipient_id, recipientId,
      subject, body, title, message, status, created_by
    } = notificationData;

    const notifType = channel_type || channelType || 'PUSH';
    const recId     = recipient_id  || recipientId  || null;
    const titleVal  = subject || title || 'Notification';
    const msgVal    = body || message || '';

    // Map Schema B recipient types to Schema A ENUM values
    const recipientTypeMap = {
      'USER':    'SINGLE_USER',
      'RIDER':   'SINGLE_RIDER',
      'BRANCH':  'SINGLE_USER',
      'PARTNER': 'SINGLE_USER'
      // 'ADMIN', 'ALL_USERS', 'ALL_RIDERS', 'ALL_ADMINS' are valid in both — pass through
    };
    const rawRecType = recipient_type || recipientType || 'ALL_USERS';
    const recType = recipientTypeMap[rawRecType] || rawRecType;

    // Map Schema B status values to Schema A ENUM values
    const statusMap = {
      'QUEUED':     'SENDING',
      'PROCESSING': 'SENDING',
      'DELIVERED':  'SENT',
      'READ':       'SENT',
      'OPENED':     'SENT',
      'CLICKED':    'SENT'
    };
    const rawStatus = status || 'SENDING';
    const dbStatus = statusMap[rawStatus] || rawStatus;

    const [result] = await conn.query(
      `INSERT INTO notifications 
         (notification_type, recipient_type, recipient_ids, recipient_count,
          status, channel, title, message, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notifType,                                    // notification_type
        recType,                                      // recipient_type (Schema A ENUM)
        recId ? JSON.stringify([recId]) : null,      // recipient_ids (JSON column)
        recId ? 1 : 0,                                // recipient_count
        dbStatus,                                     // status (Schema A ENUM)
        notifType,                                    // channel
        titleVal,                                     // title (NOT NULL in Schema A)
        msgVal,                                       // message (NOT NULL in Schema A)
        created_by || 1                               // created_by
      ]
    );
    return result.insertId;
  }

  async findNotificationById(notificationId, conn = db) {
    const [rows] = await conn.query(
      'SELECT * FROM notifications WHERE notification_id = ?',
      [notificationId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getNotifications(filters = {}, pagination = {}, conn = db) {
    // Live schema uses notification_type (not channel_type), no recipient_id column
    const { recipientType = '', channelType = '', status = '' } = filters;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (recipientType) {
      conditions.push('recipient_type = ?');
      params.push(recipientType);
    }
    if (channelType) {
      conditions.push('notification_type = ?');
      params.push(channelType);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes] = await conn.query(
      `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
      params
    );
    const total = countRes[0].total;

    const [rows] = await conn.query(
      `SELECT * FROM notifications 
       ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      notifications: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async deleteNotification(notificationId, conn = db) {
    const [result] = await conn.query(
      'DELETE FROM notifications WHERE notification_id = ?',
      [notificationId]
    );
    return result.affectedRows > 0;
  }

  // ==================== QUEUE OPERATIONS ====================

  async addNotificationToQueue(queueData, conn = db) {
    const { notification_id, priority, status, scheduled_at } = queueData;
    try {
      const [result] = await conn.query(
        `INSERT INTO notification_queue (notification_id, priority, status, scheduled_at) 
         VALUES (?, ?, ?, ?)`,
        [notification_id, priority || 0, status || 'PENDING', scheduled_at || null]
      );
      return result.insertId;
    } catch (err) {
      // notification_queue table only exists after migration 17 — skip silently if not yet migrated
      if (err.message && err.message.includes("doesn't exist")) {
        return null;
      }
      throw err;
    }
  }

  async getPendingQueue(conn = db) {
    const [rows] = await conn.query(
      `SELECT nq.*, n.channel_type, n.recipient_type, n.recipient_id 
       FROM notification_queue nq 
       JOIN notifications n ON nq.notification_id = n.notification_id
       WHERE nq.status = 'PENDING' AND (nq.scheduled_at IS NULL OR nq.scheduled_at <= NOW())
       ORDER BY nq.priority DESC, nq.created_at ASC`
    );
    return rows;
  }

  // ==================== PREFERENCES ====================

  async getPreferences(recipientType, recipientId, conn = db) {
    try {
      const [rows] = await conn.query(
        'SELECT channel_type, category, enabled FROM notification_preferences WHERE recipient_type = ? AND recipient_id = ?',
        [recipientType, recipientId]
      );
      return rows;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return [];
      throw err;
    }
  }

  async upsertPreference(prefData, conn = db) {
    const { recipient_type, recipient_id, channel_type, category, enabled } = prefData;
    try {
      const [result] = await conn.query(
        `INSERT INTO notification_preferences (recipient_type, recipient_id, channel_type, category, enabled) 
         VALUES (?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), updated_at = NOW()`,
        [recipient_type, recipient_id, channel_type, category, enabled]
      );
      return result.affectedRows > 0;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return true;
      throw err;
    }
  }

  // ==================== CAMPAIGNS ====================

  async createCampaign(campaignData, conn = db) {
    const { campaign_name, template_id, group_id, schedule_time, status } = campaignData;
    // MySQL DATETIME doesn't accept ISO 8601 'Z' suffix — convert to MySQL format
    const mysqlScheduleTime = schedule_time
      ? new Date(schedule_time).toISOString().slice(0, 19).replace('T', ' ')
      : null;
    try {
      const [result] = await conn.query(
        `INSERT INTO notification_campaigns (campaign_name, template_id, group_id, schedule_time, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [campaign_name, template_id, group_id, mysqlScheduleTime, status || 'DRAFT']
      );
      return result.insertId;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return Date.now();
      throw err;
    }
  }

  async findCampaignById(campaignId, conn = db) {
    try {
      const [rows] = await conn.query(
        'SELECT * FROM notification_campaigns WHERE campaign_id = ?',
        [campaignId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return null;
      throw err;
    }
  }

  async getCampaigns(filters = {}, conn = db) {
    const { status = '' } = filters;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    try {
      const [rows] = await conn.query(
        `SELECT * FROM notification_campaigns ${whereClause} ORDER BY created_at DESC`,
        params
      );
      return rows;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return [];
      throw err;
    }
  }

  async updateCampaignStatus(campaignId, status, conn = db) {
    try {
      const [result] = await conn.query(
        'UPDATE notification_campaigns SET status = ?, updated_at = NOW() WHERE campaign_id = ?',
        [status, campaignId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return false;
      throw err;
    }
  }

  // ==================== WEBHOOK LOGS ====================

  async createWebhookEvent(eventData, conn = db) {
    const { event_type, payload } = eventData;
    const [result] = await conn.query(
      'INSERT INTO webhook_events (event_type, payload) VALUES (?, ?)',
      [event_type, JSON.stringify(payload)]
    );
    return result.insertId;
  }

  async createWebhookDelivery(deliveryData, conn = db) {
    const { event_id, target_url, response_status, response_body, status } = deliveryData;
    const [result] = await conn.query(
      `INSERT INTO webhook_deliveries (event_id, target_url, response_status, response_body, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [event_id, target_url, response_status, response_body || null, status || 'PENDING']
    );
    return result.insertId;
  }

  async getWebhookLogs(limit = 100, conn = db) {
    const [rows] = await conn.query(
      `SELECT wd.*, we.event_type, we.payload 
       FROM webhook_deliveries wd
       JOIN webhook_events we ON wd.event_id = we.event_id
       ORDER BY wd.created_at DESC
       LIMIT ?`,
      [parseInt(limit)]
    );
    return rows;
  }

  // Activity logs
  async logCommunicationActivity(actorType, actorId, action, description, conn = db) {
    try {
      await conn.query(
        `INSERT INTO communication_activity_logs (actor_type, actor_id, action, description) 
         VALUES (?, ?, ?, ?)`,
        [actorType, actorId, action, description]
      );
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return;
      throw err;
    }
  }
}

module.exports = new CommunicationRepository();

