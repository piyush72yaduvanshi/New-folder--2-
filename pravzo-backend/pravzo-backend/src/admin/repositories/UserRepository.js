const db = require('../../../src/config/db');

class UserRepository {
  // ==================== USER QUERIES ====================

  async findById(userId) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE user_id = ? AND deleted_at IS NULL',
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByPhone(phoneNumber) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE phone = ? AND deleted_at IS NULL',
      [phoneNumber]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByEmail(email) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getUsers(filters = {}, pagination = {}) {
    const {
      search = '',
      status = null,
      role = null,
      city = null,
      gender = null,
      verified = null,
      startDate = null,
      endDate = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    const ALLOWED_SORT_FIELDS = new Set([
      'created_at', 'updated_at', 'full_name', 'email', 'status'
    ]);
    const ALLOWED_SORT_ORDERS = new Set(['ASC', 'DESC']);
    const safeSortBy    = ALLOWED_SORT_FIELDS.has(sortBy)     ? `u.${sortBy}`   : 'u.created_at';
    const safeSortOrder = ALLOWED_SORT_ORDERS.has(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    // Base: exclude soft-deleted rows
    conditions.push('u.deleted_at IS NULL');

    if (search) {
      const cleanDigits = String(search).replace(/\D/g, '');
      if (cleanDigits.length > 0) {
        conditions.push('(u.full_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ? OR u.user_id = ? OR CAST(u.user_id AS CHAR) LIKE ?)');
        const sp = `%${search}%`;
        params.push(sp, sp, sp, parseInt(cleanDigits, 10), `%${cleanDigits}%`);
      } else {
        conditions.push('(u.full_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)');
        const sp = `%${search}%`;
        params.push(sp, sp, sp);
      }
    }

    if (status) {
      conditions.push('u.status = ?');
      params.push(status);
    }

    if (role) {
      conditions.push('r.role_name = ?');
      params.push(role);
    }

    if (city) {
      conditions.push('up.city = ?');
      params.push(city);
    }

    if (gender) {
      conditions.push('up.gender = ?');
      params.push(gender);
    }

    if (verified !== null) {
      if (verified === true || verified === 'true' || verified === '1') {
        conditions.push("up.kyc_status = 'APPROVED'");
      } else {
        conditions.push("(up.kyc_status IS NULL OR up.kyc_status != 'APPROVED')");
      }
    }

    if (startDate) {
      conditions.push('u.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('u.created_at <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await db.query(
      `SELECT
        u.user_id,
        u.full_name,
        u.phone AS phone_number,
        u.email,
        up.date_of_birth,
        up.gender,
        u.profile_image AS profile_photo,
        up.address,
        up.city,
        up.state,
        up.pincode,
        COALESCE(up.kyc_status,'NOT_SUBMITTED') AS kyc_status,
        u.is_email_verified AS email_verified,
        u.is_phone_verified AS phone_verified,
        COALESCE(w.wallet_balance, 0) AS wallet_balance,
        COALESCE(up.total_bookings, 0) AS total_bookings,
        COALESCE(up.total_spent, 0) AS total_spent,
        u.status,
        r.role_name AS role,
        u.branch_id,
        b.branch_name,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN user_profiles up ON u.user_id = up.user_id
      LEFT JOIN wallets w ON u.user_id = w.user_id
      LEFT JOIN branches b ON u.branch_id = b.branch_id
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      users: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUserProfile(userId) {
    const [rows] = await db.query(
      `SELECT u.user_id, u.full_name, u.phone AS phone_number, u.email,
              u.profile_image AS profile_photo, u.status, u.branch_id,
              u.is_email_verified AS email_verified, u.is_phone_verified AS phone_verified,
              u.last_login_at, u.created_at, u.updated_at,
              r.role_name AS role,
              up.date_of_birth, up.gender, up.address, up.city, up.state, up.pincode,
              COALESCE(up.kyc_status,'NOT_SUBMITTED') AS kyc_status,
              up.employee_id, up.job_type, up.salary,
              up.emergency_contact_name, up.emergency_contact_number,
              up.total_bookings, up.total_spent,
              COALESCE(w.wallet_balance,0) AS wallet_balance,
              b.branch_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       LEFT JOIN wallets w ON u.user_id = w.user_id
       LEFT JOIN branches b ON u.branch_id = b.branch_id
       WHERE u.user_id = ? AND u.deleted_at IS NULL`,
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getUserAddresses(userId) {
    // user_addresses table does not exist — return empty array
    return [];
  }

  async getUserDocuments(userId) {
    try {
      const [rows] = await db.query(
        `SELECT document_id, user_id, document_type, document_number, file_url, file_url_back,
                status, verified_by, verified_at, rejection_reason, created_at, updated_at
         FROM user_documents
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
      );
      return rows;
    } catch {
      return [];
    }
  }

  async getUserDevices(userId) {
    try {
      const [rows] = await db.query(
        `SELECT device_id, user_id, device_token, device_fingerprint, device_name, device_type,
                device_model, browser, operating_system, last_ip_address, last_login_at, login_count,
                is_trusted, is_active, created_at, updated_at
         FROM user_devices
         WHERE user_id = ?
         ORDER BY last_login_at DESC`,
        [userId]
      );
      return rows;
    } catch {
      return [];
    }
  }

  async getUserWalletTransactions(userId, limit = 10) {
    try {
      // Reads from wallet_transactions VIEW which maps wallet_transactions table
      const [rows] = await db.query(
        `SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
        [userId, parseInt(limit)]
      );
      return rows;
    } catch (err) {
      // VIEW may not exist yet on this DB instance — return empty gracefully
      return [];
    }
  }

  async getBookingStatistics(userId) {
    // Use bookings table (canonical rental system)
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END), 0) as total_spent
       FROM bookings 
       WHERE user_id = ?`,
      [userId]
    );
    return rows[0] || {
      total_bookings: 0,
      completed: 0,
      cancelled: 0,
      active: 0,
      total_spent: 0
    };
  }

  async getPaymentStatistics(userId) {
    // Use payments table (canonical)
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(amount), 0) as fare_amount,
        SUM(CASE WHEN status IN ('paid','captured') THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
       FROM payments 
       WHERE user_id = ?`,
      [userId]
    );
    return rows[0] || {
      total_payments: 0,
      fare_amount: 0,
      successful: 0,
      failed: 0
    };
  }

  async getSupportTicketCount(userId) {
    // Use support_tickets table
    try {
      const [rows] = await db.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open,
          SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved
         FROM support_tickets 
         WHERE user_id = ?`,
        [userId]
      );
      return rows[0] || { total: 0, open: 0, resolved: 0 };
    } catch (err) {
      return { total: 0, open: 0, resolved: 0 };
    }
  }

  async blockUser(userId, reason, blockedBy, blockedAt) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE users SET status = 'BLOCKED', updated_at = ? WHERE user_id = ?`,
        [blockedAt, userId]
      );

      // user_devices table does not exist — skip device logout

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async unblockUser(userId, unblockedAt) {
    const [result] = await db.query(
      `UPDATE users SET status = 'ACTIVE', updated_at = ? WHERE user_id = ?`,
      [unblockedAt, userId]
    );
    return result.affectedRows > 0;
  }

  async verifyUser(userId, verifiedBy, verifiedAt, remarks = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Update user status to active (if pending)
      await connection.query(
        `UPDATE users SET status = 'ACTIVE', kyc_status = 'APPROVED', updated_at = ? WHERE user_id = ?`,
        [verifiedAt, userId]
      );

      // Update user_documents
      await connection.query(
        `UPDATE user_documents SET status = 'APPROVED', verified_by = ?, verified_at = ?, updated_at = ? WHERE user_id = ?`,
        [verifiedBy, verifiedAt, verifiedAt, userId]
      ).catch(() => {});

      // Update kyc row
      await connection.query(
        `UPDATE kyc SET status = 'APPROVED', verified_by = ?, verified_at = ?, remarks = ?, updated_at = ? WHERE user_id = ?`,
        [verifiedBy, verifiedAt, remarks, verifiedAt, userId]
      ).catch(() => {});

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateUserStatus(userId, status, updatedAt) {
    const [result] = await db.query(
      `UPDATE users SET status = ?, updated_at = ? WHERE user_id = ?`,
      [status, updatedAt, userId]
    );
    return result.affectedRows > 0;
  }

  async softDeleteUser(userId, reason, deletedBy, deletedAt) {
    const [result] = await db.query(
      `UPDATE users SET deleted_at = ?, status = 'INACTIVE', updated_at = ? WHERE user_id = ?`,
      [deletedAt, deletedAt, userId]
    );
    return result.affectedRows > 0;
  }

  async getUsersForExport(filters = {}) {
    const {
      status = null,
      role = null,
      startDate = null,
      endDate = null
    } = filters;

    const conditions = [];
    const params = [];

    // Base condition
    conditions.push('deleted_at IS NULL');

    // Status filter
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    // Role filter — users table has no role column, skip
    if (role) {
      // no-op
    }

    // Date range filter
    if (startDate) {
      conditions.push('created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('created_at <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        u.user_id, u.full_name, u.phone AS phone_number, u.email,
        up.date_of_birth, up.gender,
        u.profile_image AS profile_photo, up.address, up.city, up.state, up.pincode,
        COALESCE(up.kyc_status,'NOT_SUBMITTED') AS kyc_status,
        u.is_email_verified AS email_verified, u.is_phone_verified AS phone_verified,
        COALESCE(w.wallet_balance, 0) AS wallet_balance,
        COALESCE(up.total_bookings, 0) AS total_bookings,
        COALESCE(up.total_spent, 0) AS total_spent,
        u.status, u.created_at
      FROM users u
      LEFT JOIN user_profiles up ON u.user_id = up.user_id
      LEFT JOIN wallets w ON u.user_id = w.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
    `;

    const [rows] = await db.query(query, params);
    return rows;
  }

  async getUserLoginHistory(userId, pagination = {}) {
    // user_devices table does not exist — return empty
    const { page = 1, limit = 20 } = pagination;
    return {
      loginHistory: [],
      pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 }
    };
  }

  async getUserBookings(userId, pagination = {}, filters = {}) {
    const { page = 1, limit = 20 } = pagination;
    const { status = null } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['b.user_id = ?'];
    const params = [userId];

    if (status) {
      conditions.push('b.status = ?');
      params.push(status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Use bookings table (canonical rental system)
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM bookings b ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await db.query(
      `SELECT 
        b.booking_id as trip_id, b.booking_id, b.booking_number,
        b.rider_id, b.vehicle_id,
        b.start_date, b.end_date,
        b.total_amount as fare_amount, b.total_amount,
        b.security_deposit, b.payment_status, b.status,
        NULL as pickup_address, NULL as dropoff_address,
        NULL as distance_km, NULL as duration_minutes,
        NULL as payment_method,
        NULL as accepted_at, NULL as picked_up_at,
        NULL as completed_at, NULL as cancelled_at,
        b.created_at, b.updated_at
       FROM bookings b
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      bookings: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUserPayments(userId, pagination = {}, filters = {}) {
    const { page = 1, limit = 20 } = pagination;
    const { type = null } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['user_id = ?'];
    const params = [userId];

    if (type) {
      conditions.push('method = ?');
      params.push(type);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM payments ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await db.query(
      `SELECT 
        payment_id,
        gateway_payment_id AS transaction_id,
        purpose AS reference_type,
        booking_id AS reference_id,
        amount,
        method AS payment_method,
        status,
        created_at
       FROM payments 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      payments: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  async getUserRefunds(userId, limit = 10) {
    const [rows] = await db.query(
      `SELECT 
         p.payment_id,
         p.booking_id AS reference_id,
         p.amount,
         p.method AS payment_method,
         p.status,
         p.created_at
       FROM payments p
       WHERE p.user_id = ? AND p.status = 'refunded'
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [userId, parseInt(limit)]
    );
    return rows;
  }

  async getUserActivity(userId, limit = 20) {
    const limitInt = parseInt(limit);

    const query = `
      (
        SELECT 'BOOKING_CREATED' as activity_type, booking_id as ref_id,
              CONCAT('Booking #', booking_id, ' - ', status) as description, created_at
        FROM bookings
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ${limitInt}
      )
      UNION ALL
      (
        SELECT 'PAYMENT_MADE' as activity_type, payment_id as ref_id,
              CONCAT('Payment of Rs.', amount) as description, created_at
        FROM payments
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ${limitInt}
      )
      ORDER BY created_at DESC
      LIMIT ${limitInt}
    `;

    const [rows] = await db.query(query, [userId, userId]);
    return rows;
  }

  async getUserStatistics() {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN u.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN u.status = 'BLOCKED' THEN 1 ELSE 0 END) as blocked_users,
        SUM(CASE WHEN u.status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive_users,
        SUM(CASE WHEN u.status = 'PENDING_VERIFICATION' THEN 1 ELSE 0 END) as pending_users,
        SUM(CASE WHEN up.kyc_status = 'APPROVED' THEN 1 ELSE 0 END) as verified_users,
        SUM(CASE WHEN DATE(u.created_at) = CURDATE() THEN 1 ELSE 0 END) as today_registrations,
        SUM(CASE WHEN MONTH(u.created_at) = MONTH(CURDATE()) AND YEAR(u.created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) as monthly_registrations
       FROM users u
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       WHERE u.deleted_at IS NULL`
    );

    const stats = rows[0];

    // Calculate growth percentage
    const [prevMonthResult] = await db.query(
      `SELECT COUNT(*) as prev_month_registrations
       FROM users u
       WHERE MONTH(u.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
       AND YEAR(u.created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
       AND u.deleted_at IS NULL`
    );

    const prevMonthCount = prevMonthResult[0].prev_month_registrations;
    const currentMonthCount = stats.monthly_registrations;
    const growthPercentage = prevMonthCount > 0 
      ? ((currentMonthCount - prevMonthCount) / prevMonthCount * 100).toFixed(2)
      : 0;

    return {
      ...stats,
      growth_percentage: parseFloat(growthPercentage)
    };
  }

  // ==================== ENTERPRISE USER MANAGEMENT ====================
  // ==================== KYC OPERATIONS ====================

  async submitKYC(userId, kycData) {
    const [result] = await db.query(
      `INSERT INTO kyc (user_id, status, submitted_at)
       VALUES (?, 'PENDING', NOW())
       ON DUPLICATE KEY UPDATE status='PENDING', submitted_at=NOW()`,
      [userId]
    );

    // Update user_profiles KYC status
    await db.query(
      `INSERT INTO user_profiles (user_id, kyc_status)
       VALUES (?, 'PENDING')
       ON DUPLICATE KEY UPDATE kyc_status='PENDING'`,
      [userId]
    );

    return result.insertId || userId;
  }

  async updateKYCStatus(kycId, status, adminId, remarks = null, reason = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Update KYC record in kyc table
      await connection.query(
        `UPDATE kyc 
         SET status = ?, verified_by = ?, verified_at = NOW(),
             updated_at = NOW()
         WHERE kyc_id = ?`,
        [status, adminId, kycId]
      );

      // Get user_id from KYC
      const [kycRows] = await connection.query(
        `SELECT user_id FROM kyc WHERE kyc_id = ?`,
        [kycId]
      );

      if (kycRows.length > 0) {
        const userId = kycRows[0].user_id;

        // Update user_profiles KYC status
        await connection.query(
          `INSERT INTO user_profiles (user_id, kyc_status)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE kyc_status = ?`,
          [userId, status, status]
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

  async updateKYCStatusDirect(userId, kycStatus) {
    const [result] = await db.query(
      `INSERT INTO user_profiles (user_id, kyc_status)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE kyc_status = ?, updated_at = NOW()`,
      [userId, kycStatus, kycStatus]
    );
    return result.affectedRows > 0 || result.insertId > 0;
  }

  async getKYCDetails(userId) {
    // user_kyc table does not exist — return empty array
    return [];
  }

  async getKYCById(kycId) {
    // user_kyc table does not exist — return null
    return null;
  }

  // ==================== WALLET OPERATIONS ====================

  async getWalletBalance(userId) {
    const [rows] = await db.query(
      `SELECT wallet_balance FROM wallets WHERE user_id = ?`,
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async creditWallet(userId, amount, description, referenceType, referenceId, adminId, paymentMethod = null, paymentReference = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Lock wallet row
      let walletRows;
      [walletRows] = await connection.query(
        `SELECT wallet_id, wallet_balance FROM wallets WHERE user_id = ? FOR UPDATE`,
        [userId]
      );

      let walletId, balanceBefore;
      if (walletRows.length > 0) {
        walletId = walletRows[0].wallet_id;
        balanceBefore = parseFloat(walletRows[0].wallet_balance);
      } else {
        // Auto-create wallet
        const [ins] = await connection.query(
          `INSERT INTO wallets (user_id, wallet_balance, currency, is_active) VALUES (?, 0, 'INR', 1)`,
          [userId]
        );
        walletId = ins.insertId;
        balanceBefore = 0;
      }

      const balanceAfter = balanceBefore + parseFloat(amount);

      await connection.query(
        `UPDATE wallets SET wallet_balance = ?, updated_at = NOW() WHERE wallet_id = ?`,
        [balanceAfter, walletId]
      );

      const refId = referenceId || `admin_credit_${userId}_${Date.now()}`;
      await connection.query(
        `INSERT INTO wallet_transactions
          (wallet_id, user_id, transaction_type, amount, balance_before, balance_after,
           source_type, reference_type, reference_id, description, created_at)
         VALUES (?, ?, 'CREDIT', ?, ?, ?, 'ADMIN_TOPUP', ?, ?, ?, NOW())`,
        [
          walletId,
          userId,
          parseFloat(amount),
          balanceBefore,
          balanceAfter,
          referenceType || 'ADMIN_CREDIT',
          refId,
          description || 'Admin Wallet Credit'
        ]
      );

      await connection.commit();
      return { balanceBefore, balanceAfter };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async debitWallet(userId, amount, description, referenceType, referenceId, adminId, notes = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [walletRows] = await connection.query(
        `SELECT wallet_id, wallet_balance FROM wallets WHERE user_id = ? FOR UPDATE`,
        [userId]
      );
      if (walletRows.length === 0) throw new Error('Wallet not found');
      const balanceBefore = parseFloat(walletRows[0].wallet_balance);
      const balanceAfter = balanceBefore - parseFloat(amount);

      if (balanceAfter < 0) {
        throw new Error('Insufficient wallet balance');
      }

      await connection.query(
        `UPDATE wallets SET wallet_balance = ?, updated_at = NOW() WHERE wallet_id = ?`,
        [balanceAfter, walletRows[0].wallet_id]
      );

      const refId = referenceId || `admin_debit_${userId}_${Date.now()}`;
      await connection.query(
        `INSERT INTO wallet_transactions
          (wallet_id, user_id, transaction_type, amount, balance_before, balance_after,
           source_type, reference_type, reference_id, description, created_at)
         VALUES (?, ?, 'DEBIT', ?, ?, ?, 'ADMIN_DEBIT', ?, ?, ?, NOW())`,
        [
          walletRows[0].wallet_id,
          userId,
          parseFloat(amount),
          balanceBefore,
          balanceAfter,
          referenceType || 'ADMIN_DEBIT',
          refId,
          description || notes || 'Admin Wallet Debit'
        ]
      );

      await connection.commit();
      return { balanceBefore, balanceAfter };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getWalletTransactionsDetailed(userId, pagination = {}, filters = {}) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM wallet_transactions WHERE user_id = ?',
      [userId]
    );

    const [rows] = await db.query(
      `SELECT transaction_id, wallet_id, user_id, transaction_type, amount,
              balance_before, balance_after, source_type, reference_type, reference_id,
              payment_id, booking_id, description, created_at
       FROM wallet_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC, transaction_id DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );

    return {
      transactions: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    };
  }

  async freezeWalletBalance(userId, amount, reason, freezeType, referenceType, referenceId, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [walletRows] = await connection.query(
        `SELECT wallet_id, wallet_balance, is_active FROM wallets WHERE user_id = ? FOR UPDATE`,
        [userId]
      );
      if (walletRows.length === 0) throw new Error('Wallet not found');

      const availableBalance = parseFloat(walletRows[0].wallet_balance);
      if (availableBalance < amount) {
        throw new Error('Insufficient balance to freeze');
      }

      const balanceAfter = availableBalance - parseFloat(amount);
      await connection.query(
        `UPDATE wallets SET wallet_balance = ?, updated_at = NOW() WHERE wallet_id = ?`,
        [balanceAfter, walletRows[0].wallet_id]
      );

      const refId = referenceId || `freeze_${userId}_${Date.now()}`;
      await connection.query(
        `INSERT INTO wallet_transactions
          (wallet_id, user_id, transaction_type, amount, balance_before, balance_after,
           source_type, reference_type, reference_id, description, created_at)
         VALUES (?, ?, 'DEBIT', ?, ?, ?, 'ADMIN_HOLD', ?, ?, ?, NOW())`,
        [
          walletRows[0].wallet_id,
          userId,
          parseFloat(amount),
          availableBalance,
          balanceAfter,
          referenceType || 'FREEZE',
          refId,
          reason || 'Wallet balance frozen by admin'
        ]
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

  async releaseWalletBalance(userId, amount, adminId, notes = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [walletRows] = await connection.query(
        `SELECT wallet_id, wallet_balance, is_active FROM wallets WHERE user_id = ? FOR UPDATE`,
        [userId]
      );
      if (walletRows.length === 0) throw new Error('Wallet not found');

      const balanceBefore = parseFloat(walletRows[0].wallet_balance);
      const balanceAfter = balanceBefore + parseFloat(amount);

      await connection.query(
        `UPDATE wallets SET wallet_balance = ?, updated_at = NOW() WHERE wallet_id = ?`,
        [balanceAfter, walletRows[0].wallet_id]
      );

      const refId = `release_${userId}_${Date.now()}`;
      await connection.query(
        `INSERT INTO wallet_transactions
          (wallet_id, user_id, transaction_type, amount, balance_before, balance_after,
           source_type, reference_type, reference_id, description, created_at)
         VALUES (?, ?, 'CREDIT', ?, ?, ?, 'ADMIN_RELEASE', 'RELEASE', ?, ?, NOW())`,
        [
          walletRows[0].wallet_id,
          userId,
          parseFloat(amount),
          balanceBefore,
          balanceAfter,
          refId,
          notes || 'Frozen wallet balance released by admin'
        ]
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

  // ==================== BRANCH TRANSFER ====================

  async validateBranchTransfer(userId) {
    // Check for active rentals — table may not exist yet if migration hasn't run
    let hasActiveRental = false;
    try {
      const [rentalRows] = await db.query(
        `SELECT COUNT(*) as count FROM rentals 
         WHERE user_id = ? AND status IN ('ACTIVE', 'PENDING')`,
        [userId]
      );
      hasActiveRental = rentalRows[0].count > 0;
    } catch (err) {
      if (!err.message || !err.message.includes("doesn't exist")) throw err;
      // rentals table not yet migrated — treat as no active rentals
    }

    // Check for active bookings — use bookings table (canonical)
    const [bookingRows] = await db.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE user_id = ? AND status = 'ACTIVE'`,
      [userId]
    );

    return {
      hasActiveRental,
      hasActiveBooking: bookingRows[0].count > 0,
      hasPendingSettlement: false,
      canTransfer: !hasActiveRental && bookingRows[0].count === 0
    };
  }

  async transferBranch(userId, fromBranchId, toBranchId, reason, notes, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Validate transfer conditions
      const validation = await this.validateBranchTransfer(userId);
      
      // Update existing branch_users status
      if (fromBranchId) {
        await connection.query(
          `UPDATE branch_users SET status = 'TRANSFERRED', updated_at = NOW() WHERE user_id = ? AND branch_id = ?`,
          [userId, fromBranchId]
        );
      }

      // Add new active branch_users assignment
      await connection.query(
        `INSERT INTO branch_users (branch_id, user_id, assigned_by, status, assigned_at)
         VALUES (?, ?, ?, 'ACTIVE', NOW())
         ON DUPLICATE KEY UPDATE status = 'ACTIVE', assigned_by = VALUES(assigned_by), assigned_at = NOW(), updated_at = NOW()`,
        [toBranchId, userId, adminId]
      );

      // Update user's direct branch_id
      await connection.query(
        `UPDATE users SET branch_id = ?, updated_at = NOW() WHERE user_id = ?`,
        [toBranchId, userId]
      );

      // Also update riders table branch_id if user is a rider
      await connection.query(
        `UPDATE riders SET branch_id = ?, updated_at = NOW() WHERE user_id = ?`,
        [toBranchId, userId]
      ).catch(() => {});

      await connection.commit();
      return validation;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getBranchAssignmentHistory(userId) {
    try {
      const [rows] = await db.query(
        `SELECT 
           bu.id AS assignment_id,
           bu.branch_id,
           bu.user_id,
           bu.status AS assignment_status,
           bu.assigned_at,
           b.branch_name,
           b.city,
           b.state,
           assigner.full_name AS assigned_by_name
         FROM branch_users bu
         LEFT JOIN branches b ON bu.branch_id = b.branch_id
         LEFT JOIN users assigner ON bu.assigned_by = assigner.user_id
         WHERE bu.user_id = ?
         ORDER BY bu.assigned_at DESC`,
        [userId]
      );
      return rows;
    } catch {
      return [];
    }
  }

  // ==================== ACTIVITY LOGS ====================

  async createActivityLog(logData) {
    // user_activity_logs table does not exist — no-op
    return null;
  }

  async getActivityTimeline(userId, pagination = {}, filters = {}) {
    const { page = 1, limit = 50 } = pagination;
    // user_activity_logs table does not exist — return empty
    return {
      activities: [],
      pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 }
    };
  }

  // ==================== LOGIN HISTORY ====================

  async createLoginHistory(loginData) {
    // user_login_history table does not exist — no-op
    return null;
  }

  async getLoginHistoryDetailed(userId, pagination = {}, filters = {}) {
    const { page = 1, limit = 20 } = pagination;
    // user_login_history table does not exist — return empty
    return {
      loginHistory: [],
      pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 }
    };
  }

  // ==================== DEVICE MANAGEMENT ====================

  async getUserDevicesDetailed(userId) {
    const [rows] = await db.query(
      `SELECT device_id, user_id, device_token, device_fingerprint, device_name,
              device_type, device_model, browser, operating_system, last_ip_address,
              last_login_at, login_count, is_trusted, is_active, created_at, updated_at
       FROM user_devices
       WHERE user_id = ?
       ORDER BY last_login_at DESC`,
      [userId]
    );
    return rows;
  }

  async updateDeviceStatus(deviceId, isActive) {
    const [result] = await db.query(
      `UPDATE user_devices SET is_active = ?, updated_at = NOW() WHERE device_id = ?`,
      [isActive ? 1 : 0, deviceId]
    );
    return result.affectedRows > 0;
  }

  // ==================== PASSWORD RESET ====================

  async resetUserPassword(userId, newPasswordHash, adminId) {
    // Update both password_hash (admin) and password (user backend) columns
    const [result] = await db.query(
      `UPDATE users SET password_hash = ?, password = ?, updated_at = NOW() WHERE user_id = ?`,
      [newPasswordHash, newPasswordHash, userId]
    );
    return result.affectedRows > 0;
  }

  // ==================== USER DETAILS UPDATE ====================

  async updateUserDetails(userId, updateData, adminId) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });

    fields.push('updated_at = NOW()');
    values.push(userId);

    const [result] = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // ==================== RENTALS & JOBS ====================

  async getUserRentals(userId, pagination = {}, filters = {}) {
    const { page = 1, limit = 20 } = pagination;
    const { status = null } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['r.user_id = ?'];
    const params = [userId];

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    try {
      // Get total count
      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM rentals r ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      // Get paginated data
      const [rows] = await db.query(
        `SELECT 
          r.*,
          v.model_name, v.registration_number, v.vehicle_type
         FROM rentals r
         LEFT JOIN vehicles v ON r.vehicle_id = v.vehicle_id
         ${whereClause}
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
      );

      return {
        rentals: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (err) {
      // rentals table not yet migrated — return empty result set
      if (err.message && err.message.includes("doesn't exist")) {
        return {
          rentals: [],
          pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 }
        };
      }
      throw err;
    }
  }

  async getUserJobs(userId, pagination = {}, filters = {}) {
    const { page = 1, limit = 20 } = pagination;
    const { status = null } = filters;
    const offset = (page - 1) * limit;

    // Use jobs table (canonical: assigned_rider_id)
    const conditions = ['(j.assigned_rider_id = ? OR j.assigned_rider_id = (SELECT rider_id FROM riders WHERE user_id = ? LIMIT 1))'];
    const params = [userId, userId];

    if (status) {
      conditions.push('j.status = ?');
      params.push(status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM jobs j ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await db.query(
      `SELECT * FROM jobs j
       ${whereClause}
       ORDER BY j.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      jobs: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUsersForExport(filters = {}) {
    const { status = null, role = null, startDate = null, endDate = null } = filters;
    const conditions = ['u.deleted_at IS NULL'];
    const params = [];

    if (status) {
      conditions.push('u.status = ?');
      params.push(status);
    }
    if (role) {
      conditions.push('r.role_name = ?');
      params.push(role);
    }
    if (startDate) {
      conditions.push('u.created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('u.created_at <= ?');
      params.push(endDate);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [rows] = await db.query(
      `SELECT 
         u.user_id,
         u.full_name,
         u.phone AS phone_number,
         u.email,
         u.status,
         u.created_at,
         r.role_name AS role,
         up.date_of_birth,
         up.gender,
         up.address,
         up.city,
         up.state,
         up.pincode,
         up.kyc_status,
         up.total_bookings,
         up.total_spent,
         COALESCE(w.wallet_balance, 0) AS wallet_balance
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       LEFT JOIN wallets w ON u.user_id = w.user_id
       ${whereClause}
       ORDER BY u.created_at DESC`,
      params
    );

    return rows;
  }

  async updateKYCStatusDirect(userId, status) {
    const kycStatus = status === 'APPROVED' ? 'APPROVED' : (status === 'REJECTED' ? 'REJECTED' : 'PENDING');
    await db.query(
      `UPDATE user_profiles SET kyc_status = ?, updated_at = NOW() WHERE user_id = ?`,
      [kycStatus, userId]
    ).catch(() => {});

    await db.query(
      `UPDATE kyc SET status = ?, updated_at = NOW() WHERE user_id = ?`,
      [kycStatus, userId]
    ).catch(() => {});

    await db.query(
      `UPDATE user_documents SET status = ?, updated_at = NOW() WHERE user_id = ?`,
      [kycStatus, userId]
    ).catch(() => {});

    await db.query(
      `UPDATE riders SET kyc_status = ?, updated_at = NOW() WHERE user_id = ?`,
      [kycStatus, userId]
    ).catch(() => {});

    return true;
  }

  async getKYCDetails(userId) {
    try {
      const [rows] = await db.query(
        `SELECT
           COALESCE(k.kyc_id, ud.document_id, u.user_id) AS kyc_id,
           u.user_id,
           COALESCE(ud.document_type, k.kyc_type, 'USER_KYC') AS document_type,
           COALESCE(ud.document_number, 'N/A') AS document_number,
           ud.file_url AS front_image_url,
           ud.file_url_back AS back_image_url,
           COALESCE(k.status, up.kyc_status, ud.status, 'PENDING') AS verification_status,
           k.verified_by,
           k.verified_at,
           k.remarks AS admin_remarks,
           ud.created_at,
           ud.updated_at
         FROM users u
         LEFT JOIN user_profiles up ON u.user_id = up.user_id
         LEFT JOIN user_documents ud ON u.user_id = ud.user_id
         LEFT JOIN kyc k ON u.user_id = k.user_id
         WHERE u.user_id = ?
         ORDER BY ud.created_at DESC`,
        [userId]
      );
      return rows;
    } catch {
      return [];
    }
  }

  async createActivityLog(logData) {
    try {
      const { userId, activityType, description, performedById } = logData;
      await db.query(
        `INSERT INTO activity_logs (user_id, module, action, description, created_at)
         VALUES (?, 'USERS', ?, ?, NOW())`,
        [performedById || userId, activityType || 'KYC_ACTION', description || '']
      );
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new UserRepository();


