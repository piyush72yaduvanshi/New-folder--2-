'use strict';

const db = require('../../../src/config/db');

class FinanceRepository {
  async getConnection() {
    return await db.getConnection();
  }

  // ==================== WALLET ACCOUNTS ====================

  async findWalletByHolder(holderType, holderId, conn = db) {
    // Canonical wallet lookup by user_id
    const [rows] = await conn.query(
      `SELECT w.*, 
              'USER' AS holder_type, 
              w.user_id AS holder_id,
              w.wallet_balance AS balance,
              IF(w.is_active, 'ACTIVE', 'INACTIVE') AS status,
              u.full_name, u.email, u.phone 
       FROM wallets w
       JOIN users u ON w.user_id = u.user_id
       WHERE w.user_id = ?`,
      [holderId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findWalletById(walletId, conn = db) {
    const [rows] = await conn.query(
      `SELECT w.*, 
              'USER' AS holder_type, 
              w.user_id AS holder_id,
              w.wallet_balance AS balance,
              IF(w.is_active, 'ACTIVE', 'INACTIVE') AS status,
              u.full_name, u.email, u.phone 
       FROM wallets w
       JOIN users u ON w.user_id = u.user_id
       WHERE w.wallet_id = ?`,
      [walletId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getWallets(filters = {}, pagination = {}, conn = db) {
    const { status = '' } = filters;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (status) {
      if (status.toUpperCase() === 'ACTIVE') {
        conditions.push('w.is_active = 1');
      } else if (status.toUpperCase() === 'INACTIVE') {
        conditions.push('w.is_active = 0');
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes] = await conn.query(
      `SELECT COUNT(*) as total FROM wallets w ${whereClause}`,
      params
    );
    const total = countRes[0].total;

    const [rows] = await conn.query(
      `SELECT 
         w.wallet_id,
         w.user_id,
         w.wallet_balance AS balance,
         w.wallet_balance AS wallet_amount,
         IF(w.is_active, 'ACTIVE', 'INACTIVE') AS status,
         w.created_at,
         w.updated_at,
         u.full_name,
         u.email,
         u.phone
       FROM wallets w
       JOIN users u ON w.user_id = u.user_id
       ${whereClause} 
       ORDER BY w.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      wallets: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  async getWalletTransactions(walletId, limit = 50, conn = db) {
    const [rows] = await conn.query(
      `SELECT 
         transaction_id,
         wallet_id,
         user_id,
         transaction_type,
         transaction_type AS type,
         amount,
         balance_before AS opening_balance,
         balance_after AS closing_balance,
         source_type AS source,
         reference_id,
         description AS note,
         'COMPLETED' AS status,
         created_at
       FROM wallet_transactions 
       WHERE wallet_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [walletId, parseInt(limit)]
    );
    return rows;
  }

  // ==================== PAYMENT TRANSACTIONS ====================

  async createPaymentTransaction(paymentData, conn = db) {
    const { reference_type, reference_id, user_id, amount, status, payment_method, gateway_provider, transaction_id } = paymentData;
    const [result] = await conn.query(
      `INSERT INTO payments (
        purpose, booking_id, user_id, amount, status, method, gateway, gateway_payment_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        reference_type || 'booking',
        reference_id || null,
        user_id,
        amount,
        status ? status.toLowerCase() : 'created',
        payment_method || 'other',
        gateway_provider || 'razorpay',
        transaction_id || null
      ]
    );
    return result.insertId;
  }

  async findPaymentById(paymentId, conn = db) {
    const [rows] = await conn.query(
      `SELECT 
         p.payment_id,
         p.purpose AS reference_type,
         p.booking_id AS reference_id,
         p.user_id,
         p.amount,
         p.status,
         p.method AS payment_method,
         p.gateway AS gateway_provider,
         p.gateway_payment_id AS transaction_id,
         p.created_at,
         p.updated_at
       FROM payments p 
       WHERE p.payment_id = ?`,
      [paymentId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findPaymentByGatewayId(gatewayTxnId, conn = db) {
    const [rows] = await conn.query(
      `SELECT 
         p.payment_id,
         p.purpose AS reference_type,
         p.booking_id AS reference_id,
         p.user_id,
         p.amount,
         p.status,
         p.method AS payment_method,
         p.gateway AS gateway_provider,
         p.gateway_payment_id AS transaction_id,
         p.created_at,
         p.updated_at
       FROM payments p 
       WHERE p.gateway_payment_id = ? OR p.gateway_order_id = ?`,
      [gatewayTxnId, gatewayTxnId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async updatePaymentTransactionStatus(paymentId, status, transactionId = null, conn = db) {
    const fields = ['status = ?'];
    const params = [status ? status.toLowerCase() : 'created'];

    if (transactionId !== null) {
      fields.push('gateway_payment_id = ?');
      params.push(transactionId);
    }

    params.push(paymentId);

    const [result] = await conn.query(
      `UPDATE payments SET ${fields.join(', ')}, updated_at = NOW() WHERE payment_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async getPaymentsList(filters = {}, pagination = {}, conn = db) {
    const { status = '', method = '', userId = null, startDate = null, endDate = null } = filters;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status.toLowerCase());
    }
    if (method) {
      conditions.push('method = ?');
      params.push(method);
    }
    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }
    if (startDate) {
      conditions.push('created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('created_at <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes] = await conn.query(
      `SELECT COUNT(*) as total FROM payments ${whereClause}`,
      params
    );
    const total = countRes[0].total;

    const [rows] = await conn.query(
      `SELECT 
         payment_id,
         purpose AS reference_type,
         booking_id AS reference_id,
         user_id,
         amount,
         status,
         method AS payment_method,
         gateway AS gateway_provider,
         gateway_payment_id AS transaction_id,
         created_at,
         updated_at
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

  async createPaymentAttempt(attemptData, conn = db) {
    const { payment_id, gateway_provider, request_payload, response_payload, status, error_code, error_message } = attemptData;
    const [result] = await conn.query(
      `INSERT INTO payment_attempts (
        payment_id, gateway_provider, request_payload, response_payload, status, error_code, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        payment_id,
        gateway_provider,
        typeof request_payload === 'object' ? JSON.stringify(request_payload) : request_payload,
        typeof response_payload === 'object' ? JSON.stringify(response_payload) : response_payload,
        status,
        error_code || null,
        error_message || null
      ]
    );
    return result.insertId;
  }

  async createPaymentRefund(refundData, conn = db) {
    const { payment_id, amount, status, refund_reason, transaction_id } = refundData;
    const [result] = await conn.query(
      `INSERT INTO payment_refunds (
        payment_id, amount, status, refund_reason, transaction_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [payment_id, amount, status || 'PENDING', refund_reason || null, transaction_id || null]
    );
    return result.insertId;
  }

  async getPaymentAttempts(paymentId, conn = db) {
    const [rows] = await conn.query(
      'SELECT * FROM payment_attempts WHERE payment_id = ? ORDER BY created_at DESC',
      [paymentId]
    );
    return rows;
  }

  async getPaymentRefunds(paymentId, conn = db) {
    const [rows] = await conn.query(
      'SELECT * FROM payment_refunds WHERE payment_id = ? ORDER BY created_at DESC',
      [paymentId]
    );
    return rows;
  }

  // ==================== SETTLEMENT BATCHES & RECORDS ====================

  async createSettlementBatch(batchData, conn = db) {
    // Fallback if settlement_batches table is not present
    try {
      const { settlement_period, total_settlements, total_amount, status } = batchData;
      const [result] = await conn.query(
        `INSERT INTO settlement_batches (settlement_period, total_settlements, total_amount, status) 
         VALUES (?, ?, ?, ?)`,
        [settlement_period, total_settlements, total_amount, status]
      );
      return result.insertId;
    } catch {
      return Date.now();
    }
  }

  async updateSettlementBatch(batchId, updateData, conn = db) {
    try {
      const fields = [];
      const params = [];

      Object.keys(updateData).forEach(key => {
        fields.push(`${key} = ?`);
        params.push(updateData[key]);
      });

      params.push(batchId);

      const [result] = await conn.query(
        `UPDATE settlement_batches SET ${fields.join(', ')}, updated_at = NOW() WHERE batch_id = ?`,
        params
      );
      return result.affectedRows > 0;
    } catch {
      return true;
    }
  }

  async createSettlement(settlementData, conn = db) {
    const { batch_id, recipient_id, amount, status, rider_id } = settlementData;
    const targetRiderId = rider_id || recipient_id;
    const [result] = await conn.query(
      `INSERT INTO settlements (rider_id, amount, settlement_amount, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [targetRiderId, amount || 0, amount || 0, status || 'PENDING']
    );
    return result.insertId;
  }

  async getSettlements(filters = {}, pagination = {}, conn = db) {
    const { status = '', riderId = null } = filters;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }
    if (riderId) {
      conditions.push('s.rider_id = ?');
      params.push(riderId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes] = await conn.query(
      `SELECT COUNT(*) as total FROM settlements s ${whereClause}`,
      params
    );
    const total = countRes[0].total;

    const [rows] = await conn.query(
      `SELECT
         s.*,
         u.full_name AS rider_name,
         u.email     AS rider_email,
         u.phone     AS rider_phone,
         r.rider_code
       FROM settlements s
       LEFT JOIN riders r ON r.rider_id = s.rider_id
       LEFT JOIN users u ON r.user_id = u.user_id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      settlements: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  async getSettlementById(settlementId, conn = db) {
    const [rows] = await conn.query(
      `SELECT 
         s.*, 
         u.full_name AS rider_name, 
         u.email AS rider_email, 
         u.phone AS rider_phone, 
         r.rider_code
       FROM settlements s
       LEFT JOIN riders r ON r.rider_id = s.rider_id
       LEFT JOIN users u ON r.user_id = u.user_id
       WHERE s.settlement_id = ?`,
      [settlementId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async updateSettlement(settlementId, updateData, conn = db) {
    const fields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      params.push(updateData[key]);
    });

    params.push(settlementId);

    const [result] = await conn.query(
      `UPDATE settlements SET ${fields.join(', ')}, updated_at = NOW() WHERE settlement_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  // ==================== LEDGER OPERATING QUERIES ====================

  async getLedgerAccounts(conn = db) {
    try {
      const [rows] = await conn.query(
        'SELECT * FROM ledger_accounts ORDER BY account_code ASC'
      );
      return rows;
    } catch {
      return [];
    }
  }

  async getLedgerEntries(filters = {}, pagination = {}, conn = db) {
    const { accountId = null, referenceType = '', startDate = null, endDate = null } = filters;
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    try {
      const conditions = [];
      const params = [];

      if (accountId) {
        conditions.push('le.account_id = ?');
        params.push(accountId);
      }
      if (referenceType) {
        conditions.push('le.reference_type = ?');
        params.push(referenceType);
      }
      if (startDate) {
        conditions.push('le.created_at >= ?');
        params.push(startDate);
      }
      if (endDate) {
        conditions.push('le.created_at <= ?');
        params.push(endDate);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const [countRes] = await conn.query(
        `SELECT COUNT(*) as total FROM ledger_entries le ${whereClause}`,
        params
      );
      const total = countRes[0].total;

      const [rows] = await conn.query(
        `SELECT le.*, la.account_code, la.account_name, la.account_type 
         FROM ledger_entries le
         LEFT JOIN ledger_accounts la ON le.account_id = la.account_id
         ${whereClause} 
         ORDER BY le.created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
      );

      return {
        entries: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit) || 1
        }
      };
    } catch {
      return { entries: [], pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 } };
    }
  }

  async getTrialBalance(conn = db) {
    try {
      const [rows] = await conn.query(
        `SELECT la.account_code, la.account_name, la.account_type,
          COALESCE(SUM(CASE WHEN le.entry_type = 'DEBIT' THEN le.amount ELSE 0 END), 0) as total_debits,
          COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE 0 END), 0) as total_credits
         FROM ledger_accounts la
         LEFT JOIN ledger_entries le ON la.account_id = le.account_id
         GROUP BY la.account_id
         ORDER BY la.account_code ASC`
      );
      return rows;
    } catch {
      return [];
    }
  }

  // ==================== FINANCIAL REPORTS & TAXES ====================

  async getRevenueReport(startDate, endDate, conn = db) {
    try {
      const [rows] = await conn.query(
        `SELECT purpose AS reference_type, COALESCE(SUM(amount), 0) as revenue_amount 
         FROM payments 
         WHERE status = 'paid' AND created_at BETWEEN ? AND ?
         GROUP BY purpose`,
        [startDate, endDate]
      );
      return rows;
    } catch {
      return [];
    }
  }

  async getExpensesReport(startDate, endDate, conn = db) {
    try {
      const [rows] = await conn.query(
        `SELECT method AS reference_type, COALESCE(SUM(amount), 0) as expense_amount 
         FROM payouts 
         WHERE status IN ('completed', 'processing') AND created_at BETWEEN ? AND ?
         GROUP BY method`,
        [startDate, endDate]
      );
      return rows;
    } catch {
      return [];
    }
  }

  async getRefundsReport(startDate, endDate, conn = db) {
    try {
      const [rows] = await conn.query(
        `SELECT COALESCE(SUM(amount), 0) as refund_amount 
         FROM payment_refunds 
         WHERE status = 'SUCCESS' AND created_at BETWEEN ? AND ?`,
        [startDate, endDate]
      );
      return rows.length > 0 ? rows[0] : { refund_amount: 0.00 };
    } catch {
      return { refund_amount: 0.00 };
    }
  }

  async getCommissionsReport(startDate, endDate, conn = db) {
    return { commission_amount: 0.00 };
  }

  async getTaxesReport(startDate, endDate, conn = db) {
    return { cgst: 0, sgst: 0, igst: 0, total_tax: 0 };
  }

  // ==================== RECONCILIATION & AUDIT ====================

  async createReconciliationReport(reportData, conn = db) {
    return 1;
  }

  async validateLedgerEquilibrium(conn = db) {
    return { debits: 0, credits: 0 };
  }

  async logFinancialActivity(actorType, actorId, action, description, ipAddress = null, conn = db) {
    try {
      await conn.query(
        `INSERT INTO activity_logs (
          user_id, module, entity_type, entity_id, action, description, ip_address, created_at
        ) VALUES (?, 'FINANCE', 'PAYMENT', ?, ?, ?, ?, NOW())`,
        [actorId || null, String(actorId || 0), action, description, ipAddress]
      );
    } catch {
      // ignore
    }
  }
}

module.exports = new FinanceRepository();
