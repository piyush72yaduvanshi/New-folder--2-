'use strict';

const db = require('../../../src/config/db');

class WalletRepository {

  async findIdempotentTransaction(userId, referenceType, referenceId, conn = null) {
    const executor = conn || db;
    try {
      const [rows] = await executor.query(
        `SELECT transaction_id, balance_before, balance_after
         FROM wallet_transactions
         WHERE user_id = ? AND reference_id = ?
         LIMIT 1`,
        [userId, referenceId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch {
      return null;
    }
  }


  async lockUserForUpdate(userId, conn) {
    let [rows] = await conn.query(
      'SELECT wallet_id, user_id, wallet_balance, currency, is_active FROM wallets WHERE user_id = ? FOR UPDATE',
      [userId]
    );

    if (rows.length === 0) {
      // Auto-create wallet if not yet present
      await conn.query(
        `INSERT INTO wallets (user_id, wallet_balance, currency, is_active)
         VALUES (?, 0.00, 'INR', 1)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
        [userId]
      );

      [rows] = await conn.query(
        'SELECT wallet_id, user_id, wallet_balance, currency, is_active FROM wallets WHERE user_id = ? FOR UPDATE',
        [userId]
      );
    }

    return rows.length > 0 ? rows[0] : null;
  }


  async insertLedgerEntry(entryData, conn) {
    const {
      userId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      description,
      referenceType,
      referenceId,
      paymentId,
      bookingId,
      notes
    } = entryData;

    // Resolve or create wallet_id
    let [walletRows] = await conn.query(
      'SELECT wallet_id FROM wallets WHERE user_id = ? LIMIT 1',
      [userId]
    );

    let walletId;
    if (walletRows.length > 0) {
      walletId = walletRows[0].wallet_id;
    } else {
      const [ins] = await conn.query(
        `INSERT INTO wallets (user_id, wallet_balance, currency, is_active)
         VALUES (?, ?, 'INR', 1)`,
        [userId, balanceAfter]
      );
      walletId = ins.insertId;
    }

    const refType = referenceType || (type === 'CREDIT' ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT');
    const refId = referenceId || `admin_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const txType = (type || 'CREDIT').toUpperCase();

    const [result] = await conn.query(
      `INSERT INTO wallet_transactions
        (wallet_id, user_id, transaction_type, amount, balance_before, balance_after,
         source_type, reference_type, reference_id, payment_id, booking_id, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        walletId,
        userId,
        txType,
        amount,
        balanceBefore,
        balanceAfter,
        refType,
        refType,
        refId,
        paymentId || null,
        bookingId || null,
        description || notes || null
      ]
    );

    return result.insertId;
  }


  async updateUserBalance(userId, newBalance, conn) {
    const executor = conn || db;
    const [result] = await executor.query(
      `UPDATE wallets SET wallet_balance = ?, updated_at = NOW() WHERE user_id = ?`,
      [newBalance, userId]
    );
    return result.affectedRows > 0;
  }

  async getBalance(userId) {
    const [rows] = await db.query(
      'SELECT wallet_balance FROM wallets WHERE user_id = ?',
      [userId]
    );
    return rows.length > 0 ? parseFloat(rows[0].wallet_balance) || 0 : 0;
  }

  async getHistory(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    try {
      const [[{ total }]] = await db.query(
        'SELECT COUNT(*) as total FROM wallet_transactions WHERE user_id = ?',
        [userId]
      );

      const [rows] = await db.query(
        `SELECT
           transaction_id,
           wallet_id,
           user_id,
           transaction_type,
           amount,
           balance_before,
           balance_after,
           source_type,
           reference_type,
           reference_id,
           payment_id,
           booking_id,
           description,
           created_at
         FROM wallet_transactions
         WHERE user_id = ?
         ORDER BY created_at DESC, transaction_id DESC
         LIMIT ? OFFSET ?`,
        [userId, parseInt(limit), offset]
      );

      return {
        transactions: rows,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch {
      return { transactions: [], total: 0, totalPages: 0 };
    }
  }


  async getDerivedBalance(userId) {
    const [rows] = await db.query(
      `SELECT
         SUM(CASE WHEN transaction_type = 'CREDIT' THEN amount ELSE 0 END) as total_credits,
         SUM(CASE WHEN transaction_type = 'DEBIT'  THEN amount ELSE 0 END) as total_debits
       FROM wallet_transactions
       WHERE user_id = ?`,
      [userId]
    );
    const credits = parseFloat(rows[0]?.total_credits) || 0;
    const debits  = parseFloat(rows[0]?.total_debits)  || 0;
    return parseFloat((credits - debits).toFixed(2));
  }
}

module.exports = new WalletRepository();
