class RefreshToken {
  constructor(data) {
    this.token_id = data.token_id || null;
    this.user_id = data.user_id || data.admin_id || null;
    this.admin_id = this.user_id;
    this.refresh_token = data.refresh_token || '';
    this.expires_at = data.expires_at || null;
    this.is_revoked = data.is_revoked || 0;
    this.created_at = data.created_at || null;
  }
}

module.exports = RefreshToken;

