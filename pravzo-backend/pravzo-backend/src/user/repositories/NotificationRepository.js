const db = require("../../../src/config/db");
const Notification = require("../models/Notification");

// User app notifications are stored in user_notifications to avoid
// conflict with admin backend's notifications table (completely different schema).
const TABLE = "user_notifications";

class NotificationRepository {
  async findById(notificationId) {
    const [rows] = await db.query(
      `SELECT * FROM ${TABLE} WHERE notification_id = ?`,
      [notificationId],
    );
    if (rows.length === 0) return null;
    return new Notification(rows[0]);
  }

  async findByUserId(userId) {
    const [rows] = await db.query(
      `SELECT * FROM ${TABLE} WHERE user_id = ? ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map((row) => new Notification(row));
  }

  async create(notificationFields) {
    const [result] = await db.query(
      `INSERT INTO ${TABLE} SET ?`,
      notificationFields,
    );
    return result.insertId;
  }

  async markAsRead(notificationId) {
    const [result] = await db.query(
      `UPDATE ${TABLE} SET is_read = TRUE, read_at = NOW(), updated_at = NOW() WHERE notification_id = ?`,
      [notificationId],
    );
    return result.affectedRows > 0;
  }

  async markAllAsReadByUserId(userId) {
    const [result] = await db.query(
      `UPDATE ${TABLE} SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
       WHERE user_id = ? AND is_read = FALSE`,
      [userId],
    );
    return result.affectedRows;
  }

  async getUnreadCount(userId) {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM ${TABLE} WHERE user_id = ? AND is_read = FALSE`,
      [userId],
    );
    return rows[0].count;
  }
}

module.exports = new NotificationRepository();
