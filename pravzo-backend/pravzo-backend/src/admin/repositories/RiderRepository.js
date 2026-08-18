'use strict';
const db = require('../../../src/config/db');
const { hashPassword } = require('../../../src/utils/password');

class RiderRepository {

  // ──────────────────────────────────────────────────────────
  // CORE LOOKUPS
  // ──────────────────────────────────────────────────────────

  async findById(riderId) {
    const [rows] = await db.query(
      'SELECT * FROM riders WHERE rider_id = ? AND deleted_at IS NULL',
      [riderId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByPhone(phoneNumber) {
    const [rows] = await db.query(
      `SELECT r.*
       FROM riders r
       INNER JOIN users u ON u.user_id = r.user_id
       WHERE u.phone = ? AND r.deleted_at IS NULL
       LIMIT 1`,
      [phoneNumber]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByEmail(email) {
    const [rows] = await db.query(
      `SELECT r.*
       FROM riders r
       INNER JOIN users u ON u.user_id = r.user_id
       WHERE u.email = ? AND r.deleted_at IS NULL
       LIMIT 1`,
      [email]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // ──────────────────────────────────────────────────────────
  // RIDER LIST (paginated + filtered)
  // ──────────────────────────────────────────────────────────

  async getRiders(filters = {}, pagination = {}) {
    const {
      search        = '',
      status        = null,
      city          = null,
      vehicleType   = null,
      onlineStatus  = null,
      availability  = null,
      kycStatus     = null,
      minRating     = null,
      maxRating     = null,
      startDate     = null,
      endDate       = null,
      sortBy        = 'r.created_at',
      sortOrder     = 'DESC'
    } = filters;

    // Whitelist only columns that exist in the final schema
    const ALLOWED_SORT_FIELDS = new Set([
      'r.created_at', 'r.updated_at', 'r.status', 'r.rating',
      'r.assigned_city', 'r.kyc_status', 'r.online_status',
      'r.total_earnings', 'r.completed_trips',
      'u.full_name', 'u.email',
    ]);
    const ALLOWED_SORT_ORDERS = new Set(['ASC', 'DESC']);

    // Normalise caller-supplied sort fields (accept shorthand without prefix)
    const sortMap = {
      created_at: 'r.created_at', updated_at: 'r.updated_at',
      full_name: 'u.full_name', email: 'u.email',
      status: 'r.status', rating: 'r.rating',
      assigned_city: 'r.assigned_city', kyc_status: 'r.kyc_status',
      online_status: 'r.online_status', total_earnings: 'r.total_earnings',
      completed_trips: 'r.completed_trips',
    };
    const rawSort = sortMap[sortBy] || sortBy;
    const safeSortBy    = ALLOWED_SORT_FIELDS.has(rawSort) ? rawSort : 'r.created_at';
    const safeSortOrder = ALLOWED_SORT_ORDERS.has(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions = ['r.deleted_at IS NULL'];
    const params     = [];

    if (search) {
      conditions.push('(u.full_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ? OR r.rider_code LIKE ?)');
      const p = `%${search}%`;
      params.push(p, p, p, p);
    }
    if (status)       { conditions.push('r.status = ?');        params.push(status); }
    if (city)         { conditions.push('r.assigned_city = ?'); params.push(city); }
    if (vehicleType)  { conditions.push('v.vehicle_type = ?');  params.push(vehicleType); }
    if (onlineStatus) { conditions.push('r.online_status = ?'); params.push(onlineStatus); }
    if (availability) { conditions.push('r.availability = ?');  params.push(availability); }
    if (kycStatus)    { conditions.push('r.kyc_status = ?');    params.push(kycStatus); }
    if (minRating !== null) { conditions.push('r.rating >= ?'); params.push(parseFloat(minRating)); }
    if (maxRating !== null) { conditions.push('r.rating <= ?'); params.push(parseFloat(maxRating)); }
    if (startDate)    { conditions.push('r.created_at >= ?');   params.push(startDate); }
    if (endDate)      { conditions.push('r.created_at <= ?');   params.push(endDate); }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countQuery = `
      SELECT COUNT(DISTINCT r.rider_id) AS total
      FROM riders r
      INNER JOIN users u ON u.user_id = r.user_id
      LEFT JOIN vehicles v ON r.assigned_vehicle_id = v.vehicle_id
      ${whereClause}
    `;
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    const dataQuery = `
      SELECT
        r.rider_id, r.user_id, r.rider_code, r.branch_id,
        r.assigned_city, r.assigned_zone,
        r.status, r.online_status, r.availability, r.application_status, r.kyc_status,
        r.rating, r.total_trips, r.completed_trips, r.cancelled_trips,
        r.total_earnings, r.today_earnings,
        r.acceptance_rate, r.completion_rate, r.avg_ride_duration, r.avg_distance,
        r.assigned_vehicle_id, r.created_at, r.updated_at,
        u.full_name, u.phone AS phone_number, u.email,
        u.profile_image AS profile_photo,
        up.date_of_birth, up.gender, up.address,
        v.vehicle_type, v.model_name, v.registration_number, v.color AS vehicle_color,
        w.wallet_balance
      FROM riders r
      INNER JOIN users u         ON u.user_id   = r.user_id
      LEFT JOIN user_profiles up ON up.user_id  = r.user_id
      LEFT JOIN vehicles v       ON v.vehicle_id = r.assigned_vehicle_id
      LEFT JOIN wallets w        ON w.user_id   = r.user_id
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataQuery, [...params, parseInt(limit), parseInt(offset)]);

    return {
      riders: rows,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // ──────────────────────────────────────────────────────────
  // RIDER PROFILE (full detail for admin view)
  // ──────────────────────────────────────────────────────────

  async getRiderProfile(riderId) {
    const [rows] = await db.query(
      `SELECT
         r.rider_id, r.user_id, r.rider_code, r.branch_id,
         r.assigned_city, r.assigned_zone,
         r.status, r.online_status, r.availability, r.application_status, r.kyc_status,
         r.rating, r.total_trips, r.completed_trips, r.cancelled_trips,
         r.total_earnings, r.today_earnings,
         r.acceptance_rate, r.completion_rate, r.avg_ride_duration, r.avg_distance,
         r.bank_account_number, r.ifsc_code, r.account_holder_name,
         r.upi_id, r.payout_schedule,
         r.assigned_vehicle_id, r.created_at, r.updated_at,
         u.full_name, u.phone AS phone_number, u.email,
         u.profile_image AS profile_photo,
         up.date_of_birth, up.gender, up.address,
         up.emergency_contact_name, up.emergency_contact_number,
         v.vehicle_id, v.vehicle_type, v.model_name, v.registration_number,
         v.color AS vehicle_color, v.year_of_manufacture AS vehicle_year,
         v.status AS vehicle_status,
         w.wallet_balance
       FROM riders r
       INNER JOIN users u          ON u.user_id   = r.user_id
       LEFT JOIN user_profiles up  ON up.user_id  = r.user_id
       LEFT JOIN vehicles v        ON v.vehicle_id = r.assigned_vehicle_id
       LEFT JOIN wallets w         ON w.user_id   = r.user_id
       WHERE r.rider_id = ? AND r.deleted_at IS NULL`,
      [riderId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // ──────────────────────────────────────────────────────────
  // RIDER DOCUMENTS (user_documents table, keyed by user_id)
  // ──────────────────────────────────────────────────────────

  async getRiderDocuments(riderId) {
    const [rows] = await db.query(
      `SELECT
         ud.document_id, ud.user_id, ud.document_type, ud.document_number,
         ud.file_url, ud.file_url_back, ud.status AS verified_status,
         ud.verified_by, ud.verified_at, ud.rejection_reason, ud.created_at,
         a.full_name AS verified_by_name
       FROM user_documents ud
       LEFT JOIN users a ON a.user_id = ud.verified_by
       WHERE ud.user_id = (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1)
       ORDER BY ud.created_at DESC`,
      [riderId]
    );
    return rows;
  }

  // ──────────────────────────────────────────────────────────
  // RIDER DEVICES (user_devices table, keyed by user_id)
  // ──────────────────────────────────────────────────────────

  async getRiderDevices(riderId) {
    const [rows] = await db.query(
      `SELECT device_id, user_id, device_type, device_model,
              operating_system, browser, is_active, last_login_at AS last_active_at, created_at, updated_at
       FROM user_devices
       WHERE user_id = (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1)
       ORDER BY last_login_at DESC`,
      [riderId]
    );
    return rows;
  }

  // ──────────────────────────────────────────────────────────
  // RIDER EARNINGS
  // ──────────────────────────────────────────────────────────

  async getRiderEarnings(riderId) {
    const [rows] = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN DATE(wt.created_at) = CURDATE() THEN wt.amount ELSE 0 END), 0)                                                                AS today_earnings,
         COALESCE(SUM(CASE WHEN YEARWEEK(wt.created_at, 1) = YEARWEEK(CURDATE(), 1) THEN wt.amount ELSE 0 END), 0)                                             AS weekly_earnings,
         COALESCE(SUM(CASE WHEN MONTH(wt.created_at) = MONTH(CURDATE()) AND YEAR(wt.created_at) = YEAR(CURDATE()) THEN wt.amount ELSE 0 END), 0)               AS monthly_earnings,
         COALESCE(SUM(wt.amount), 0) AS total_earnings
       FROM wallet_transactions wt
       WHERE wt.user_id = (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1)
         AND wt.transaction_type = 'CREDIT'
         AND wt.source_type = 'EARNING'`,
      [riderId]
    );
    const wt = rows[0] || {};
    if (!wt.total_earnings || parseFloat(wt.total_earnings) === 0) {
      const [rRows] = await db.query(
        `SELECT today_earnings, total_earnings FROM riders WHERE rider_id = ? LIMIT 1`,
        [riderId]
      );
      const r = rRows[0] || {};
      return {
        today_earnings:   parseFloat(r.today_earnings || 0),
        weekly_earnings:  0,
        monthly_earnings: 0,
        total_earnings:   parseFloat(r.total_earnings || 0)
      };
    }
    return {
      today_earnings:   parseFloat(wt.today_earnings   || 0),
      weekly_earnings:  parseFloat(wt.weekly_earnings  || 0),
      monthly_earnings: parseFloat(wt.monthly_earnings || 0),
      total_earnings:   parseFloat(wt.total_earnings   || 0)
    };
  }

  // ──────────────────────────────────────────────────────────
  // RIDER WALLET TRANSACTIONS (wallet_transactions.user_id)
  // ──────────────────────────────────────────────────────────

  async getRiderWalletTransactions(riderId, limit = 10) {
    const [rows] = await db.query(
      `SELECT transaction_id, transaction_type, amount, balance_before, balance_after,
              source_type AS reference_type, reference_id, description, created_at
       FROM wallet_transactions
       WHERE user_id = (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1)
       ORDER BY created_at DESC
       LIMIT ?`,
      [riderId, parseInt(limit)]
    );
    return rows;
  }

  // ──────────────────────────────────────────────────────────
  // TRIP STATISTICS (from rider_trips tables)
  // ──────────────────────────────────────────────────────────

  async getTripStatistics(riderId) {
    const [rows] = await db.query(
      `SELECT
         COUNT(*) AS total_trips,
         SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_trips,
         SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_trips,
         SUM(CASE WHEN status IN ('PENDING','ACCEPTED','IN_TRANSIT') THEN 1 ELSE 0 END) AS active_trips,
         COALESCE(AVG(duration_minutes), 0)  AS avg_duration,
         COALESCE(AVG(distance_km), 0) AS avg_distance
       FROM rider_trips
       WHERE rider_id = ?`,
      [riderId]
    );
    return rows[0] || {
      total_trips: 0, completed_trips: 0, cancelled_trips: 0,
      active_trips: 0, avg_duration: 0, avg_distance: 0
    };
  }

  // ──────────────────────────────────────────────────────────
  // CURRENT LOCATION (rider_locations)
  // ──────────────────────────────────────────────────────────

  async getCurrentLocation(riderId) {
    const [rows] = await db.query(
      `SELECT location_id, rider_id, latitude, longitude, updated_at
       FROM rider_locations
       WHERE rider_id = ?
       ORDER BY updated_at DESC
       LIMIT 1`,
      [riderId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // ──────────────────────────────────────────────────────────
  // RECENT ACTIVITIES (activity_logs)
  // ──────────────────────────────────────────────────────────

  async getRecentActivities(riderId, limit = 10) {
    const [rows] = await db.query(
      `SELECT log_id, action AS activity_type, description, entity_type, entity_id, created_at
       FROM activity_logs
       WHERE user_id = (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1)
       ORDER BY created_at DESC
       LIMIT ?`,
      [riderId, parseInt(limit)]
    );
    return rows;
  }

  // ──────────────────────────────────────────────────────────
  // BLOCK / UNBLOCK
  // ──────────────────────────────────────────────────────────

  async blockRider(riderId, reason, blockedBy, blockedAt) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE riders
         SET status = 'SUSPENDED',
             availability = 'OFFLINE',
             online_status = 'OFFLINE',
             updated_at = ?
         WHERE rider_id = ?`,
        [blockedAt, riderId]
      );

      await connection.query(
        `UPDATE user_devices
         SET is_active = 0, updated_at = ?
         WHERE user_id = (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1)`,
        [blockedAt, riderId]
      );

      await connection.query(
        `INSERT INTO activity_logs
         (user_id, module, entity_type, entity_id, action, description, created_at)
         VALUES (
           (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1),
           'RIDER', 'rider', ?, 'BLOCKED', ?, ?
         )`,
        [riderId, String(riderId), reason, blockedAt]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async unblockRider(riderId, unblockedAt) {
    const [result] = await db.query(
      `UPDATE riders SET status = 'ACTIVE', updated_at = ? WHERE rider_id = ?`,
      [unblockedAt, riderId]
    );
    return result.affectedRows > 0;
  }

  // ──────────────────────────────────────────────────────────
  // STATUS / KYC / VEHICLE UPDATES
  // ──────────────────────────────────────────────────────────

  async updateRiderStatus(riderId, status, updatedAt) {
    const [result] = await db.query(
      `UPDATE riders SET status = ?, updated_at = ? WHERE rider_id = ?`,
      [status, updatedAt, riderId]
    );
    return result.affectedRows > 0;
  }

  async updateRiderKYC(riderId, kycStatus, verifiedBy, remarks, updatedAt) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE riders SET kyc_status = ?, updated_at = ? WHERE rider_id = ?`,
        [kycStatus, updatedAt, riderId]
      );

      if (kycStatus === 'APPROVED') {
        await connection.query(
          `UPDATE user_documents
           SET status = 'APPROVED', verified_by = ?, verified_at = ?,
               rejection_reason = ?, updated_at = ?
           WHERE user_id = (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1)
             AND status = 'PENDING'`,
          [verifiedBy, updatedAt, remarks, updatedAt, riderId]
        );
        await connection.query(
          `UPDATE riders SET status = 'ACTIVE', updated_at = ?
           WHERE rider_id = ? AND status = 'UNDER_REVIEW'`,
          [updatedAt, riderId]
        );
      } else if (kycStatus === 'REJECTED') {
        await connection.query(
          `UPDATE user_documents
           SET status = 'REJECTED', verified_by = ?, verified_at = ?,
               rejection_reason = ?, updated_at = ?
           WHERE user_id = (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1)`,
          [verifiedBy, updatedAt, remarks, updatedAt, riderId]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateRiderVehicle(riderId, vehicleId, action, updatedAt) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      if (action === 'REMOVE') {
        await connection.query(
          `UPDATE riders SET assigned_vehicle_id = NULL, updated_at = ? WHERE rider_id = ?`,
          [updatedAt, riderId]
        );
      } else {
        if (action === 'REPLACE') {
          const [current] = await connection.query(
            'SELECT assigned_vehicle_id FROM riders WHERE rider_id = ?',
            [riderId]
          );
          if (current[0] && current[0].assigned_vehicle_id) {
            await connection.query(
              `UPDATE vehicles SET assigned_rider_id = NULL, updated_at = ? WHERE vehicle_id = ?`,
              [updatedAt, current[0].assigned_vehicle_id]
            );
          }
        }
        await connection.query(
          `UPDATE riders SET assigned_vehicle_id = ?, updated_at = ? WHERE rider_id = ?`,
          [vehicleId, updatedAt, riderId]
        );
        await connection.query(
          `UPDATE vehicles SET assigned_rider_id = ?, updated_at = ? WHERE vehicle_id = ?`,
          [riderId, updatedAt, vehicleId]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ──────────────────────────────────────────────────────────
  // LOCATION UPDATE
  // ──────────────────────────────────────────────────────────

  async updateRiderLocation(riderId, locationData, updatedAt) {
    const { latitude, longitude } = locationData;
    const [result] = await db.query(
      `INSERT INTO rider_locations (rider_id, latitude, longitude, updated_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         latitude   = VALUES(latitude),
         longitude  = VALUES(longitude),
         updated_at = VALUES(updated_at)`,
      [riderId, latitude, longitude, updatedAt]
    );
    return result.affectedRows > 0;
  }

  async updateRiderAvailability(riderId, availability, updatedAt) {
    const [result] = await db.query(
      `UPDATE riders
       SET availability = ?,
           online_status = CASE WHEN ? = 'OFFLINE' THEN 'OFFLINE' ELSE 'ONLINE' END,
           updated_at = ?
       WHERE rider_id = ?`,
      [availability, availability, updatedAt, riderId]
    );
    return result.affectedRows > 0;
  }

  // ──────────────────────────────────────────────────────────
  // CURRENT BOOKING / BOOKINGS LIST
  // ──────────────────────────────────────────────────────────

  async getCurrentBooking(riderId) {
    const [rows] = await db.query(
      `SELECT
         rt.trip_id, rt.rider_id, rt.user_id, rt.vehicle_id,
         rt.status, rt.fare_amount, rt.pickup_address, rt.pickup_latitude, rt.pickup_longitude,
         rt.dropoff_address, rt.dropoff_latitude, rt.dropoff_longitude,
         rt.distance_km, rt.accepted_at, rt.picked_up_at,
         rt.created_at, rt.updated_at,
         u.full_name AS customer_name,
         u.phone AS customer_phone
       FROM rider_trips rt
       LEFT JOIN users u ON u.user_id = rt.user_id
       WHERE rt.rider_id = ?
         AND rt.status IN ('ACCEPTED', 'IN_TRANSIT')
       ORDER BY rt.created_at DESC
       LIMIT 1`,
      [riderId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getRiderBookings(riderId, pagination = {}, filters = {}) {
    const { page = 1, limit = 20 } = pagination;
    const { status = null, startDate = null, endDate = null } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['rt.rider_id = ?'];
    const params = [riderId];

    if (status)    { conditions.push('rt.status = ?');       params.push(status); }
    if (startDate) { conditions.push('rt.created_at >= ?');  params.push(startDate); }
    if (endDate)   { conditions.push('rt.created_at <= ?');  params.push(endDate); }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM rider_trips rt ${whereClause}`, params
    );
    const total = countResult[0].total;

    const [rows] = await db.query(
      `SELECT
         rt.trip_id, rt.rider_id, rt.user_id, rt.vehicle_id,
         rt.status, rt.fare_amount, rt.payment_status, rt.payment_method,
         rt.pickup_address, rt.dropoff_address, rt.distance_km,
         rt.accepted_at, rt.picked_up_at, rt.completed_at, rt.cancelled_at,
         rt.created_at, rt.updated_at,
         u.full_name AS customer_name,
         u.phone AS customer_phone,
         u.profile_image AS customer_photo
       FROM rider_trips rt
       LEFT JOIN users u ON u.user_id = rt.user_id
       ${whereClause}
       ORDER BY rt.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      bookings: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    };
  }

  // ──────────────────────────────────────────────────────────
  // PAYMENTS (wallet_transactions — user_id FK)
  // ──────────────────────────────────────────────────────────

  async getRiderPayments(riderId, pagination = {}, filters = {}) {
    const { page = 1, limit = 20 } = pagination;
    const { type = null } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['wt.user_id = (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1)'];
    const params = [riderId];

    if (type) {
      conditions.push('wt.transaction_type = ?');
      params.push(type);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM wallet_transactions wt ${whereClause}`, params
    );
    const total = countResult[0].total;

    const [rows] = await db.query(
      `SELECT
         transaction_id, transaction_type, amount, balance_before, balance_after,
         source_type AS reference_type, reference_id, description, created_at
       FROM wallet_transactions wt
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      payments: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    };
  }

  // ──────────────────────────────────────────────────────────
  // ACTIVITY TIMELINE (activity_logs + rider_trips)
  // ──────────────────────────────────────────────────────────

  async getRiderActivity(riderId, limit = 20) {
    const limitInt = parseInt(limit);
    const query = `
      (
        SELECT 'TRIP' AS activity_type, trip_id AS ref_id,
               CONCAT('Trip #', trip_id, ' - ', status) AS description, created_at
        FROM rider_trips
        WHERE rider_id = ?
        ORDER BY created_at DESC
        LIMIT ${limitInt}
      )
      UNION ALL
      (
        SELECT 'WALLET' AS activity_type, transaction_id AS ref_id,
               CONCAT(transaction_type, ' - ₹', amount) AS description, created_at
        FROM wallet_transactions
        WHERE user_id = (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1)
        ORDER BY created_at DESC
        LIMIT ${limitInt}
      )
      UNION ALL
      (
        SELECT action AS activity_type, log_id AS ref_id, description, created_at
        FROM activity_logs
        WHERE user_id = (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1)
        ORDER BY created_at DESC
        LIMIT ${limitInt}
      )
      ORDER BY created_at DESC
      LIMIT ${limitInt}
    `;
    const [rows] = await db.query(query, [riderId, riderId, riderId]);
    return rows;
  }

  // ──────────────────────────────────────────────────────────
  // RIDER STATISTICS (aggregate from riders table)
  // ──────────────────────────────────────────────────────────

  async getRiderStatistics() {
    const [rows] = await db.query(
      `SELECT
         COUNT(*) AS total_riders,
         SUM(CASE WHEN online_status = 'ONLINE'    THEN 1 ELSE 0 END) AS online_riders,
         SUM(CASE WHEN online_status = 'OFFLINE'   THEN 1 ELSE 0 END) AS offline_riders,
         SUM(CASE WHEN status = 'SUSPENDED'        THEN 1 ELSE 0 END) AS blocked_riders,
         SUM(CASE WHEN kyc_status = 'APPROVED'     THEN 1 ELSE 0 END) AS verified_riders,
         SUM(CASE WHEN kyc_status = 'PENDING'      THEN 1 ELSE 0 END) AS pending_kyc,
         SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS today_joined,
         SUM(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 ELSE 0 END) AS weekly_joined,
         SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS monthly_joined,
         COALESCE(AVG(rating), 0) AS avg_rating,
         COALESCE(AVG(total_earnings), 0) AS avg_earnings,
         COALESCE(AVG(acceptance_rate), 0) AS avg_acceptance_rate,
         COALESCE(AVG(completion_rate), 0) AS avg_completion_rate
       FROM riders
       WHERE deleted_at IS NULL`
    );
    const stats = rows[0];

    const [prevMonthResult] = await db.query(
      `SELECT COUNT(*) AS prev_month_joined FROM riders
       WHERE MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
         AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
         AND deleted_at IS NULL`
    );
    const prevMonthCount    = prevMonthResult[0]?.prev_month_joined || 0;
    const currentMonthCount = stats?.monthly_joined || 0;
    const growthPercentage  = prevMonthCount > 0
      ? ((currentMonthCount - prevMonthCount) / prevMonthCount * 100).toFixed(2)
      : 0;

    return { ...stats, growth_percentage: parseFloat(growthPercentage) };
  }

  // ──────────────────────────────────────────────────────────
  // EXPORT
  // ──────────────────────────────────────────────────────────

  async getRidersForExport(filters = {}) {
    const { status = null, city = null, kycStatus = null, startDate = null, endDate = null } = filters;
    const conditions = ['r.deleted_at IS NULL'];
    const params = [];

    if (status)    { conditions.push('r.status = ?');        params.push(status); }
    if (city)      { conditions.push('r.assigned_city = ?'); params.push(city); }
    if (kycStatus) { conditions.push('r.kyc_status = ?');    params.push(kycStatus); }
    if (startDate) { conditions.push('r.created_at >= ?');   params.push(startDate); }
    if (endDate)   { conditions.push('r.created_at <= ?');   params.push(endDate); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT
         r.rider_id, r.rider_code, r.branch_id,
         r.assigned_city, r.assigned_zone,
         r.status, r.online_status, r.availability, r.kyc_status,
         r.rating, r.total_trips, r.completed_trips, r.cancelled_trips,
         r.total_earnings, r.acceptance_rate, r.completion_rate,
         r.created_at,
         u.full_name, u.phone AS phone_number, u.email,
         up.date_of_birth, up.gender,
         v.vehicle_type, v.model_name, v.registration_number,
         w.wallet_balance
       FROM riders r
       INNER JOIN users u          ON u.user_id   = r.user_id
       LEFT JOIN user_profiles up  ON up.user_id  = r.user_id
       LEFT JOIN vehicles v        ON v.vehicle_id = r.assigned_vehicle_id
       LEFT JOIN wallets w         ON w.user_id   = r.user_id
       ${whereClause}
       ORDER BY r.created_at DESC`,
      params
    );
    return rows;
  }

  // ──────────────────────────────────────────────────────────
  // CREATE RIDER
  // ──────────────────────────────────────────────────────────

  async createRider(riderData, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const {
        phoneNumber, phone_number,
        email,
        fullName, full_name,
        password,
        assignedCity, assigned_city,
        assignedZone, assigned_zone,
        branchId, branch_id,
        bankAccountNumber, bank_account_number,
        ifscCode, ifsc_code,
        accountHolderName, account_holder_name,
        upiId, upi_id,
      } = riderData;

      const phone    = phoneNumber || phone_number;
      const name     = fullName    || full_name || '';
      const city     = assignedCity || assigned_city || null;
      const zone     = assignedZone || assigned_zone || null;
      const branchFK = branchId     || branch_id     || null;
      const bankAcc  = bankAccountNumber || bank_account_number || null;
      const ifsc     = ifscCode     || ifsc_code     || null;
      const holder   = accountHolderName || account_holder_name || null;
      const upi      = upiId        || upi_id        || null;

      // Split name
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Rider';
      const lastName  = nameParts.slice(1).join(' ') || '';

      // Find or create user
      let userId;
      const [existingUser] = await connection.query(
        'SELECT user_id FROM users WHERE phone = ? AND deleted_at IS NULL LIMIT 1',
        [phone]
      );

      if (existingUser.length > 0) {
        userId = existingUser[0].user_id;
      } else {
        // Create a new user with RIDER role (role_id = 5)
        const rawPassword = password || phone;
        const hashed = await hashPassword(rawPassword);
        const [userResult] = await connection.query(
          `INSERT INTO users
           (first_name, last_name, phone, email, hashed_password, role_id, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 5, 'ACTIVE', NOW(), NOW())`,
          [firstName, lastName, phone, email || null, hashed]
        );
        userId = userResult.insertId;

        // Create user_profiles row
        await connection.query(
          `INSERT INTO user_profiles (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())`,
          [userId]
        );

        // Create wallet
        await connection.query(
          `INSERT INTO wallets (user_id, wallet_balance, currency, is_active, created_at, updated_at)
           VALUES (?, 0.00, 'INR', 1, NOW(), NOW())`,
          [userId]
        );
      }

      // Check if rider row already exists for this user
      const [existingRider] = await connection.query(
        'SELECT rider_id FROM riders WHERE user_id = ? LIMIT 1',
        [userId]
      );
      if (existingRider.length > 0) {
        await connection.rollback();
        throw new Error('A rider record already exists for this user');
      }

      const rider_code = 'RDR' + Date.now().toString().slice(-6);

      const [riderResult] = await connection.query(
        `INSERT INTO riders
         (user_id, rider_code, branch_id, assigned_city, assigned_zone,
          bank_account_number, ifsc_code, account_holder_name, upi_id,
          status, kyc_status, application_status, online_status, availability,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNDER_REVIEW', 'PENDING', 'pending', 'OFFLINE', 'OFFLINE', NOW(), NOW())`,
        [userId, rider_code, branchFK, city, zone, bankAcc, ifsc, holder, upi]
      );

      await connection.commit();
      return riderResult.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ──────────────────────────────────────────────────────────
  // UPDATE RIDER
  // ──────────────────────────────────────────────────────────

  async updateRider(riderId, updateData, updatedAt) {
    const USER_COLS = {
      email: 'email', phone: 'phone', phoneNumber: 'phone', phone_number: 'phone',
      status: 'status', profileImage: 'profile_image', profile_image: 'profile_image',
      profile_photo: 'profile_image', profilePhoto: 'profile_image',
    };

    const PROFILE_COLS = {
      dateOfBirth: 'date_of_birth', date_of_birth: 'date_of_birth',
      gender: 'gender', address: 'address',
      emergencyContactName: 'emergency_contact_name',
      emergency_contact_name: 'emergency_contact_name',
      emergencyContactNumber: 'emergency_contact_number',
      emergency_contact_number: 'emergency_contact_number',
    };

    const RIDER_COLS = {
      assignedCity: 'assigned_city', assigned_city: 'assigned_city',
      assignedZone: 'assigned_zone', assigned_zone: 'assigned_zone',
      branchId: 'branch_id', branch_id: 'branch_id',
      onlineStatus: 'online_status', online_status: 'online_status',
      availability: 'availability',
      applicationStatus: 'application_status', application_status: 'application_status',
      kycStatus: 'kyc_status', kyc_status: 'kyc_status',
      bankAccountNumber: 'bank_account_number', bank_account_number: 'bank_account_number',
      ifscCode: 'ifsc_code', ifsc_code: 'ifsc_code',
      accountHolderName: 'account_holder_name', account_holder_name: 'account_holder_name',
      upiId: 'upi_id', upi_id: 'upi_id',
      payoutSchedule: 'payout_schedule', payout_schedule: 'payout_schedule',
      riderCode: 'rider_code', rider_code: 'rider_code',
    };

    const userSeen    = new Set();
    const profileSeen = new Set();
    const riderSeen   = new Set();

    const userClauses    = [];
    const userVals       = [];
    const profileClauses = [];
    const profileVals    = [];
    const riderClauses   = [];
    const riderVals      = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (USER_COLS[key] && !userSeen.has(USER_COLS[key])) {
        userSeen.add(USER_COLS[key]);
        userClauses.push(`${USER_COLS[key]} = ?`);
        userVals.push(value);
      } else if (PROFILE_COLS[key] && !profileSeen.has(PROFILE_COLS[key])) {
        profileSeen.add(PROFILE_COLS[key]);
        profileClauses.push(`${PROFILE_COLS[key]} = ?`);
        profileVals.push(value);
      } else if (RIDER_COLS[key] && !riderSeen.has(RIDER_COLS[key])) {
        riderSeen.add(RIDER_COLS[key]);
        riderClauses.push(`${RIDER_COLS[key]} = ?`);
        riderVals.push(value);
      }
    }

    if (userClauses.length === 0 && profileClauses.length === 0 && riderClauses.length === 0) {
      return false;
    }

    const [riderRow] = await db.query(
      'SELECT user_id FROM riders WHERE rider_id = ? AND deleted_at IS NULL LIMIT 1',
      [riderId]
    );
    if (!riderRow.length) return false;
    const userId = riderRow[0].user_id;

    if (userClauses.length > 0) {
      await db.query(
        `UPDATE users SET ${userClauses.join(', ')}, updated_at = ? WHERE user_id = ?`,
        [...userVals, updatedAt, userId]
      );
    }
    if (profileClauses.length > 0) {
      await db.query(
        `UPDATE user_profiles SET ${profileClauses.join(', ')}, updated_at = ? WHERE user_id = ?`,
        [...profileVals, updatedAt, userId]
      );
    }
    if (riderClauses.length > 0) {
      const [result] = await db.query(
        `UPDATE riders SET ${riderClauses.join(', ')}, updated_at = ? WHERE rider_id = ? AND deleted_at IS NULL`,
        [...riderVals, updatedAt, riderId]
      );
      return result.affectedRows > 0;
    }
    return true;
  }

  // ──────────────────────────────────────────────────────────
  // KYC RECORD VERIFICATION
  // ──────────────────────────────────────────────────────────

  async verifyKYCRecord(kycId, status, adminId, remarks, rejectionReason, updatedAt) {
    const statusMap = { APPROVED: 'APPROVED', REJECTED: 'REJECTED', PENDING: 'PENDING' };
    const verificationStatus = statusMap[status] || status;

    await db.query(
      `UPDATE kyc
       SET status = ?, verified_by = ?, verified_at = ?, remarks = ?, updated_at = ?
       WHERE kyc_id = ?`,
      [verificationStatus, adminId, updatedAt, remarks || rejectionReason, updatedAt, kycId]
    );

    const [kRows] = await db.query('SELECT user_id FROM kyc WHERE kyc_id = ? LIMIT 1', [kycId]);
    if (kRows.length > 0) {
      const targetUserId = kRows[0].user_id;
      const appStatus = verificationStatus === 'APPROVED' ? 'verified' : (verificationStatus === 'REJECTED' ? 'rejected' : 'pending');
      const rStatus = verificationStatus === 'APPROVED' ? 'ACTIVE' : (verificationStatus === 'REJECTED' ? 'SUSPENDED' : 'UNDER_REVIEW');

      await db.query(
        `UPDATE riders SET kyc_status = ?, application_status = ?, status = ?, updated_at = ? WHERE user_id = ?`,
        [verificationStatus, appStatus, rStatus, updatedAt, targetUserId]
      ).catch(() => {});

      await db.query(
        `UPDATE user_profiles SET kyc_status = ?, updated_at = ? WHERE user_id = ?`,
        [verificationStatus, updatedAt, targetUserId]
      ).catch(() => {});

      await db.query(
        `UPDATE user_documents SET status = ?, verified_by = ?, verified_at = ?, rejection_reason = ?, updated_at = ? WHERE user_id = ?`,
        [verificationStatus, adminId, updatedAt, rejectionReason, updatedAt, targetUserId]
      ).catch(() => {});
    }

    return true;
  }

  // ──────────────────────────────────────────────────────────
  // BRANCH ASSIGNMENT
  // ──────────────────────────────────────────────────────────

  async createBranchAssignment(data) {
    const { rider_id, branch_id, assigned_by, assigned_at } = data;

    const [rRow] = await db.query('SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1', [rider_id]);
    if (!rRow.length) throw new Error('Rider not found for branch assignment');
    const userId = rRow[0].user_id;

    const [result] = await db.query(
      `INSERT INTO branch_users (branch_id, user_id, assigned_by, assigned_at, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'ACTIVE', NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         assigned_by = VALUES(assigned_by),
         assigned_at = VALUES(assigned_at),
         status = 'ACTIVE',
         updated_at = NOW()`,
      [branch_id, userId, assigned_by, assigned_at]
    );

    await db.query(
      `UPDATE riders SET branch_id = ?, updated_at = NOW() WHERE rider_id = ?`,
      [branch_id, rider_id]
    );

    return result.insertId || result.affectedRows;
  }

  async transferBranchAssignment(riderId, toBranchId, transferReason, adminId, now) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [rRow] = await connection.query('SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1', [riderId]);
      if (!rRow.length) throw new Error('Rider not found');
      const userId = rRow[0].user_id;

      await connection.query(
        `UPDATE branch_users SET status = 'TRANSFERRED', updated_at = ?
         WHERE user_id = ? AND status = 'ACTIVE'`,
        [now, userId]
      );

      await connection.query(
        `INSERT INTO branch_users (branch_id, user_id, assigned_by, assigned_at, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'ACTIVE', NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           assigned_by = VALUES(assigned_by),
           assigned_at = VALUES(assigned_at),
           status = 'ACTIVE',
           updated_at = NOW()`,
        [toBranchId, userId, adminId, now]
      );

      await connection.query(
        `UPDATE riders SET branch_id = ?, updated_at = ? WHERE rider_id = ?`,
        [toBranchId, now, riderId]
      );

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // ──────────────────────────────────────────────────────────
  // VEHICLE ASSIGNMENT
  // ──────────────────────────────────────────────────────────

  async createVehicleAssignment(data) {
    const { vehicle_id, rider_id, assigned_by, assigned_at } = data;
    const [result] = await db.query(
      `INSERT INTO vehicle_assignments (vehicle_id, rider_id, assigned_at, assigned_by, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'ACTIVE', NOW(), NOW())`,
      [vehicle_id, rider_id, assigned_at, assigned_by]
    );
    return result.insertId;
  }

  async closeVehicleAssignment(riderId, vehicleId, removalReason, now) {
    await db.query(
      `UPDATE vehicle_assignments
       SET unassigned_at = ?, status = 'COMPLETED', updated_at = ?
       WHERE rider_id = ? AND vehicle_id = ? AND status = 'ACTIVE'`,
      [now, now, riderId, vehicleId]
    );
    return true;
  }

  // ──────────────────────────────────────────────────────────
  // VEHICLE LOOKUP
  // ──────────────────────────────────────────────────────────

  async getVehicleById(vehicleId) {
    const [rows] = await db.query('SELECT * FROM vehicles WHERE vehicle_id = ?', [vehicleId]);
    return rows.length > 0 ? rows[0] : null;
  }

  // ──────────────────────────────────────────────────────────
  // WALLET (wallets.user_id)
  // ──────────────────────────────────────────────────────────

  async getRiderWallet(riderId) {
    const [rows] = await db.query(
      `SELECT wallet_id, user_id, wallet_balance, currency, is_active, created_at, updated_at
       FROM wallets
       WHERE user_id = (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1)`,
      [riderId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // ──────────────────────────────────────────────────────────
  // PERFORMANCE (rider_performance)
  // ──────────────────────────────────────────────────────────

  async getRiderPerformance(riderId, periodType = 'MONTHLY') {
    const [rows] = await db.query(
      `SELECT perf_id, rider_id, period_date, total_trips, completed_trips,
              cancelled_trips, total_earnings, avg_rating, created_at
       FROM rider_performance
       WHERE rider_id = ?
       ORDER BY period_date DESC
       LIMIT 6`,
      [riderId]
    );
    return rows;
  }

  // ──────────────────────────────────────────────────────────
  // JOB STATISTICS (rider_job_statistics)
  // ──────────────────────────────────────────────────────────

  async getRiderJobStatistics(riderId) {
    const [rows] = await db.query(
      `SELECT stat_id, rider_id, total_jobs, completed_jobs, cancelled_jobs, total_earnings, created_at, updated_at
       FROM rider_job_statistics WHERE rider_id = ?`,
      [riderId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // ──────────────────────────────────────────────────────────
  // ACTIVITY LOGS (activity_logs)
  // ──────────────────────────────────────────────────────────

  async getRiderActivityLogs(riderId, filters = {}) {
    const { startDate, endDate, limit = 50 } = filters;
    const conditions = ['user_id = (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1)'];
    const params = [riderId];

    if (startDate) { conditions.push('created_at >= ?'); params.push(startDate); }
    if (endDate)   { conditions.push('created_at <= ?'); params.push(endDate); }

    const [rows] = await db.query(
      `SELECT log_id, action AS activity_type, description, module, entity_type, entity_id, created_at
       FROM activity_logs WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC LIMIT ?`,
      [...params, parseInt(limit)]
    );
    return rows;
  }

  // ──────────────────────────────────────────────────────────
  // LOGIN HISTORY (login_history)
  // ──────────────────────────────────────────────────────────

  async getRiderLoginHistory(riderId, limit = 20) {
    const [rows] = await db.query(
      `SELECT login_id, login_status, login_method, ip_address, device_type,
              browser, operating_system, login_at, logout_at, session_duration
       FROM login_history
       WHERE user_id = (SELECT user_id FROM riders WHERE rider_id = ? LIMIT 1)
       ORDER BY login_at DESC LIMIT ?`,
      [riderId, parseInt(limit)]
    );
    return rows;
  }
}

module.exports = new RiderRepository();
