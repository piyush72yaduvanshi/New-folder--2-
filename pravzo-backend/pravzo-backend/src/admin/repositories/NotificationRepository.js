const db = require('../../../src/config/db');

class NotificationRepository {
  // ==================== NOTIFICATION QUERIES ====================

  async findById(notificationId) {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE notification_id = ? AND deleted_at IS NULL',
      [notificationId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getNotifications(filters = {}, pagination = {}) {
    const {
      search = '',
      status = null,
      notificationType = null,
      recipientType = null,
      createdBy = null,
      startDate = null,
      endDate = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;


    const ALLOWED_SORT_FIELDS = new Set([
      'created_at', 'updated_at', 'title', 'status', 'notification_type', 'scheduled_at'
    ]);
    const ALLOWED_SORT_ORDERS = new Set(['ASC', 'DESC']);
    const safeSortBy    = ALLOWED_SORT_FIELDS.has(sortBy)     ? sortBy                       : 'created_at';
    const safeSortOrder = ALLOWED_SORT_ORDERS.has(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const {
      page = 1,
      limit = 20
    } = pagination;

    const offset = (page - 1) * limit;
    const conditions = ['n.deleted_at IS NULL'];
    const params = [];

    // Search
    if (search) {
      conditions.push('(n.title LIKE ? OR n.message LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Status filter
    if (status) {
      conditions.push('n.status = ?');
      params.push(status);
    }

    // Notification type filter
    if (notificationType) {
      conditions.push('n.notification_type = ?');
      params.push(notificationType);
    }

    // Recipient type filter
    if (recipientType) {
      conditions.push('n.recipient_type = ?');
      params.push(recipientType);
    }

    // Created by filter
    if (createdBy) {
      conditions.push('n.created_by = ?');
      params.push(createdBy);
    }

    // Date range filter
    if (startDate) {
      conditions.push('n.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('n.created_at <= ?');
      params.push(endDate);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM notifications n
      ${whereClause}
    `;
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT 
        n.*,
        a.full_name as created_by_name,
        a.email as created_by_email,
        t.template_name
      FROM notifications n
      LEFT JOIN users a ON n.created_by = a.user_id
      LEFT JOIN notification_templates t ON n.template_id = t.template_id
      ${whereClause}
      ORDER BY n.${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await db.query(dataQuery, [...params, parseInt(limit), parseInt(offset)]);

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

  async getNotificationDetails(notificationId) {
    const [rows] = await db.query(
      `SELECT 
        n.*,
        a.full_name as created_by_name,
        a.email as created_by_email,
        t.template_name,
        t.template_type as template_type
      FROM notifications n
      LEFT JOIN users a ON n.created_by = a.user_id
      LEFT JOIN notification_templates t ON n.template_id = t.template_id
      WHERE n.notification_id = ? AND n.deleted_at IS NULL`,
      [notificationId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async createNotification(notificationData) {
    const {
      title,
      message,
      notification_type,
      recipient_type,
      recipient_ids,
      recipient_count,
      filter_city,
      filter_vehicle_type,
      filter_user_group,
      status,
      channel,
      scheduled_at,
      template_id,
      priority,
      action_type,
      action_data,
      image_url,
      created_by
    } = notificationData;

    const [result] = await db.query(
      `INSERT INTO notifications 
       (title, message, notification_type, recipient_type, recipient_ids, recipient_count, 
        filter_city, filter_vehicle_type, filter_user_group, status, channel, scheduled_at, 
        template_id, priority, action_type, action_data, image_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        message,
        notification_type,
        recipient_type,
        recipient_ids,
        recipient_count,
        filter_city,
        filter_vehicle_type,
        filter_user_group,
        status,
        channel,
        scheduled_at,
        template_id,
        priority,
        action_type,
        action_data,
        image_url,
        created_by
      ]
    );

    return result.insertId;
  }

  async updateNotificationStatus(notificationId, status, updateData = {}) {
    const fields = ['status = ?'];
    const params = [status];

    if (updateData.sent_at) {
      fields.push('sent_at = ?');
      params.push(updateData.sent_at);
    }

    if (updateData.completed_at) {
      fields.push('completed_at = ?');
      params.push(updateData.completed_at);
    }

    if (updateData.total_sent !== undefined) {
      fields.push('total_sent = ?');
      params.push(updateData.total_sent);
    }

    if (updateData.total_delivered !== undefined) {
      fields.push('total_delivered = ?');
      params.push(updateData.total_delivered);
    }

    if (updateData.total_failed !== undefined) {
      fields.push('total_failed = ?');
      params.push(updateData.total_failed);
    }

    params.push(notificationId);

    const [result] = await db.query(
      `UPDATE notifications SET ${fields.join(', ')}, updated_at = NOW() WHERE notification_id = ?`,
      params
    );

    return result.affectedRows > 0;
  }

  async cancelScheduledNotification(notificationId) {
    const [result] = await db.query(
      `UPDATE notifications SET status = 'CANCELLED', updated_at = NOW() WHERE notification_id = ?`,
      [notificationId]
    );
    return result.affectedRows > 0;
  }

  async incrementRetryCount(notificationId) {
    const [result] = await db.query(
      `UPDATE notifications 
       SET retry_count = retry_count + 1, last_retry_at = NOW(), updated_at = NOW() 
       WHERE notification_id = ?`,
      [notificationId]
    );
    return result.affectedRows > 0;
  }

  async softDeleteNotification(notificationId) {
    const [result] = await db.query(
      'UPDATE notifications SET deleted_at = NOW() WHERE notification_id = ?',
      [notificationId]
    );
    return result.affectedRows > 0;
  }

  async getScheduledNotifications() {
    const [rows] = await db.query(
      `SELECT * FROM notifications 
       WHERE status = 'SCHEDULED' 
       AND scheduled_at <= NOW() 
       AND deleted_at IS NULL
       ORDER BY scheduled_at ASC`
    );
    return rows;
  }

  async getFailedNotifications(limit = 100) {
    const [rows] = await db.query(
      `SELECT * FROM notifications 
       WHERE status = 'FAILED' 
       AND retry_count < max_retries 
       AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT ?`,
      [parseInt(limit)]
    );
    return rows;
  }

  // ==================== NOTIFICATION DELIVERIES ====================

  async createDelivery(deliveryData) {
    const {
      notification_id,
      recipient_type,
      recipient_id,
      delivery_status,
      channel,
      device_token,
      device_type
    } = deliveryData;

    const [result] = await db.query(
      `INSERT INTO notification_deliveries 
       (notification_id, recipient_type, recipient_id, delivery_status, channel, device_token, device_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [notification_id, recipient_type, recipient_id, delivery_status, channel, device_token, device_type]
    );

    return result.insertId;
  }

  async updateDeliveryStatus(deliveryId, status, updateData = {}) {
    const fields = ['delivery_status = ?'];
    const params = [status];

    if (updateData.sent_at) {
      fields.push('sent_at = ?');
      params.push(updateData.sent_at);
    }

    if (updateData.delivered_at) {
      fields.push('delivered_at = ?');
      params.push(updateData.delivered_at);
    }

    if (updateData.read_at) {
      fields.push('read_at = ?');
      params.push(updateData.read_at);
    }

    if (updateData.failed_at) {
      fields.push('failed_at = ?');
      params.push(updateData.failed_at);
    }

    if (updateData.error_message) {
      fields.push('error_message = ?');
      params.push(updateData.error_message);
    }

    if (updateData.failure_reason) {
      fields.push('failure_reason = ?');
      params.push(updateData.failure_reason);
    }

    if (updateData.channel_response) {
      fields.push('channel_response = ?');
      params.push(updateData.channel_response);
    }

    params.push(deliveryId);

    const [result] = await db.query(
      `UPDATE notification_deliveries SET ${fields.join(', ')}, updated_at = NOW() WHERE delivery_id = ?`,
      params
    );

    return result.affectedRows > 0;
  }

  async getDeliveriesByNotification(notificationId, limit = 100) {
    const [rows] = await db.query(
      `SELECT * FROM notification_deliveries 
       WHERE notification_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [notificationId, parseInt(limit)]
    );
    return rows;
  }

  // ==================== STATISTICS ====================

  async getNotificationStatistics() {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_notifications,
        SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as total_sent,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as total_failed,
        SUM(CASE WHEN status = 'SCHEDULED' THEN 1 ELSE 0 END) as total_scheduled,
        SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as total_draft,
        SUM(CASE WHEN status = 'SENDING' THEN 1 ELSE 0 END) as total_pending,
        SUM(total_sent) as messages_sent,
        SUM(total_delivered) as messages_delivered,
        SUM(total_read) as messages_read,
        SUM(total_failed) as messages_failed,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_count,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) as monthly_count
       FROM notifications 
       WHERE deleted_at IS NULL`
    );

    const stats = rows[0];

    // Calculate success rate
    const successRate = stats.messages_sent > 0
      ? ((stats.messages_delivered / stats.messages_sent) * 100).toFixed(2)
      : 0;

    return {
      ...stats,
      success_rate: parseFloat(successRate)
    };
  }

  async getNotificationHistory(filters = {}, pagination = {}) {
    const {
      adminId = null,
      notificationType = null,
      startDate = null,
      endDate = null
    } = filters;

    const {
      page = 1,
      limit = 50
    } = pagination;

    const offset = (page - 1) * limit;
    const conditions = ['n.deleted_at IS NULL', 'n.status IN (\'SENT\', \'FAILED\')'];
    const params = [];

    if (adminId) {
      conditions.push('n.created_by = ?');
      params.push(adminId);
    }

    if (notificationType) {
      conditions.push('n.notification_type = ?');
      params.push(notificationType);
    }

    if (startDate) {
      conditions.push('n.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('n.created_at <= ?');
      params.push(endDate);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM notifications n ${whereClause}`;
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT 
        n.notification_id,
        n.title,
        n.message,
        n.notification_type,
        n.recipient_type,
        n.recipient_count,
        n.status,
        n.total_sent,
        n.total_delivered,
        n.total_read,
        n.total_failed,
        n.sent_at,
        n.created_at,
        a.full_name as created_by_name
      FROM notifications n
      LEFT JOIN users a ON n.created_by = a.user_id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await db.query(dataQuery, [...params, parseInt(limit), parseInt(offset)]);

    return {
      history: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // ==================== TEMPLATES ====================

  async getTemplates(filters = {}, pagination = {}) {
    const {
      templateType = null,
      category = null,
      isActive = null
    } = filters;

    const {
      page = 1,
      limit = 20
    } = pagination;

    const offset = (page - 1) * limit;
    const conditions = ['t.deleted_at IS NULL'];
    const params = [];

    if (templateType) {
      conditions.push('t.template_type = ?');
      params.push(templateType);
    }

    if (category) {
      conditions.push('t.category = ?');
      params.push(category);
    }

    if (isActive !== null) {
      conditions.push('t.is_active = ?');
      params.push(isActive ? 1 : 0);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM notification_templates t ${whereClause}`;
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT 
        t.*,
        a.full_name as created_by_name
      FROM notification_templates t
      LEFT JOIN users a ON t.created_by = a.user_id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await db.query(dataQuery, [...params, parseInt(limit), parseInt(offset)]);

    return {
      templates: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getTemplateById(templateId) {
    const [rows] = await db.query(
      `SELECT 
        t.*,
        a.full_name as created_by_name
      FROM notification_templates t
      LEFT JOIN users a ON t.created_by = a.user_id
      WHERE t.template_id = ? AND t.deleted_at IS NULL`,
      [templateId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getTemplateByName(templateName) {
    const [rows] = await db.query(
      'SELECT * FROM notification_templates WHERE template_name = ? AND deleted_at IS NULL',
      [templateName]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async createTemplate(templateData) {
    const {
      template_name,
      template_type,
      title,
      message,
      subject,
      html_content,
      sms_text,
      variables,
      category,
      created_by
    } = templateData;

    const [result] = await db.query(
      `INSERT INTO notification_templates 
       (template_name, template_type, title, message, subject, html_content, sms_text, variables, category, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [template_name, template_type, title, message, subject, html_content, sms_text, variables, category, created_by]
    );

    return result.insertId;
  }

  async updateTemplate(templateId, templateData) {
    const {
      title,
      message,
      subject,
      html_content,
      sms_text,
      variables,
      category,
      is_active
    } = templateData;

    const [result] = await db.query(
      `UPDATE notification_templates 
       SET title = ?, message = ?, subject = ?, html_content = ?, sms_text = ?, 
           variables = ?, category = ?, is_active = ?, updated_at = NOW()
       WHERE template_id = ? AND deleted_at IS NULL`,
      [title, message, subject, html_content, sms_text, variables, category, is_active, templateId]
    );

    return result.affectedRows > 0;
  }

  async softDeleteTemplate(templateId) {
    const [result] = await db.query(
      'UPDATE notification_templates SET deleted_at = NOW() WHERE template_id = ?',
      [templateId]
    );
    return result.affectedRows > 0;
  }

  // ==================== AUDIT LOGS ====================

  async createAuditLog(logData) {
    const {
      notification_id,
      action,
      description,
      recipient_count,
      performed_by,
      ip_address,
      user_agent
    } = logData;

    const [result] = await db.query(
      `INSERT INTO notification_audit_logs 
       (notification_id, action, description, recipient_count, performed_by, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [notification_id, action, description, recipient_count, performed_by, ip_address, user_agent]
    );

    return result.insertId;
  }

  async getAuditLogs(notificationId = null, limit = 100) {
    let query = `
      SELECT 
        l.*,
        a.full_name as performed_by_name
      FROM notification_audit_logs l
      LEFT JOIN users a ON l.performed_by = a.user_id
    `;

    const params = [];

    if (notificationId) {
      query += ' WHERE l.notification_id = ?';
      params.push(notificationId);
    }

    query += ' ORDER BY l.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await db.query(query, params);
    return rows;
  }

  // ==================== RECIPIENT QUERIES ====================

  async getUsersByIds(userIds) {
    if (!userIds || userIds.length === 0) return [];
    
    const placeholders = userIds.map(() => '?').join(',');
    const [rows] = await db.query(
      `SELECT u.user_id, u.full_name, u.phone as phone_number, u.email,
              ud.device_token, ud.device_type
       FROM users u
       LEFT JOIN user_devices ud ON u.user_id = ud.user_id AND ud.is_active = 1
       WHERE u.user_id IN (${placeholders}) AND u.deleted_at IS NULL`,
      userIds
    );
    return rows;
  }

  async getRidersByIds(riderIds) {
    if (!riderIds || riderIds.length === 0) return [];
    
    const placeholders = riderIds.map(() => '?').join(',');
    const [rows] = await db.query(
      `SELECT r.rider_id, r.user_id, u.full_name, u.phone as phone_number, u.email,
              ud.device_token, ud.device_type
       FROM riders r
       LEFT JOIN users u ON r.user_id = u.user_id
       LEFT JOIN user_devices ud ON u.user_id = ud.user_id AND ud.is_active = 1
       WHERE r.rider_id IN (${placeholders}) AND r.deleted_at IS NULL`,
      riderIds
    );
    return rows;
  }

  async getAllUsers() {
    const [rows] = await db.query(
      `SELECT u.user_id, u.full_name, u.phone as phone_number, u.email,
              ud.device_token, ud.device_type
       FROM users u
       LEFT JOIN user_devices ud ON u.user_id = ud.user_id AND ud.is_active = 1
       WHERE u.deleted_at IS NULL AND u.status = 'ACTIVE'`
    );
    return rows;
  }

  async getAllRiders() {
    const [rows] = await db.query(
      `SELECT r.rider_id, r.user_id, u.full_name, u.phone as phone_number, u.email,
              ud.device_token, ud.device_type
       FROM riders r
       LEFT JOIN users u ON r.user_id = u.user_id
       LEFT JOIN user_devices ud ON u.user_id = ud.user_id AND ud.is_active = 1
       WHERE r.deleted_at IS NULL AND r.status = 'ACTIVE'`
    );
    return rows;
  }

  async getAllAdmins() {
    const [rows] = await db.query(
      `SELECT u.user_id AS admin_id, u.user_id, u.full_name, u.phone AS phone_number, u.email,
              ud.device_token, ud.device_type
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN user_devices ud ON u.user_id = ud.user_id AND ud.is_active = 1
       WHERE r.role_name IN ('ADMIN','SUPER_ADMIN')
         AND u.deleted_at IS NULL AND u.status = 'ACTIVE'`
    );
    return rows;
  }

  async getUsersByCity(city) {
    const [rows] = await db.query(
      `SELECT u.user_id, u.full_name, u.phone as phone_number, u.email,
              ud.device_token, ud.device_type
       FROM users u
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       LEFT JOIN user_devices ud ON u.user_id = ud.user_id AND ud.is_active = 1
       WHERE (up.city = ? OR u.user_id IN (SELECT b.user_id FROM bookings b JOIN branches br ON b.vehicle_id = br.branch_id WHERE br.city = ?))
         AND u.deleted_at IS NULL AND u.status = 'ACTIVE'`,
      [city, city]
    );
    return rows;
  }

  async getRidersByCity(city) {
    const [rows] = await db.query(
      `SELECT 
        r.rider_id, 
        r.user_id,
        u.full_name, 
        u.phone as phone_number, 
        u.email,
        ud.device_token,
        ud.device_type
       FROM riders r
       LEFT JOIN users u ON r.user_id = u.user_id
       LEFT JOIN user_devices ud ON u.user_id = ud.user_id AND ud.is_active = 1
       WHERE r.assigned_city = ? AND r.deleted_at IS NULL AND r.status = 'ACTIVE'`,
      [city]
    );
    return rows;
  }

  async getRidersByVehicleType(vehicleType) {
    const [rows] = await db.query(
      `SELECT DISTINCT 
        r.rider_id, 
        r.user_id,
        u.full_name, 
        u.phone as phone_number, 
        u.email,
        ud.device_token,
        ud.device_type
       FROM riders r
       LEFT JOIN users u ON r.user_id = u.user_id
       INNER JOIN vehicle_assignments va ON r.rider_id = va.rider_id AND va.status = 'ACTIVE'
       INNER JOIN vehicles v ON va.vehicle_id = v.vehicle_id
       LEFT JOIN user_devices ud ON u.user_id = ud.user_id AND ud.is_active = 1
       WHERE v.vehicle_type = ? 
       AND r.deleted_at IS NULL 
       AND r.status = 'ACTIVE'`,
      [vehicleType]
    );
    return rows;
  }
}

module.exports = new NotificationRepository();


