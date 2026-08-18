const db = require('../../../src/config/db');
const RefreshToken = require('../models/RefreshToken');

class RefreshTokenRepository {
  async create(tokenFields) {
    const fields = { ...tokenFields };
    if (fields.admin_id && !fields.user_id) {
      fields.user_id = fields.admin_id;
      delete fields.admin_id;
    }
    const [result] = await db.query('INSERT INTO refresh_tokens SET ?', fields);
    return result.insertId;
  }

  async findByToken(refreshToken) {
    const [rows] = await db.query(
      'SELECT * FROM refresh_tokens WHERE refresh_token = ?',
      [refreshToken]
    );
    if (rows.length === 0) return null;
    return new RefreshToken(rows[0]);
  }

  async findByAdminId(adminId) {
    const [rows] = await db.query(
      'SELECT * FROM refresh_tokens WHERE user_id = ? ORDER BY created_at DESC',
      [adminId]
    );
    return rows.map(row => new RefreshToken(row));
  }

  async delete(tokenId) {
    const [result] = await db.query('DELETE FROM refresh_tokens WHERE token_id = ?', [tokenId]);
    return result.affectedRows > 0;
  }

  async deleteByToken(refreshToken) {
    const [result] = await db.query('DELETE FROM refresh_tokens WHERE refresh_token = ?', [refreshToken]);
    return result.affectedRows > 0;
  }

  async deleteByAdminId(adminId) {
    const [result] = await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [adminId]);
    return result.affectedRows > 0;
  }

  async deleteExpired() {
    const [result] = await db.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
    return result.affectedRows;
  }
}

module.exports = new RefreshTokenRepository();

