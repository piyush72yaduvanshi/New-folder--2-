class Admin {
  constructor(data) {
    this.admin_id = data.admin_id || data.user_id || null;
    this.user_id = this.admin_id;
    this.full_name = data.full_name || '';
    this.email = data.email || '';
    this.password = data.password || data.password_hash || '';
    this.password_hash = this.password;
    this.phone = data.phone || data.phone_number || null;
    this.phone_number = this.phone;
    this.role = data.role || data.user_type || 'ADMIN';
    this.user_type = this.role;
    this.status = data.status || 'ACTIVE';
    this.account_status = this.status;
    this.avatar_url = data.avatar_url || data.profile_photo || null;
    this.profile_photo = this.avatar_url;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.deleted_at = data.deleted_at || null;
  }

  // Sanitizes password for response
  toResponse() {
    const response = { ...this };
    delete response.password;
    delete response.password_hash;
    return response;
  }
}

module.exports = Admin;

