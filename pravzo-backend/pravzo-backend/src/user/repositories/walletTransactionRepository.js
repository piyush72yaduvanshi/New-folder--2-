'use strict';
// walletTransactionRepository — aligned with final_database_v4
// wallet_transactions columns: transaction_id, wallet_id, user_id,
//   transaction_type, amount, balance_before, balance_after,
//   source_type, reference_type, reference_id, payment_id,
//   booking_id, description, created_at

const db = require('../../../src/config/db');
const WalletTransaction = require('../models/WalletTransaction');

class WalletTransactionRepository {
  async create(payload, executor = db) {
    const [result] = await executor.query(
      `INSERT INTO wallet_transactions
       (wallet_id, user_id, transaction_type, source_type, amount,
        balance_before, balance_after, payment_id, booking_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.wallet_id,
        payload.user_id,
        (payload.type || payload.transaction_type || 'CREDIT').toUpperCase(),
        (payload.source || payload.source_type || 'TOPUP').toUpperCase(),
        payload.amount,
        payload.opening_balance ?? payload.balance_before ?? 0,
        payload.closing_balance ?? payload.balance_after ?? 0,
        payload.payment_id || null,
        payload.booking_id || null,
        payload.note || payload.description || null,
      ],
    );
    return result.insertId;
  }

  async findById(transactionId, executor = db) {
    const [rows] = await executor.query(
      `SELECT * FROM wallet_transactions WHERE transaction_id = ? LIMIT 1`,
      [transactionId],
    );
    if (rows.length === 0) return null;
    return new WalletTransaction(rows[0]);
  }

  async findByPaymentId(paymentId, executor = db) {
    const [rows] = await executor.query(
      `SELECT * FROM wallet_transactions WHERE payment_id = ? LIMIT 1`,
      [paymentId],
    );
    if (rows.length === 0) return null;
    return new WalletTransaction(rows[0]);
  }

  async listByUserId(userId, executor = db) {
    const [rows] = await executor.query(
      `SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map((row) => new WalletTransaction(row));
  }

  async listByWalletId(walletId, executor = db) {
    const [rows] = await executor.query(
      `SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC`,
      [walletId],
    );
    return rows.map((row) => new WalletTransaction(row));
  }

  async hasTransactionForPayment(paymentId, executor = db) {
    if (!paymentId) return false;
    const [rows] = await executor.query(
      `SELECT transaction_id FROM wallet_transactions WHERE payment_id = ? LIMIT 1`,
      [paymentId],
    );
    return rows.length > 0;
  }
}

module.exports = new WalletTransactionRepository();
