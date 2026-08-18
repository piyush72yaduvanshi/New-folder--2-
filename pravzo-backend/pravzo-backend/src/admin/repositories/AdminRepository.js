const db = require('../../../src/config/db');
const Admin = require('../models/Admin');

class AdminRepository {
  async findById(adminId) {
    const [rows] = await db.query(
      `SELECT u.user_id AS admin_id, u.user_id, u.full_name, u.email,
              u.phone AS phone_number, u.phone,
              u.hashed_password AS password_hash, u.hashed_password AS password,
              r.role_name AS role, r.role_name AS user_type,
              u.status, u.created_at, u.updated_at, u.deleted_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ? AND u.deleted_at IS NULL`,
      [adminId]
    );
    if (rows.length === 0) return null;
    return new Admin(rows[0]);
  }

  async findByEmail(email) {
    const [rows] = await db.query(
      `SELECT u.user_id AS admin_id, u.user_id, u.full_name, u.email,
              u.phone AS phone_number, u.phone,
              u.hashed_password AS password_hash, u.hashed_password AS password,
              r.role_name AS role, r.role_name AS user_type,
              u.status, u.created_at, u.updated_at, u.deleted_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE u.email = ? AND u.deleted_at IS NULL`,
      [email]
    );
    if (rows.length === 0) return null;
    return new Admin(rows[0]);
  }

  async create(adminFields) {
    const fields = { ...adminFields };
    // Map legacy field names to final schema column names
    if (fields.password_hash) { fields.hashed_password = fields.password_hash; delete fields.password_hash; }
    if (fields.password)       { fields.hashed_password = fields.password;      delete fields.password; }
    if (fields.phone_number)   { fields.phone = fields.phone_number;             delete fields.phone_number; }
    if (fields.role || fields.user_type) {
      // Map role name to role_id
      const roleName = fields.role || fields.user_type;
      const roleMap = { SUPER_ADMIN:1, ADMIN:2, BRANCH_ADMIN:3, CUSTOMER:4, RIDER:5, SUPERVISOR:6, DISPATCHER:8, FINANCE:9 };
      fields.role_id = roleMap[roleName] || 2;
      delete fields.role; delete fields.user_type;
    }
    delete fields.admin_id;
    delete fields.department;
    delete fields.account_status;
    delete fields.last_login_at;
    delete fields.last_login;
    // Strip any columns that don't exist in final schema
    const VALID_COLS = ['role_id','branch_id','first_name','last_name','email','phone','country_code',
      'hashed_password','profile_image','status','is_email_verified','is_phone_verified','referral_code','created_at','updated_at'];
    for (const k of Object.keys(fields)) { if (!VALID_COLS.includes(k)) delete fields[k]; }

    const [result] = await db.query('INSERT INTO users SET ?', fields);
    return result.insertId;
  }

  async update(adminId, adminFields) {
    const fields = { ...adminFields };
    if (fields.password_hash) { fields.hashed_password = fields.password_hash; delete fields.password_hash; }
    if (fields.password)       { fields.hashed_password = fields.password;      delete fields.password; }
    if (fields.phone_number)   { fields.phone = fields.phone_number;             delete fields.phone_number; }
    if (fields.role || fields.user_type) {
      const roleName = fields.role || fields.user_type;
      const roleMap = { SUPER_ADMIN:1, ADMIN:2, BRANCH_ADMIN:3, CUSTOMER:4, RIDER:5, SUPERVISOR:6, DISPATCHER:8, FINANCE:9 };
      fields.role_id = roleMap[roleName] || 2;
      delete fields.role; delete fields.user_type;
    }
    delete fields.admin_id; delete fields.department; delete fields.account_status;
    const VALID_COLS = ['role_id','branch_id','first_name','last_name','email','phone','country_code',
      'hashed_password','profile_image','status','is_email_verified','is_phone_verified','updated_at'];
    for (const k of Object.keys(fields)) { if (!VALID_COLS.includes(k)) delete fields[k]; }

    const [result] = await db.query(
      'UPDATE users SET ? WHERE user_id = ? AND deleted_at IS NULL',
      [fields, adminId]
    );
    return result.affectedRows > 0;
  }

  async updateLastLogin(adminId, lastLogin) {
    await db.query(
      'UPDATE users SET last_login_at = ?, updated_at = NOW() WHERE user_id = ? AND deleted_at IS NULL',
      [lastLogin || new Date(), adminId]
    );
    return true;
  }

  async updatePassword(adminId, hashedPassword, updatedAt) {
    const [result] = await db.query(
      'UPDATE users SET hashed_password = ?, updated_at = ? WHERE user_id = ? AND deleted_at IS NULL',
      [hashedPassword, updatedAt || new Date(), adminId]
    );
    return result.affectedRows > 0;
  }

  async delete(adminId) {
    const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [adminId]);
    return result.affectedRows > 0;
  }
}

module.exports = new AdminRepository();

