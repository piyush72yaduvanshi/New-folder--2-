'use strict';

const db = require('../../../src/config/db');

class PaymentRepository {
  // ==================== PAYMENT QUERIES ====================

  async findById(paymentId) {
    const [rows] = await db.query(
      `SELECT 
         p.payment_id, 
         p.gateway_payment_id AS transaction_id, 
         p.user_id, 
         p.booking_id,
         p.amount, 
         p.status, 
         p.status AS payment_status,
         p.gateway AS gateway_provider, 
         p.method AS payment_method, 
         p.purpose AS payment_type,
         p.currency, 
         p.meta,
         p.created_at, 
         p.updated_at 
       FROM payments p 
       WHERE p.payment_id = ?`,
      [paymentId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByTransactionId(transactionId) {
    const [rows] = await db.query(
      `SELECT 
         p.payment_id, 
         p.gateway_payment_id AS transaction_id, 
         p.user_id, 
         p.booking_id,
         p.amount, 
         p.status, 
         p.status AS payment_status,
         p.gateway AS gateway_provider, 
         p.method AS payment_method, 
         p.purpose AS payment_type,
         p.currency, 
         p.created_at, 
         p.updated_at 
       FROM payments p 
       WHERE p.gateway_payment_id = ? OR p.gateway_order_id = ?`,
      [transactionId, transactionId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getPayments(filters = {}, pagination = {}) {
    const {
      search = '',
      status = null,
      paymentStatus = null,
      paymentMethod = null,
      paymentType = null,
      bookingId = null,
      userId = null,
      riderId = null,
      city = null,
      startDate = null,
      endDate = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    const resolvedStatus = status || paymentStatus;

    if (search) {
      conditions.push('(p.gateway_payment_id LIKE ? OR p.gateway_order_id LIKE ? OR u.full_name LIKE ? OR u.phone LIKE ?)');
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (resolvedStatus) {
      conditions.push('p.status = ?');
      params.push(resolvedStatus.toLowerCase());
    }

    if (paymentMethod) {
      conditions.push('p.method = ?');
      params.push(paymentMethod);
    }

    if (paymentType) {
      conditions.push('p.purpose = ?');
      params.push(paymentType);
    }

    if (bookingId) {
      conditions.push('p.booking_id = ?');
      params.push(bookingId);
    }

    if (userId) {
      conditions.push('p.user_id = ?');
      params.push(userId);
    }

    if (city) {
      conditions.push('up.city = ?');
      params.push(city);
    }

    if (startDate) {
      conditions.push('p.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('p.created_at <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortColumns = ['created_at', 'updated_at', 'amount', 'status'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [countResult] = await db.query(
      `SELECT COUNT(DISTINCT p.payment_id) AS total
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.user_id
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await db.query(
      `SELECT
        p.payment_id,
        p.booking_id,
        p.user_id,
        p.amount,
        p.currency,
        p.purpose AS payment_type,
        p.purpose AS reference_type,
        p.booking_id AS reference_id,
        p.status,
        p.status AS payment_status,
        p.method AS payment_method,
        p.gateway AS gateway_provider,
        p.gateway AS gateway_name,
        p.gateway_payment_id AS transaction_id,
        p.gateway_payment_id AS gateway_transaction_id,
        p.created_at,
        p.updated_at,
        u.full_name AS user_name,
        u.phone AS user_phone,
        up.city AS city,
        0 AS gateway_charges,
        0 AS platform_commission,
        0 AS rider_earning,
        0 AS refund_amount,
        NULL AS refund_status,
        1 AS verified
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.user_id
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       ${whereClause}
       ORDER BY p.${safeSortBy} ${safeSortOrder}
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

  async getPaymentDetails(paymentId) {
    const [rows] = await db.query(
      `SELECT
        p.payment_id,
        p.booking_id,
        p.user_id,
        p.amount,
        p.currency,
        p.purpose AS payment_type,
        p.purpose AS reference_type,
        p.booking_id AS reference_id,
        p.status,
        p.status AS payment_status,
        p.method AS payment_method,
        p.gateway AS gateway_provider,
        p.gateway AS gateway_name,
        p.gateway_payment_id AS transaction_id,
        p.gateway_payment_id AS gateway_transaction_id,
        p.gateway_signature,
        p.meta AS gateway_response,
        p.created_at,
        p.updated_at,
        u.full_name AS user_name,
        u.phone AS user_phone,
        u.email AS user_email,
        up.city AS city,
        1 AS verified
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.user_id
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       WHERE p.payment_id = ?`,
      [paymentId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getPaymentStatistics() {
    const [rows] = await db.query(
      `SELECT
        COUNT(*)                                                                         AS total_transactions,
        SUM(CASE WHEN status = 'paid'     THEN 1 ELSE 0 END)                            AS successful_transactions,
        SUM(CASE WHEN status = 'failed'   THEN 1 ELSE 0 END)                            AS failed_transactions,
        SUM(CASE WHEN status = 'created'  THEN 1 ELSE 0 END)                            AS pending_transactions,
        SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END)                            AS refunded_transactions,
        SUM(CASE WHEN status = 'paid'     THEN amount ELSE 0 END)                       AS total_revenue,
        SUM(CASE WHEN status = 'paid' AND DATE(created_at) = CURDATE()
                 THEN amount ELSE 0 END)                                                 AS today_revenue,
        SUM(CASE WHEN status = 'paid'
                  AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
                 THEN amount ELSE 0 END)                                                 AS weekly_revenue,
        SUM(CASE WHEN status = 'paid'
                  AND MONTH(created_at) = MONTH(CURDATE())
                  AND YEAR(created_at)  = YEAR(CURDATE())
                 THEN amount ELSE 0 END)                                                 AS monthly_revenue,
        SUM(CASE WHEN status = 'paid'
                  AND YEAR(created_at)  = YEAR(CURDATE())
                 THEN amount ELSE 0 END)                                                 AS yearly_revenue,
        AVG(CASE WHEN status = 'paid' THEN amount END)                                   AS avg_transaction
       FROM payments`
    );

    const stats = rows[0];
    const total = parseInt(stats.total_transactions) || 0;
    const successful = parseInt(stats.successful_transactions) || 0;
    const failed = parseInt(stats.failed_transactions) || 0;
    const refunded = parseInt(stats.refunded_transactions) || 0;

    const successRate = total > 0 ? ((successful / total) * 100).toFixed(2) : 0;
    const failureRate = total > 0 ? ((failed / total) * 100).toFixed(2) : 0;
    const refundRate = successful > 0 ? ((refunded / successful) * 100).toFixed(2) : 0;

    return {
      ...stats,
      total_revenue: parseFloat(stats.total_revenue) || 0,
      today_revenue: parseFloat(stats.today_revenue) || 0,
      weekly_revenue: parseFloat(stats.weekly_revenue) || 0,
      monthly_revenue: parseFloat(stats.monthly_revenue) || 0,
      yearly_revenue: parseFloat(stats.yearly_revenue) || 0,
      avg_transaction: parseFloat(stats.avg_transaction) || 0,
      success_rate: parseFloat(successRate),
      failure_rate: parseFloat(failureRate),
      refund_rate: parseFloat(refundRate)
    };
  }

  async getPaymentsForExport(filters = {}) {
    const { status = null, paymentStatus = null, paymentMethod = null, userId = null, startDate = null, endDate = null } = filters;
    const resolvedStatus = status || paymentStatus;
    const conditions = [];
    const params = [];

    if (resolvedStatus) { conditions.push('p.status = ?'); params.push(resolvedStatus.toLowerCase()); }
    if (paymentMethod)  { conditions.push('p.method = ?'); params.push(paymentMethod); }
    if (userId)         { conditions.push('p.user_id = ?'); params.push(userId); }
    if (startDate)      { conditions.push('p.created_at >= ?'); params.push(startDate); }
    if (endDate)        { conditions.push('p.created_at <= ?'); params.push(endDate); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT
        p.payment_id,
        p.gateway_payment_id AS transaction_id,
        p.purpose AS reference_type,
        p.booking_id AS reference_id,
        p.user_id,
        p.amount,
        p.status,
        p.method AS payment_method,
        p.gateway AS gateway_provider,
        p.currency,
        p.created_at,
        u.full_name AS customer_name,
        u.phone AS customer_phone
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.user_id
       ${whereClause}
       ORDER BY p.created_at DESC`,
      params
    );
    return rows;
  }

  // ==================== PAYMENT OPERATIONS ====================

  async processRefund(paymentId, refundAmount, refundReason, refundType, adminId, refundInitiatedAt) {
    const [payment] = await db.query(
      'SELECT payment_id, amount FROM payments WHERE payment_id = ?',
      [paymentId]
    );
    if (payment.length === 0) throw new Error('Payment not found');

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE payments SET status = 'refunded', updated_at = ? WHERE payment_id = ?`,
        [refundInitiatedAt || new Date(), paymentId]
      );

      await connection.query(
        `INSERT INTO payment_refunds (payment_id, amount, status, refund_reason, created_at, updated_at)
         VALUES (?, ?, 'SUCCESS', ?, NOW(), NOW())`,
        [paymentId, refundAmount || payment[0].amount, refundReason || 'Admin processed refund']
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

  async updatePaymentStatus(paymentId, newStatus, adminId, updatedAt) {
    const [payment] = await db.query(
      'SELECT payment_id FROM payments WHERE payment_id = ?',
      [paymentId]
    );
    if (payment.length === 0) throw new Error('Payment not found');

    await db.query(
      'UPDATE payments SET status = ?, updated_at = ? WHERE payment_id = ?',
      [newStatus, updatedAt || new Date(), paymentId]
    );
    return true;
  }

  async verifyPayment(paymentId, adminId, verifiedAt) {
    const [payment] = await db.query(
      'SELECT payment_id FROM payments WHERE payment_id = ?',
      [paymentId]
    );
    if (payment.length === 0) throw new Error('Payment not found');
    return true;
  }

  // ==================== USER WALLET ====================

  async getUserWallet(userId) {
    const [rows] = await db.query(
      `SELECT 
         w.wallet_id, 
         w.user_id,
         IF(w.is_active, 'ACTIVE', 'INACTIVE') AS status,
         u.full_name, 
         u.phone,
         u.phone AS phone_number, 
         u.email,
         COALESCE(w.wallet_balance, 0) AS balance,
         COALESCE((SELECT SUM(amount) FROM wallet_transactions wt WHERE wt.user_id = ? AND wt.transaction_type IN ('CREDIT', 'credit')), 0) AS total_credited,
         COALESCE((SELECT SUM(amount) FROM wallet_transactions wt WHERE wt.user_id = ? AND wt.transaction_type IN ('DEBIT', 'debit')), 0) AS total_debited,
         0 AS total_refunded, 
         0 AS total_bonus
       FROM wallets w
       INNER JOIN users u ON w.user_id = u.user_id
       WHERE w.user_id = ?`,
      [userId, userId, userId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getUserWalletTransactions(userId, limit = 50) {
    const [rows] = await db.query(
      `SELECT 
         transaction_id, 
         user_id, 
         transaction_type,
         transaction_type AS type, 
         amount,
         balance_before, 
         balance_after,
         balance_before AS opening_balance,
         balance_after AS closing_balance,
         source_type,
         source_type AS reference_type, 
         reference_id, 
         description,
         description AS note, 
         'COMPLETED' AS status,
         created_at
       FROM wallet_transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, parseInt(limit)]
    );
    return rows;
  }

  async creditUserWallet(userId, amount, description, referenceType, referenceId, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      let [wallet] = await connection.query(
        'SELECT wallet_id, wallet_balance FROM wallets WHERE user_id = ? FOR UPDATE',
        [userId]
      );

      if (wallet.length === 0) {
        const [wRes] = await connection.query(
          'INSERT INTO wallets (user_id, wallet_balance, is_active, created_at, updated_at) VALUES (?, 0.00, 1, NOW(), NOW())',
          [userId]
        );
        wallet = [{ wallet_id: wRes.insertId, wallet_balance: 0.00 }];
      }

      const balanceBefore = parseFloat(wallet[0].wallet_balance);
      const balanceAfter = balanceBefore + parseFloat(amount);

      await connection.query(
        'UPDATE wallets SET wallet_balance = ?, updated_at = NOW() WHERE wallet_id = ?',
        [balanceAfter, wallet[0].wallet_id]
      );

      await connection.query(
        `INSERT INTO wallet_transactions (
          wallet_id, user_id, transaction_type, amount, balance_before, balance_after, source_type, reference_type, reference_id, description, created_at
        ) VALUES (?, ?, 'CREDIT', ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          wallet[0].wallet_id,
          userId,
          amount,
          balanceBefore,
          balanceAfter,
          'ADMIN_CREDIT',
          referenceType || 'admin_credit',
          referenceId ? String(referenceId) : null,
          description || 'Wallet credited by admin'
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

  async debitUserWallet(userId, amount, description, referenceType, referenceId, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [wallet] = await connection.query(
        'SELECT wallet_id, wallet_balance FROM wallets WHERE user_id = ? FOR UPDATE',
        [userId]
      );

      if (wallet.length === 0) throw new Error('Wallet not found');

      const balanceBefore = parseFloat(wallet[0].wallet_balance);
      if (balanceBefore < parseFloat(amount)) {
        throw new Error('Insufficient wallet balance');
      }

      const balanceAfter = balanceBefore - parseFloat(amount);

      await connection.query(
        'UPDATE wallets SET wallet_balance = ?, updated_at = NOW() WHERE wallet_id = ?',
        [balanceAfter, wallet[0].wallet_id]
      );

      await connection.query(
        `INSERT INTO wallet_transactions (
          wallet_id, user_id, transaction_type, amount, balance_before, balance_after, source_type, reference_type, reference_id, description, created_at
        ) VALUES (?, ?, 'DEBIT', ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          wallet[0].wallet_id,
          userId,
          amount,
          balanceBefore,
          balanceAfter,
          'ADMIN_DEBIT',
          referenceType || 'admin_debit',
          referenceId ? String(referenceId) : null,
          description || 'Wallet debited by admin'
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

  // ==================== RIDER WALLET ====================

  async getRiderWallet(riderId) {
    const [rows] = await db.query(
      `SELECT 
         r.rider_id, 
         u.user_id,
         u.full_name, 
         u.phone,
         u.phone AS phone_number,
         r.rider_code,
         COALESCE(w.wallet_balance, 0) AS balance
       FROM riders r
       JOIN users u ON r.user_id = u.user_id
       LEFT JOIN wallets w ON w.user_id = u.user_id
       WHERE r.rider_id = ? OR u.user_id = ?`,
      [riderId, riderId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getRiderWalletTransactions(riderId, limit = 50) {
    const [rows] = await db.query(
      `SELECT 
         wt.transaction_id, 
         wt.user_id, 
         wt.transaction_type,
         wt.transaction_type AS type, 
         wt.amount,
         wt.balance_before, 
         wt.balance_after,
         wt.balance_before AS opening_balance, 
         wt.balance_after AS closing_balance,
         wt.source_type,
         wt.reference_type, 
         wt.reference_id, 
         wt.description,
         wt.description AS note, 
         'COMPLETED' AS status,
         wt.created_at
       FROM wallet_transactions wt
       JOIN users u ON wt.user_id = u.user_id
       LEFT JOIN riders r ON r.user_id = u.user_id
       WHERE r.rider_id = ? OR u.user_id = ?
       ORDER BY wt.created_at DESC 
       LIMIT ?`,
      [riderId, riderId, parseInt(limit)]
    );
    return rows;
  }

  async creditRiderWallet(riderId, amount, description, referenceType, referenceId, adminId) {
    const [riderRows] = await db.query(
      'SELECT r.rider_id, r.user_id FROM riders r WHERE r.rider_id = ? OR r.user_id = ?',
      [riderId, riderId]
    );
    if (riderRows.length === 0) throw new Error('Rider not found');

    const targetUserId = riderRows[0].user_id;
    return await this.creditUserWallet(targetUserId, amount, description, referenceType, referenceId, adminId);
  }

  async getTopCitiesByRevenue(startDate, endDate, limit = 10) {
    const [rows] = await db.query(
      `SELECT 
         up.city, 
         COUNT(*) AS bookings,
         SUM(p.amount) AS revenue, 
         AVG(p.amount) AS avg_revenue
       FROM payments p
       INNER JOIN users u ON p.user_id = u.user_id
       INNER JOIN user_profiles up ON u.user_id = up.user_id
       WHERE p.status = 'paid' AND up.city IS NOT NULL
         AND p.created_at BETWEEN ? AND ?
       GROUP BY up.city
       ORDER BY revenue DESC
       LIMIT ?`,
      [startDate, endDate, parseInt(limit)]
    );
    return rows;
  }

  async getTopUsersBySpending(startDate, endDate, limit = 10) {
    const [rows] = await db.query(
      `SELECT 
         p.user_id, 
         u.full_name, 
         u.phone AS phone_number, 
         u.email,
         COUNT(*) AS total_transactions,
         SUM(p.amount) AS total_spent,
         AVG(p.amount) AS avg_spent
       FROM payments p
       INNER JOIN users u ON p.user_id = u.user_id
       WHERE p.status = 'paid'
         AND p.created_at BETWEEN ? AND ?
       GROUP BY p.user_id, u.full_name, u.phone, u.email
       ORDER BY total_spent DESC
       LIMIT ?`,
      [startDate, endDate, parseInt(limit)]
    );
    return rows;
  }

  async getTopRidersByEarnings(startDate, endDate, limit = 10) {
    const [rows] = await db.query(
      `SELECT 
         r.rider_id, 
         u.full_name, 
         u.phone AS phone_number,
         r.completed_trips AS total_trips,
         r.total_earnings
       FROM riders r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.deleted_at IS NULL
       ORDER BY r.total_earnings DESC
       LIMIT ?`,
      [parseInt(limit)]
    );
    return rows;
  }

  async getPeakRevenueHours(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT 
         HOUR(created_at) AS hour,
         COUNT(*) AS transaction_count,
         SUM(amount) AS total_revenue,
         AVG(amount) AS avg_revenue
       FROM payments
       WHERE status = 'paid'
         AND created_at BETWEEN ? AND ?
       GROUP BY hour
       ORDER BY total_revenue DESC`,
      [startDate, endDate]
    );
    return rows;
  }

  async getDailyReport(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT
        DATE(created_at) AS date,
        COUNT(*) AS total_transactions,
        SUM(CASE WHEN status = 'paid'     THEN 1 ELSE 0 END) AS successful_transactions,
        SUM(CASE WHEN status = 'failed'   THEN 1 ELSE 0 END) AS failed_transactions,
        SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS refunded_transactions,
        SUM(CASE WHEN status = 'paid'     THEN amount ELSE 0 END) AS revenue,
        NULL AS commission,
        NULL AS rider_earnings,
        NULL AS total_refunds,
        AVG(CASE WHEN status = 'paid'     THEN amount END) AS avg_transaction
       FROM payments
       WHERE created_at BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [startDate, endDate]
    );
    return rows;
  }

  async getMonthlyReport(year, month) {
    const [rows] = await db.query(
      `SELECT
        DATE(created_at) AS report_date,
        COUNT(*) AS total_transactions,
        SUM(CASE WHEN status = 'paid'   THEN 1 ELSE 0 END) AS successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN status = 'paid'   THEN amount ELSE 0 END) AS daily_revenue
       FROM payments
       WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
       GROUP BY DATE(created_at)
       ORDER BY report_date ASC`,
      [year, month]
    );
    return rows;
  }

  async getYearlyReport(year) {
    const [rows] = await db.query(
      `SELECT
        MONTH(created_at) AS month,
        DATE_FORMAT(MIN(created_at), '%b %Y') AS month_label,
        COUNT(*) AS total_transactions,
        SUM(CASE WHEN status = 'paid'   THEN 1 ELSE 0 END) AS successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN status = 'paid'   THEN amount ELSE 0 END) AS monthly_revenue
       FROM payments
       WHERE YEAR(created_at) = ?
       GROUP BY MONTH(created_at)
       ORDER BY month ASC`,
      [year]
    );
    return rows;
  }

  // ==================== SETTLEMENT OPERATIONS ====================

  async getSettlements(filters = {}, pagination = {}) {
    const { status = null, riderId = null, startDate = null, endDate = null, sortBy = 'created_at', sortOrder = 'DESC' } = filters;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (status)    { conditions.push('s.status = ?');    params.push(status); }
    if (riderId)   { conditions.push('s.rider_id = ?');  params.push(riderId); }
    if (startDate) { conditions.push('s.created_at >= ?'); params.push(startDate); }
    if (endDate)   { conditions.push('s.created_at <= ?'); params.push(endDate); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const allowedSort = ['created_at', 'updated_at', 'settlement_amount', 'status', 'period_start', 'period_end'];
    const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [countResult] = await db.query(`SELECT COUNT(*) AS total FROM settlements s ${whereClause}`, params);
    const total = countResult[0].total;

    const [rows] = await db.query(
      `SELECT 
         s.*, 
         u.full_name AS rider_name, 
         u.phone AS rider_phone, 
         r.rider_code
       FROM settlements s
       INNER JOIN riders r ON s.rider_id = r.rider_id
       INNER JOIN users u ON r.user_id = u.user_id
       ${whereClause}
       ORDER BY s.${safeSortBy} ${safeSortOrder}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return { settlements: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) || 1 } };
  }

  async getSettlementDetails(settlementId) {
    const [rows] = await db.query(
      `SELECT 
         s.*, 
         u.full_name AS rider_name, 
         u.phone AS rider_phone, 
         r.rider_code
       FROM settlements s
       INNER JOIN riders r ON s.rider_id = r.rider_id
       INNER JOIN users u ON r.user_id = u.user_id
       WHERE s.settlement_id = ?`,
      [settlementId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async processSettlement(settlementId, transactionReference, utrNumber, adminId, processedAt) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [settlement] = await connection.query('SELECT * FROM settlements WHERE settlement_id = ?', [settlementId]);
      if (settlement.length === 0) throw new Error('Settlement not found');

      const s = settlement[0];

      await connection.query(
        `UPDATE settlements SET status='COMPLETED', transaction_reference=?, utr_number=?, processed_by=?, processed_at=?, completed_at=? WHERE settlement_id=?`,
        [transactionReference, utrNumber, adminId, processedAt, processedAt, settlementId]
      );

      const [rider] = await connection.query('SELECT user_id FROM riders WHERE rider_id = ?', [s.rider_id]);
      if (rider.length > 0) {
        const [wallet] = await connection.query('SELECT wallet_id, wallet_amount FROM wallets WHERE user_id = ? FOR UPDATE', [rider[0].user_id]);
        if (wallet.length > 0) {
          const balanceBefore = parseFloat(wallet[0].wallet_amount);
          const balanceAfter = Math.max(0, balanceBefore - parseFloat(s.settlement_amount));
          await connection.query(
            'UPDATE wallets SET wallet_amount = ?, updated_at = NOW() WHERE wallet_id = ?',
            [balanceAfter, wallet[0].wallet_id]
          );

          await connection.query(
            `INSERT INTO wallet_transactions (
              wallet_id, user_id, type, amount, opening_balance, closing_balance, source, reference_id, note, status, created_at
            ) VALUES (?, ?, 'debit', ?, ?, ?, 'payout', ?, ?, 'success', NOW())`,
            [
              wallet[0].wallet_id,
              rider[0].user_id,
              s.settlement_amount,
              balanceBefore,
              balanceAfter,
              settlementId,
              `Settlement ${s.settlement_code || settlementId} processed`
            ]
          );
        }
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

  // ==================== COMMISSION & ANALYTICS ====================

  async getCommissionOverview(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT 
         COUNT(*) AS total_bookings, 
         SUM(amount) AS total_revenue,
         AVG(CASE WHEN status = 'paid' THEN amount END) AS avg_transaction,
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS successful_revenue
       FROM payments
       WHERE status = 'paid' AND created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    return rows[0] || {};
  }

  async getCommissionByCity(startDate, endDate) {
    return [];
  }

  async getRevenueAnalytics(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT
        COUNT(*) AS total_transactions,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS total_revenue,
        SUM(CASE WHEN status = 'paid' AND DATE(created_at)=CURDATE() THEN amount ELSE 0 END) AS today_revenue,
        SUM(CASE WHEN status = 'paid' AND YEARWEEK(created_at,1)=YEARWEEK(CURDATE(),1) THEN amount ELSE 0 END) AS week_revenue,
        SUM(CASE WHEN status = 'paid' AND MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE()) THEN amount ELSE 0 END) AS month_revenue,
        SUM(CASE WHEN status = 'paid' AND YEAR(created_at)=YEAR(CURDATE()) THEN amount ELSE 0 END) AS year_revenue,
        AVG(CASE WHEN status = 'paid' THEN amount END) AS avg_transaction
       FROM payments
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    return rows[0] || {};
  }

  async getPaymentMethodDistribution(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT
        COALESCE(method, 'other') AS payment_method,
        COUNT(*) AS transaction_count,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS successful_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS total_amount,
        AVG(CASE WHEN status = 'paid' THEN amount END) AS avg_amount,
        ROUND(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*),0), 2) AS success_rate
       FROM payments
       WHERE created_at BETWEEN ? AND ?
       GROUP BY method
       ORDER BY transaction_count DESC`,
      [startDate, endDate]
    );
    return rows;
  }
}

module.exports = new PaymentRepository();
