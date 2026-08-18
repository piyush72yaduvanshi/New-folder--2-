'use strict';

const db = require('../../../src/config/db');

class BranchRepository {
  // ==================== BRANCH QUERIES ====================

  async findById(branchId) {
    const [rows] = await db.query(
      'SELECT * FROM branches WHERE branch_id = ? AND deleted_at IS NULL',
      [branchId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByBranchCode(branchCode) {
    const [rows] = await db.query(
      'SELECT * FROM branches WHERE branch_code = ? AND deleted_at IS NULL',
      [branchCode]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByEmail(email) {
    const [rows] = await db.query(
      'SELECT * FROM branches WHERE email = ? AND deleted_at IS NULL',
      [email]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByPhone(phoneNumber) {
    const [rows] = await db.query(
      'SELECT * FROM branches WHERE phone_number = ? AND deleted_at IS NULL',
      [phoneNumber]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByName(branchName) {
    const [rows] = await db.query(
      'SELECT * FROM branches WHERE branch_name = ? AND deleted_at IS NULL',
      [branchName]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getBranches(filters = {}, pagination = {}) {
    const {
      search = '',
      status = null,
      city = null,
      state = null,
      branchType = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    // SECURITY: Whitelist sortBy/sortOrder — interpolated directly into SQL ORDER BY
    const ALLOWED_SORT_FIELDS = new Set([
      'created_at', 'updated_at', 'branch_name', 'city', 'branch_status', 'state'
    ]);
    const ALLOWED_SORT_ORDERS = new Set(['ASC', 'DESC']);
    const safeSortBy    = ALLOWED_SORT_FIELDS.has(sortBy)     ? sortBy                       : 'created_at';
    const safeSortOrder = ALLOWED_SORT_ORDERS.has(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const {
      page = 1,
      limit = 20
    } = pagination;

    const offset = (page - 1) * limit;
    const conditions = ['b.deleted_at IS NULL'];
    const params = [];

    // Search
    if (search) {
      conditions.push('(b.branch_name LIKE ? OR b.branch_code LIKE ? OR b.email LIKE ? OR b.phone_number LIKE ? OR b.city LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Status filter
    if (status) {
      conditions.push('b.branch_status = ?');
      params.push(status);
    }

    // City filter
    if (city) {
      conditions.push('b.city = ?');
      params.push(city);
    }

    // State filter
    if (state) {
      conditions.push('b.state = ?');
      params.push(state);
    }

    // Branch type filter
    if (branchType) {
      conditions.push('b.branch_type = ?');
      params.push(branchType);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM branches b ${whereClause}`;
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // Get paginated data with admin JOIN + revenue/bookings aggregations
    const dataQuery = `
      SELECT 
        b.branch_id,
        b.branch_name,
        b.branch_code,
        b.branch_type,
        b.branch_status,
        b.address_line1,
        b.address_line2,
        b.city,
        b.state,
        b.country,
        b.pin_code,
        b.latitude,
        b.longitude,
        b.email,
        b.phone_number,
        b.alternate_phone,
        b.gst_number,
        b.pan_number,
        b.opening_date,
        b.admin_id AS manager_id,
        b.admin_id,
        b.employee_count,
        b.service_radius_km,
        b.created_at,
        b.updated_at,
        admin.full_name as manager_name,
        admin.email as manager_email,
        admin.phone as manager_phone,
        admin.full_name as admin_name,
        admin.email as admin_email,
        admin.phone as admin_phone,
        creator.full_name as created_by_name,
        COALESCE(
          (SELECT SUM(rt.fare_amount)
           FROM rider_trips rt
           JOIN riders r ON rt.rider_id = r.rider_id
           WHERE (r.branch_id = b.branch_id OR r.assigned_city = b.city)
             AND rt.status = 'COMPLETED'
             AND MONTH(rt.created_at) = MONTH(CURDATE())
             AND YEAR(rt.created_at)  = YEAR(CURDATE())),
          0
        ) AS monthly_revenue,
        COALESCE(
          (SELECT COUNT(*)
           FROM rider_trips rt
           JOIN riders r ON rt.rider_id = r.rider_id
           WHERE (r.branch_id = b.branch_id OR r.assigned_city = b.city)
             AND MONTH(rt.created_at) = MONTH(CURDATE())
             AND YEAR(rt.created_at)  = YEAR(CURDATE())),
          0
        ) AS monthly_bookings
      FROM branches b
      LEFT JOIN users admin ON b.admin_id = admin.user_id
      LEFT JOIN users creator ON b.created_by = creator.user_id
      ${whereClause}
      ORDER BY b.${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await db.query(dataQuery, [...params, parseInt(limit), parseInt(offset)]);

    return {
      branches: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getBranchDetails(branchId) {
    const [rows] = await db.query(
      `SELECT 
        b.*,
        b.admin_id AS manager_id,
        admin.full_name as manager_name,
        admin.email as manager_email,
        admin.phone as manager_phone,
        admin.full_name as admin_name,
        admin.email as admin_email,
        admin.phone as admin_phone,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM branches b
      LEFT JOIN users admin ON b.admin_id = admin.user_id
      LEFT JOIN users creator ON b.created_by = creator.user_id
      LEFT JOIN users updater ON b.updated_by = updater.user_id
      WHERE b.branch_id = ? AND b.deleted_at IS NULL`,
      [branchId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async createBranch(branchData) {
    const {
      branch_name, branch_code, branch_type, branch_status,
      address_line1, address_line2, city, state, country, pin_code,
      latitude, longitude, email, phone_number, alternate_phone,
      gst_number, pan_number, business_license, opening_date,
      admin_id, manager_id, employee_count, service_radius_km, created_by
    } = branchData;
    
    const [result] = await db.query(
      `INSERT INTO branches (
        branch_name, branch_code, branch_type, branch_status,
        address_line1, address_line2, city, state, country, pin_code,
        latitude, longitude, email, phone_number, alternate_phone,
        gst_number, pan_number, business_license, opening_date,
        admin_id, employee_count, service_radius_km,
        created_by, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        branch_name, branch_code, branch_type || 'SUB', branch_status || 'ACTIVE',
        address_line1, address_line2 || null, city, state, country || 'India', pin_code,
        latitude, longitude, email, phone_number, alternate_phone || null,
        gst_number || null, pan_number || null, business_license || null, opening_date || null,
        admin_id || manager_id || null, employee_count || 0, service_radius_km || 10.00,
        created_by, created_by
      ]
    );

    return result.insertId;
  }

  async updateBranch(branchId, updateData) {
    const {
      branch_name, branch_type, address_line1, address_line2,
      city, state, country, pin_code, latitude, longitude,
      email, phone_number, alternate_phone, gst_number, pan_number,
      business_license, manager_id, admin_id, employee_count, service_radius_km,
      updated_by
    } = updateData;
    
    const [result] = await db.query(
      `UPDATE branches 
       SET branch_name = ?, branch_type = ?, address_line1 = ?, address_line2 = ?,
           city = ?, state = ?, country = ?, pin_code = ?, latitude = ?, longitude = ?,
           email = ?, phone_number = ?, alternate_phone = ?, gst_number = ?, pan_number = ?,
           business_license = ?, admin_id = ?, employee_count = ?, service_radius_km = ?,
           updated_by = ?, updated_at = NOW()
       WHERE branch_id = ? AND deleted_at IS NULL`,
      [
        branch_name, branch_type, address_line1, address_line2 || null,
        city, state, country, pin_code, latitude, longitude,
        email, phone_number, alternate_phone || null, gst_number || null, pan_number || null,
        business_license || null, admin_id || manager_id || null, employee_count, service_radius_km,
        updated_by, branchId
      ]
    );

    return result.affectedRows > 0;
  }

  async updateBranchStatus(branchId, status, updated_by) {
    const [result] = await db.query(
      `UPDATE branches 
       SET branch_status = ?, updated_by = ?, updated_at = NOW()
       WHERE branch_id = ? AND deleted_at IS NULL`,
      [status, updated_by, branchId]
    );

    return result.affectedRows > 0;
  }

  async softDeleteBranch(branchId, deleted_by) {
    const [result] = await db.query(
      `UPDATE branches 
       SET deleted_at = NOW(), branch_status = 'INACTIVE', updated_by = ?, updated_at = NOW()
       WHERE branch_id = ?`,
      [deleted_by, branchId]
    );

    return result.affectedRows > 0;
  }

  // ==================== BRANCH USERS QUERIES ====================

  async getBranchUsers(branchId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total 
       FROM branch_users bu
       JOIN users u ON bu.user_id = u.user_id
       WHERE bu.branch_id = ? AND u.deleted_at IS NULL`,
      [branchId]
    );

    const [rows] = await db.query(
      `SELECT 
         bu.id AS membership_id,
         bu.branch_id,
         bu.user_id,
         bu.status AS membership_status,
         bu.assigned_at,
         u.first_name,
         u.last_name,
         u.full_name,
         u.email,
         u.phone,
         u.profile_image,
         u.role_id,
         r.role_name,
         assigner.full_name AS assigned_by_name
       FROM branch_users bu
       JOIN users u ON bu.user_id = u.user_id
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN users assigner ON bu.assigned_by = assigner.user_id
       WHERE bu.branch_id = ? AND u.deleted_at IS NULL
       ORDER BY bu.assigned_at DESC
       LIMIT ? OFFSET ?`,
      [branchId, parseInt(limit), offset]
    );

    return {
      users: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  async assignBranchUser(branchId, userId, assignedBy) {
    await db.query(
      `INSERT INTO branch_users (branch_id, user_id, assigned_by, assigned_at, status, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), 'ACTIVE', NOW(), NOW())
       ON DUPLICATE KEY UPDATE status = 'ACTIVE', assigned_by = VALUES(assigned_by), assigned_at = NOW(), updated_at = NOW()`,
      [branchId, userId, assignedBy]
    );

    await db.query(
      `UPDATE users SET branch_id = ?, updated_at = NOW() WHERE user_id = ?`,
      [branchId, userId]
    );

    return true;
  }

  async removeBranchUser(branchId, userId) {
    const [result] = await db.query(
      `UPDATE branch_users SET status = 'INACTIVE', updated_at = NOW() WHERE branch_id = ? AND user_id = ?`,
      [branchId, userId]
    );

    await db.query(
      `UPDATE users SET branch_id = NULL, updated_at = NOW() WHERE user_id = ? AND branch_id = ?`,
      [userId, branchId]
    );

    return result.affectedRows > 0;
  }

  // ==================== BRANCH SETTINGS QUERIES ====================

  async getBranchSettings(branchId) {
    const [rows] = await db.query(
      'SELECT * FROM branch_settings WHERE branch_id = ? AND deleted_at IS NULL',
      [branchId]
    );
    if (rows.length > 0) return rows[0];
    return {
      branch_id: branchId,
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      language: 'en',
      max_riders: 50,
      max_vehicles: 100,
      max_daily_bookings: 500,
      booking_radius_km: 10.00,
      min_booking_amount: 0.00,
      commission_percentage: 10.00,
      auto_assign_riders: true,
      auto_accept_bookings: false,
      enable_email_notifications: true,
      enable_sms_notifications: true,
      enable_push_notifications: true,
      accept_cash: true,
      accept_online: true,
      accept_wallet: true
    };
  }

  async createBranchSettings(settingsData) {
    const {
      branch_id, timezone, currency, language, max_riders, max_vehicles,
      max_daily_bookings, booking_radius_km, min_booking_amount, commission_percentage,
      auto_assign_riders, auto_accept_bookings, enable_email_notifications,
      enable_sms_notifications, enable_push_notifications, accept_cash,
      accept_online, accept_wallet, created_by
    } = settingsData;
    
    const [result] = await db.query(
      `INSERT INTO branch_settings (
        branch_id, timezone, currency, language, max_riders, max_vehicles,
        max_daily_bookings, booking_radius_km, min_booking_amount, commission_percentage,
        auto_assign_riders, auto_accept_bookings, enable_email_notifications,
        enable_sms_notifications, enable_push_notifications, accept_cash,
        accept_online, accept_wallet, created_by, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        branch_id, timezone || 'Asia/Kolkata', currency || 'INR', language || 'en',
        max_riders || 50, max_vehicles || 100, max_daily_bookings || 500,
        booking_radius_km || 10.00, min_booking_amount || 0.00, commission_percentage || 10.00,
        auto_assign_riders !== false, auto_accept_bookings || false,
        enable_email_notifications !== false, enable_sms_notifications !== false,
        enable_push_notifications !== false, accept_cash !== false,
        accept_online !== false, accept_wallet !== false, created_by, created_by
      ]
    );

    return result.insertId;
  }

  async updateBranchSettings(branchId, settingsData) {
    const {
      timezone, currency, language, max_riders, max_vehicles,
      max_daily_bookings, booking_radius_km, min_booking_amount, commission_percentage,
      auto_assign_riders, auto_accept_bookings, enable_email_notifications,
      enable_sms_notifications, enable_push_notifications, accept_cash,
      accept_online, accept_wallet, updated_by
    } = settingsData;
    
    const [result] = await db.query(
      `UPDATE branch_settings 
       SET timezone = ?, currency = ?, language = ?, max_riders = ?, max_vehicles = ?,
           max_daily_bookings = ?, booking_radius_km = ?, min_booking_amount = ?, commission_percentage = ?,
           auto_assign_riders = ?, auto_accept_bookings = ?, enable_email_notifications = ?,
           enable_sms_notifications = ?, enable_push_notifications = ?, accept_cash = ?,
           accept_online = ?, accept_wallet = ?, updated_by = ?, updated_at = NOW()
       WHERE branch_id = ? AND deleted_at IS NULL`,
      [
        timezone, currency, language, max_riders, max_vehicles,
        max_daily_bookings, booking_radius_km, min_booking_amount, commission_percentage,
        auto_assign_riders, auto_accept_bookings, enable_email_notifications,
        enable_sms_notifications, enable_push_notifications, accept_cash,
        accept_online, accept_wallet, updated_by, branchId
      ]
    );

    return result.affectedRows > 0;
  }

  // ==================== BRANCH STATISTICS QUERIES ====================

  async getBranchStatistics(branchId) {
    // Get branch city first
    const [branchInfo] = await db.query(
      'SELECT city FROM branches WHERE branch_id = ?',
      [branchId]
    );
    
    if (branchInfo.length === 0) {
      return this.getEmptyStatistics();
    }
    
    const branchCity = branchInfo[0].city;

    // Get users count (branch_users or user branch_id or city)
    const [userStats] = await db.query(
      `SELECT COUNT(DISTINCT u.user_id) as total_users 
       FROM users u 
       LEFT JOIN branch_users bu ON u.user_id = bu.user_id AND bu.branch_id = ? AND bu.status = 'ACTIVE'
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       WHERE (u.branch_id = ? OR bu.branch_id = ? OR up.city = ?)
       AND u.deleted_at IS NULL`,
      [branchId, branchId, branchId, branchCity]
    );

    // Get riders count (using branch_id and assigned_city fallback)
    const [riderStats] = await db.query(
      `SELECT COUNT(*) as total_riders,
              SUM(CASE WHEN r.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_riders
       FROM riders r
       WHERE (r.branch_id = ? OR r.assigned_city = ?) 
       AND r.deleted_at IS NULL`,
      [branchId, branchCity]
    );

    // Get vehicles count
    let vehicleStats = [{ total_vehicles: 0, available_vehicles: 0, in_ride_vehicles: 0 }];
    try {
      const [vStats] = await db.query(
        `SELECT COUNT(*) as total_vehicles,
                SUM(CASE WHEN v.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_vehicles,
                SUM(CASE WHEN v.status IN ('RENTED', 'IN_RIDE') THEN 1 ELSE 0 END) as in_ride_vehicles
         FROM vehicles v
         WHERE (v.branch_id = ? OR v.city = ? OR v.assigned_city = ?)
         AND v.deleted_at IS NULL`,
        [branchId, branchCity, branchCity]
      );
      vehicleStats = vStats;
    } catch {
      vehicleStats = [{ total_vehicles: 0, available_vehicles: 0, in_ride_vehicles: 0 }];
    }

    // Get bookings count
    let bookingStats = [{ total_bookings: 0, completed_bookings: 0, cancelled_bookings: 0, today_bookings: 0 }];
    try {
      const [bStats] = await db.query(
        `SELECT COUNT(*) as total_bookings,
                SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_bookings,
                SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
                SUM(CASE WHEN DATE(b.created_at) = CURDATE() THEN 1 ELSE 0 END) as today_bookings
         FROM rider_trips b
         LEFT JOIN riders r ON b.rider_id = r.rider_id
         WHERE (r.branch_id = ? OR r.assigned_city = ? OR b.pickup_address LIKE ?)`,
        [branchId, branchCity, `%${branchCity}%`]
      );
      bookingStats = bStats;
    } catch (err) {
      bookingStats = [{ total_bookings: 0, completed_bookings: 0, cancelled_bookings: 0, today_bookings: 0 }];
    }

    // Get revenue stats
    let revenueStats = [{ today_revenue: 0, monthly_revenue: 0, total_revenue: 0 }];
    try {
      const [rStats] = await db.query(
        `SELECT 
           COALESCE(SUM(CASE WHEN DATE(rt.created_at) = CURDATE() THEN rt.fare_amount ELSE 0 END), 0) as today_revenue,
           COALESCE(SUM(CASE WHEN MONTH(rt.created_at) = MONTH(CURDATE()) AND YEAR(rt.created_at) = YEAR(CURDATE()) THEN rt.fare_amount ELSE 0 END), 0) as monthly_revenue,
           COALESCE(SUM(rt.fare_amount), 0) as total_revenue
         FROM rider_trips rt
         LEFT JOIN riders r ON rt.rider_id = r.rider_id
         WHERE (r.branch_id = ? OR r.assigned_city = ?)
         AND rt.payment_status = 'PAID'`,
        [branchId, branchCity]
      );
      revenueStats = rStats;
    } catch {
      revenueStats = [{ today_revenue: 0, monthly_revenue: 0, total_revenue: 0 }];
    }

    return {
      total_users: userStats[0]?.total_users || 0,
      total_riders: riderStats[0]?.total_riders || 0,
      active_riders: riderStats[0]?.active_riders || 0,
      total_vehicles: vehicleStats[0]?.total_vehicles || 0,
      available_vehicles: vehicleStats[0]?.available_vehicles || 0,
      in_ride_vehicles: vehicleStats[0]?.in_ride_vehicles || 0,
      total_bookings: bookingStats[0]?.total_bookings || 0,
      completed_bookings: bookingStats[0]?.completed_bookings || 0,
      cancelled_bookings: bookingStats[0]?.cancelled_bookings || 0,
      today_bookings: bookingStats[0]?.today_bookings || 0,
      total_revenue: parseFloat(revenueStats[0]?.total_revenue) || 0,
      today_revenue: parseFloat(revenueStats[0]?.today_revenue) || 0,
      monthly_revenue: parseFloat(revenueStats[0]?.monthly_revenue) || 0,
      pending_payments: 0,
      pending_withdrawals: 0
    };
  }

  getEmptyStatistics() {
    return {
      total_users: 0,
      total_riders: 0,
      active_riders: 0,
      total_vehicles: 0,
      available_vehicles: 0,
      in_ride_vehicles: 0,
      total_bookings: 0,
      completed_bookings: 0,
      cancelled_bookings: 0,
      today_bookings: 0,
      total_revenue: 0,
      today_revenue: 0,
      monthly_revenue: 0,
      pending_payments: 0,
      pending_withdrawals: 0
    };
  }

  // ==================== ACTIVITY LOG QUERIES ====================

  async createActivityLog(logData) {
    const {
      branch_id, admin_id, action, description, old_value, new_value,
      ip_address, user_agent
    } = logData;
    
    try {
      const [result] = await db.query(
        `INSERT INTO activity_logs (
          user_id, module, entity_type, entity_id, action, description,
          old_value, new_value, ip_address, user_agent, created_at
        ) VALUES (?, 'BRANCH_MANAGEMENT', 'BRANCH', ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [admin_id, String(branch_id), action, description, old_value || null, new_value || null, ip_address, user_agent]
      );
      return result.insertId;
    } catch {
      return null;
    }
  }

  async getActivityLogs(branchId, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    try {
      const [[{ total }]] = await db.query(
        "SELECT COUNT(*) as total FROM activity_logs WHERE entity_type = 'BRANCH' AND entity_id = ?",
        [String(branchId)]
      );

      const [rows] = await db.query(
        `SELECT 
          l.log_id,
          l.action,
          l.module,
          l.description,
          l.old_value,
          l.new_value,
          l.ip_address,
          l.user_agent,
          l.created_at,
          a.full_name as admin_name,
          a.email as admin_email
        FROM activity_logs l
        LEFT JOIN users a ON l.user_id = a.user_id
        WHERE l.entity_type = 'BRANCH' AND l.entity_id = ?
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?`,
        [String(branchId), parseInt(limit), parseInt(offset)]
      );

      return {
        logs: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit) || 1
        }
      };
    } catch {
      return { logs: [], pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 } };
    }
  }

  // ==================== VALIDATION QUERIES ====================

  async hasActiveBookings(branchId) {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM rider_trips rt
       LEFT JOIN riders r ON rt.rider_id = r.rider_id
       WHERE (r.branch_id = ? OR r.assigned_city = (SELECT city FROM branches WHERE branch_id = ?))
       AND rt.status IN ('PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT')`,
      [branchId, branchId]
    );
    return rows[0].count > 0;
  }

  async hasActiveRiders(branchId) {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM riders 
       WHERE (branch_id = ? OR assigned_city = (SELECT city FROM branches WHERE branch_id = ?))
       AND status = 'ACTIVE' AND deleted_at IS NULL`,
      [branchId, branchId]
    );
    return rows[0].count > 0;
  }

  async hasActiveVehicles(branchId) {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM vehicles 
       WHERE (branch_id = ? OR assigned_city = (SELECT city FROM branches WHERE branch_id = ?))
       AND status != 'OFFLINE' AND deleted_at IS NULL`,
      [branchId, branchId]
    );
    return rows[0].count > 0;
  }

  async hasAssignedAdmins(branchId) {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM branches 
       WHERE branch_id = ? AND admin_id IS NOT NULL`,
      [branchId]
    );
    return rows[0].count > 0;
  }
}

module.exports = new BranchRepository();
