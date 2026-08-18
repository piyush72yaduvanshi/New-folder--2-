const db = require('../../../src/config/db');

class AdminManagementRepository {
  // ==================== ADMIN QUERIES ====================

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
    return rows.length > 0 ? rows[0] : null;
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
    return rows.length > 0 ? rows[0] : null;
  }

  async countActiveSuperAdmins() {
    const [[{ count }]] = await db.query(
      `SELECT COUNT(*) AS count FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE r.role_name = 'SUPER_ADMIN' AND u.status = 'ACTIVE' AND u.deleted_at IS NULL`
    );
    return parseInt(count) || 0;
  }

  async getAdmins(filters = {}, pagination = {}) {
    const {
      search = '',
      role = null,
      status = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    const ALLOWED_SORT_FIELDS = new Set(['created_at','updated_at','full_name','email','status']);
    const ALLOWED_SORT_ORDERS = new Set(['ASC', 'DESC']);
    const safeSortBy    = ALLOWED_SORT_FIELDS.has(sortBy) ? `u.${sortBy}` : 'u.created_at';
    const safeSortOrder = ALLOWED_SORT_ORDERS.has(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    const conditions = [
      "u.deleted_at IS NULL",
      "r.role_name IN ('ADMIN','SUPER_ADMIN','BRANCH_ADMIN','SUPERVISOR','DISPATCHER','FINANCE')"
    ];
    const params = [];

    if (search) {
      conditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      const sp = `%${search}%`;
      params.push(sp, sp, sp);
    }
    if (role)   { conditions.push('r.role_name = ?'); params.push(role); }
    if (status) { conditions.push('u.status = ?');    params.push(status); }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM users u LEFT JOIN roles r ON u.role_id = r.role_id ${whereClause}`, params
    );
    const total = countResult[0].total;

    const [rows] = await db.query(
      `SELECT
        u.user_id AS admin_id, u.user_id, u.full_name, u.email,
        u.phone AS phone_number, u.phone,
        r.role_name AS role, r.role_name AS user_type,
        u.status, u.created_at, u.updated_at,
        u.profile_image AS profile_photo,
        u.last_login_at AS last_login,
        NULL AS department, u.branch_id,
        NULL AS branch_name, NULL AS created_by_name, NULL AS created_by_email
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      users: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    };
  }

  async getAdminDetails(adminId) {
    const [rows] = await db.query(
      `SELECT
        u.user_id AS admin_id, u.user_id, u.full_name, u.email,
        u.phone AS phone_number, u.phone,
        r.role_name AS role, r.role_name AS user_type,
        u.status, u.created_at, u.updated_at,
        u.profile_image AS profile_photo,
        u.last_login_at AS last_login,
        NULL AS department, u.branch_id,
        NULL AS branch_name, NULL AS created_by_name, NULL AS created_by_email, NULL AS created_by_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ? AND u.deleted_at IS NULL`,
      [adminId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async createAdmin(adminData) {
    const { full_name, email, phone_number, phone, password_hash, password, role } = adminData;
    const roleMap = { SUPER_ADMIN:1, ADMIN:2, BRANCH_ADMIN:3, CUSTOMER:4, RIDER:5, SUPERVISOR:6, DISPATCHER:8, FINANCE:9 };
    const roleName = role || 'ADMIN';
    const roleId = roleMap[roleName] || 2;
    const hashed = password || password_hash;
    const [result] = await db.query(
      `INSERT INTO users (first_name, email, phone, hashed_password, role_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE', NOW(), NOW())`,
      [full_name, email, phone || phone_number, hashed, roleId]
    );
    return result.insertId;
  }

  async updateAdmin(adminId, updateData) {
    const { full_name, phone_number, phone, role } = updateData;
    const roleMap = { SUPER_ADMIN:1, ADMIN:2, BRANCH_ADMIN:3, CUSTOMER:4, RIDER:5, SUPERVISOR:6, DISPATCHER:8, FINANCE:9 };
    const roleId = roleMap[role] || 2;
    const [result] = await db.query(
      `UPDATE users SET first_name = ?, phone = ?, role_id = ?, updated_at = NOW()
       WHERE user_id = ? AND deleted_at IS NULL`,
      [full_name, phone || phone_number, roleId, adminId]
    );
    return result.affectedRows > 0;
  }

  async updateAdminStatus(adminId, status) {
    const [result] = await db.query(
      `UPDATE users SET status = ?, updated_at = NOW() WHERE user_id = ? AND deleted_at IS NULL`,
      [status, adminId]
    );
    return result.affectedRows > 0;
  }

  async updateAdminPassword(adminId, password_hash) {
    const [result] = await db.query(
      `UPDATE users SET hashed_password = ?, updated_at = NOW() WHERE user_id = ? AND deleted_at IS NULL`,
      [password_hash, adminId]
    );
    return result.affectedRows > 0;
  }

  async softDeleteAdmin(adminId) {
    const [result] = await db.query(
      `UPDATE users SET deleted_at = NOW(), status = 'INACTIVE', updated_at = NOW() WHERE user_id = ?`,
      [adminId]
    );
    return result.affectedRows > 0;
  }

  async hardDeleteAdmin(adminId) {
    const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [adminId]);
    return result.affectedRows > 0;
  }

  // ==================== ACTIVITY LOG QUERIES ====================

  async createActivityLog(logData) {
    const { admin_id, user_id, action, details, ip_address, user_agent } = logData;
    try {
      const [result] = await db.query(
        `INSERT INTO activity_logs (user_id, action, module, description, ip_address, user_agent, created_at)
         VALUES (?, ?, 'ADMIN_MANAGEMENT', ?, ?, ?, NOW())`,
        [user_id || admin_id, action, details, ip_address, user_agent]
      );
      return result.insertId;
    } catch (e) {
      return null;
    }
  }

  async getActivityLogs(adminId, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    try {
      const [countResult] = await db.query(
        'SELECT COUNT(*) as total FROM activity_logs WHERE user_id = ?',
        [adminId]
      );
      const total = countResult[0].total;

      const [rows] = await db.query(
        `SELECT log_id, action, module, description, ip_address, user_agent, created_at
         FROM activity_logs
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [adminId, parseInt(limit), parseInt(offset)]
      );

      return {
        logs: rows,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
      };
    } catch (e) {
      return { logs: [], pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 } };
    }
  }

  // ==================== STATISTICS QUERIES ====================

  async getAdminStatistics() {
    const [rows] = await db.query(
      `SELECT
        COUNT(*) as total_admins,
        SUM(CASE WHEN u.status = 'ACTIVE'    THEN 1 ELSE 0 END) as active_admins,
        SUM(CASE WHEN u.status = 'SUSPENDED' THEN 1 ELSE 0 END) as blocked_admins,
        SUM(CASE WHEN u.status = 'INACTIVE'  THEN 1 ELSE 0 END) as inactive_admins,
        SUM(CASE WHEN u.status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended_admins,
        SUM(CASE WHEN r.role_name = 'SUPER_ADMIN' THEN 1 ELSE 0 END) as super_admins,
        SUM(CASE WHEN DATE(u.created_at) = CURDATE() THEN 1 ELSE 0 END) as today_registrations,
        SUM(CASE WHEN MONTH(u.created_at) = MONTH(CURDATE()) AND YEAR(u.created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) as monthly_registrations
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE r.role_name IN ('ADMIN','SUPER_ADMIN','BRANCH_ADMIN','SUPERVISOR','DISPATCHER','FINANCE')
         AND u.deleted_at IS NULL`
    );
    return rows[0] || { total_admins:0, active_admins:0, blocked_admins:0, inactive_admins:0, suspended_admins:0, super_admins:0, today_registrations:0, monthly_registrations:0 };
  }

  // ==================== BRANCH ASSIGNMENT QUERIES ====================

  async getActiveAssignment(adminId) {
    const [rows] = await db.query(
      `SELECT id AS assignment_id, branch_id, user_id AS admin_id, assigned_by, assigned_at, status AS assignment_status
       FROM branch_users 
       WHERE user_id = ? AND status = 'ACTIVE' 
       ORDER BY assigned_at DESC LIMIT 1`,
      [adminId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getActiveBranchAdmin(branchId) {
    const [rows] = await db.query(
      `SELECT id AS assignment_id, branch_id, user_id AS admin_id, assigned_by, assigned_at, status AS assignment_status
       FROM branch_users 
       WHERE branch_id = ? AND status = 'ACTIVE' 
       ORDER BY assigned_at DESC LIMIT 1`,
      [branchId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async createBranchAssignment(assignmentData) {
    const { admin_id, user_id, branch_id, assigned_by } = assignmentData;
    
    const [result] = await db.query(
      `INSERT INTO branch_users (user_id, branch_id, status, assigned_at, assigned_by)
       VALUES (?, ?, 'ACTIVE', NOW(), ?)
       ON DUPLICATE KEY UPDATE status = 'ACTIVE', assigned_at = NOW(), assigned_by = VALUES(assigned_by)`,
      [user_id || admin_id, branch_id, assigned_by]
    );

    return result.insertId;
  }

  async closeAssignment(assignmentId, unassignedBy, status = 'INACTIVE') {
    const [result] = await db.query(
      `UPDATE branch_users SET status = ? WHERE id = ?`,
      [status, assignmentId]
    );
    return result.affectedRows > 0;
  }

  async transferAssignment(assignmentId, transferData) {
    const [result] = await db.query(
      `UPDATE branch_users SET status = 'TRANSFERRED' WHERE id = ?`,
      [assignmentId]
    );
    return result.affectedRows > 0;
  }

  async updateAdminCurrentBranch(adminId, branchId) {
    return true;
  }

  async getAssignmentHistory(adminId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM branch_users WHERE user_id = ?',
      [adminId]
    );
    const total = countResult[0].total;

    const [rows] = await db.query(
      `SELECT 
        bu.id AS assignment_id,
        bu.branch_id,
        bu.user_id AS admin_id,
        bu.assigned_at,
        bu.status AS assignment_status,
        b.branch_name,
        b.city,
        b.state,
        assigner.full_name as assigned_by_name
      FROM branch_users bu
      LEFT JOIN branches b ON bu.branch_id = b.branch_id
      LEFT JOIN users assigner ON bu.assigned_by = assigner.user_id
      WHERE bu.user_id = ?
      ORDER BY bu.assigned_at DESC
      LIMIT ? OFFSET ?`,
      [adminId, parseInt(limit), parseInt(offset)]
    );

    return {
      assignments: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // ==================== LOGIN HISTORY QUERIES ====================

  async createLoginHistory(loginData) {
    const { admin_id, user_id, login_status, ip_address, user_agent } = loginData;
    const [result] = await db.query(
      `INSERT INTO login_history (user_id, login_status, ip_address, user_agent, login_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [user_id || admin_id, login_status || 'SUCCESS', ip_address, user_agent]
    );
    return result.insertId;
  }

  async updateLogoutTime(loginId, sessionDuration) {
    const [result] = await db.query(
      `UPDATE login_history SET logout_at = NOW(), session_duration = ? WHERE login_id = ?`,
      [sessionDuration || null, loginId]
    );
    return result.affectedRows > 0;
  }

  async getLoginHistory(adminId, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM login_history WHERE user_id = ?', [adminId]
    );
    const total = countResult[0].total;
    const [rows] = await db.query(
      `SELECT login_id, login_status, ip_address, user_agent, login_at, logout_at, session_duration
       FROM login_history WHERE user_id = ?
       ORDER BY login_at DESC LIMIT ? OFFSET ?`,
      [adminId, parseInt(limit), parseInt(offset)]
    );
    return { history: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } };
  }

  // ==================== PASSWORD HISTORY QUERIES ====================

  async savePasswordHistory(passwordData) {
    const { admin_id, user_id, password_hash, changed_by } = passwordData;
    
    const [result] = await db.query(
      `INSERT INTO password_history (user_id, password_hash, changed_by, created_at)
       VALUES (?, ?, ?, NOW())`,
      [user_id || admin_id, password_hash, changed_by]
    );

    return result.insertId;
  }

  async getLastPasswords(adminId, count = 5) {
    const [rows] = await db.query(
      `SELECT password_hash, created_at AS changed_at 
       FROM password_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [adminId, count]
    );

    return rows;
  }

  async updatePasswordChangeFlag(adminId, forceChange) {
    return true;
  }

  // ==================== PERMISSIONS QUERIES ====================

  async getPermissions(adminId) {
    const [rows] = await db.query(
      `SELECT p.permission_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       JOIN role_permissions rp ON r.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.permission_id
       WHERE u.user_id = ?`,
      [adminId]
    );
    const permissionsObj = {};
    rows.forEach(r => { permissionsObj[r.permission_name] = true; });
    return permissionsObj;
  }

  async createDefaultPermissions(adminId, role, grantedBy) {
    return 1;
  }

  async updatePermissions(adminId, permissions, grantedBy) {
    return true;
  }

  // ==================== SESSION QUERIES ====================

  async createSession(sessionData) {
    const {
      session_id, admin_id, user_id, access_token_jti, refresh_token_jti,
      ip_address, user_agent, device_fingerprint, expires_at
    } = sessionData;
    
    const [result] = await db.query(
      `INSERT INTO sessions 
       (session_id, user_id, access_token_jti, refresh_token_jti, ip_address, 
        user_agent, device_fingerprint, expires_at, created_at, last_activity_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [session_id, user_id || admin_id, access_token_jti, refresh_token_jti, 
       ip_address, user_agent, device_fingerprint, expires_at]
    );

    return result.affectedRows > 0;
  }

  async getActiveSessions(adminId) {
    const [rows] = await db.query(
      `SELECT * FROM sessions 
       WHERE user_id = ? AND session_status = 'ACTIVE' AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY last_activity_at DESC`,
      [adminId]
    );

    return rows;
  }

  async revokeSession(sessionId) {
    const [result] = await db.query(
      `UPDATE sessions 
       SET session_status = 'REVOKED', revoked_at = NOW()
       WHERE session_id = ?`,
      [sessionId]
    );

    return result.affectedRows > 0;
  }

  async revokeAllSessions(adminId, exceptSessionId = null) {
    let query = `UPDATE sessions 
                 SET session_status = 'REVOKED', revoked_at = NOW()
                 WHERE user_id = ? AND session_status = 'ACTIVE'`;
    const params = [adminId];

    if (exceptSessionId) {
      query += ' AND session_id != ?';
      params.push(exceptSessionId);
    }

    const [result] = await db.query(query, params);

    return result.affectedRows;
  }

  // ==================== DEVICE QUERIES ====================

  async registerDevice(deviceData) {
    const {
      admin_id, user_id, device_fingerprint, device_name, device_type,
      browser, operating_system, last_ip_address
    } = deviceData;
    
    const [result] = await db.query(
      `INSERT INTO user_devices 
       (user_id, device_fingerprint, device_name, device_type, browser, operating_system,
        last_ip_address, last_login_at, login_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 1)
       ON DUPLICATE KEY UPDATE
       last_ip_address = VALUES(last_ip_address),
       last_login_at = NOW(),
       login_count = login_count + 1`,
      [user_id || admin_id, device_fingerprint, device_name, device_type, 
       browser, operating_system, last_ip_address]
    );

    return result.insertId || result.affectedRows;
  }

  async trustDevice(adminId, deviceFingerprint) {
    const [result] = await db.query(
      `UPDATE user_devices 
       SET is_trusted = TRUE
       WHERE user_id = ? AND device_fingerprint = ?`,
      [adminId, deviceFingerprint]
    );

    return result.affectedRows > 0;
  }

  async getDevices(adminId) {
    const [rows] = await db.query(
      `SELECT * FROM user_devices 
       WHERE user_id = ? AND is_active = TRUE
       ORDER BY last_login_at DESC`,
      [adminId]
    );

    return rows;
  }

  // ==================== ENHANCED ACTIVITY LOG QUERIES ====================

  async createEnhancedActivityLog(logData) {
    const {
      admin_id, user_id, action, module, entity_type, entity_id, description,
      old_value, new_value, changes, ip_address, user_agent, request_method, request_url
    } = logData;
    
    const [result] = await db.query(
      `INSERT INTO activity_logs 
       (user_id, action, module, entity_type, entity_id, description, old_value, new_value,
        metadata, ip_address, user_agent, request_method, request_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [user_id || admin_id, action, module || 'ADMIN_MANAGEMENT', entity_type, entity_id, description,
       old_value, new_value, changes ? JSON.stringify(changes) : null,
       ip_address, user_agent, request_method, request_url]
    );

    return result.insertId;
  }

  async updateFailedLoginAttempts(adminId, increment = true) {
    return true;
  }

  async lockAccount(adminId, lockUntil) {
    const [result] = await db.query(
      `UPDATE users SET status = 'SUSPENDED' WHERE user_id = ?`,
      [adminId]
    );
    return result.affectedRows > 0;
  }

  async unlockAccount(adminId) {
    const [result] = await db.query(
      `UPDATE users SET status = 'ACTIVE' WHERE user_id = ?`,
      [adminId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = new AdminManagementRepository();
