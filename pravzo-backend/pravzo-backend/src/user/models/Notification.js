class Notification {
  constructor(data) {
    this.notification_id = data.notification_id || null;
    this.user_id = data.user_id || null;
    this.title = data.title || '';
    this.message = data.message || '';
    this.type = data.type || 'INFO';
    this.route_target = data.route_target || null;
    this.is_read = data.is_read === true || data.is_read === 1 || data.is_read === '1';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }
}

module.exports = Notification;
