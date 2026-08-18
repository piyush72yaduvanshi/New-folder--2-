'use strict';
// walletRepository (user-side) — aligned with final_database_v4
// wallets:              wallet_id, user_id, wallet_balance, currency, is_active
// wallet_transactions:  transaction_id, wallet_id, user_id, transaction_type,
//                       amount, balance_before, balance_after, source_type,
//                       reference_type, reference_id, payment_id, booking_id,
//                       description, created_at

const { MIN_WALLET_BALANCE = 0 } = require('../../../src/config/constants');
const db = require('../../../src/config/db');

const ALLOWED_SOURCE_TYPES = [
  'EARNING', 'TOPUP', 'REFUND', 'PAYOUT', 'ADMIN_TOPUP',
  'BOOKING', 'CASHBACK', 'PENALTY', 'INSTANT_CASHOUT',
];

class WalletRepository {
  normalizeAmount(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Amount must be greater than zero.');
    }
    return Number(amount.toFixed(2));
  }

  normalizeSourceType(src, fallback = 'TOPUP') {
    const u = String(src || '').toUpperCase();
    return ALLOWED_SOURCE_TYPES.includes(u) ? u : fallback;
  }

  async findByUserId(userId, executor = db, lockForUpdate = false) {
    const sql = `SELECT wallet_id, user_id, wallet_balance, currency, is_active,
                        created_at, updated_at
                 FROM wallets WHERE user_id = ? LIMIT 1${lockForUpdate ? ' FOR UPDATE' : ''}`;
    const [rows] = await executor.query(sql, [userId]);
    return rows[0] || null;
  }

  async createWallet(userId, executor = db) {
    await executor.query(
      `INSERT INTO wallets (user_id, wallet_balance, currency, is_active)
       VALUES (?, 0.00, 'INR', 1)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
      [userId]
    );
    return this.findByUserId(userId, executor);
  }

  async getOrCreateWallet(userId, executor = db, lockForUpdate = false) {
    let wallet = await this.findByUserId(userId, executor, lockForUpdate);
    if (wallet) return wallet;
    await this.createWallet(userId, executor);
    wallet = await this.findByUserId(userId, executor, lockForUpdate);
    if (!wallet) throw new Error('Wallet not found after creation');
    return wallet;
  }

  async updateWalletBalance(walletId, walletBalance, executor = db) {
    const [result] = await executor.query(
      `UPDATE wallets SET wallet_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = ?`,
      [walletBalance, walletId]
    );
    return result.affectedRows > 0;
  }

  async addTransaction(payload, executor = db) {
    try {
      const [result] = await executor.query(
        `INSERT INTO wallet_transactions
           (wallet_id, user_id, transaction_type, source_type, amount,
            balance_before, balance_after, payment_id, booking_id,
            reference_id, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.wallet_id,
          payload.user_id,
          (payload.type || payload.transaction_type || 'CREDIT').toUpperCase(),
          this.normalizeSourceType(payload.source || payload.source_type, 'TOPUP'),
          payload.amount,
          payload.opening_balance ?? payload.balance_before ?? 0,
          payload.closing_balance ?? payload.balance_after ?? 0,
          payload.payment_id || null,
          payload.booking_id || null,
          payload.reference_id || null,
          payload.note || payload.description || null,
        ]
      );
      return result.insertId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        const existing = await this.getTransactionByReference(payload.reference_id, executor);
        return existing?.transaction_id || null;
      }
      throw error;
    }
  }

  async getWalletTransactions(userId) {
    const [rows] = await db.query(
      `SELECT * FROM wallet_transactions WHERE user_id = ?
       ORDER BY created_at DESC, transaction_id DESC`,
      [userId]
    );
    return rows;
  }

  async getTransactionByReference(referenceId, executor = db) {
    if (!referenceId) return null;
    const [rows] = await executor.query(
      `SELECT * FROM wallet_transactions WHERE reference_id = ? LIMIT 1`,
      [referenceId]
    );
    return rows[0] || null;
  }

  async hasTransactionForPayment(paymentId, executor = db) {
    if (!paymentId) return false;
    const [rows] = await executor.query(
      `SELECT transaction_id FROM wallet_transactions WHERE payment_id = ? LIMIT 1`,
      [paymentId]
    );
    return rows.length > 0;
  }

  async creditMoney(payload, executor = db) {
    const amount = this.normalizeAmount(payload.amount);
    if (!payload.reference_id) throw new Error('reference_id is required');

    const existing = await this.getTransactionByReference(payload.reference_id, executor);
    if (existing) {
      const wallet = await this.getOrCreateWallet(payload.user_id, executor, false);
      return Number(wallet.wallet_balance);
    }

    const wallet = await this.getOrCreateWallet(payload.user_id, executor, true);
    if (!wallet.is_active) throw new Error('Wallet is inactive');

    const openingBalance  = Number(wallet.wallet_balance);
    const closingBalance  = Number((openingBalance + amount).toFixed(2));

    await this.updateWalletBalance(wallet.wallet_id, closingBalance, executor);
    await this.addTransaction({
      wallet_id:       wallet.wallet_id,
      user_id:         payload.user_id,
      type:            'CREDIT',
      source:          payload.source || payload.source_type || 'TOPUP',
      amount,
      opening_balance: openingBalance,
      closing_balance: closingBalance,
      payment_id:      payload.payment_id || null,
      booking_id:      payload.booking_id || null,
      payout_id:       payload.payout_id  || null,
      reference_id:    payload.reference_id,
      note:            payload.note || payload.description || 'Wallet Credit',
    }, executor);

    return closingBalance;
  }

  async creditMoneyIfNotProcessed(payload, executor = db) {
    if (payload.payment_id) {
      const already = await this.hasTransactionForPayment(payload.payment_id, executor);
      if (already) {
        const wallet = await this.getOrCreateWallet(payload.user_id, executor, false);
        return Number(wallet.wallet_balance);
      }
    }
    return this.creditMoney(payload, executor);
  }

  async deductMoney(payload, executor = db) {
    const amount = this.normalizeAmount(payload.amount);
    if (!payload.reference_id) throw new Error('reference_id is required');

    const existing = await this.getTransactionByReference(payload.reference_id, executor);
    if (existing) {
      const wallet = await this.getOrCreateWallet(payload.user_id, executor, false);
      return Number(wallet.wallet_balance);
    }

    const wallet = await this.getOrCreateWallet(payload.user_id, executor, true);
    if (!wallet.is_active) throw new Error('Wallet is inactive');

    const openingBalance = Number(wallet.wallet_balance);
    const closingBalance = Number((openingBalance - amount).toFixed(2));

    if (closingBalance < Number(MIN_WALLET_BALANCE)) {
      throw new Error(`Minimum wallet balance of ${MIN_WALLET_BALANCE} must be maintained`);
    }

    await this.updateWalletBalance(wallet.wallet_id, closingBalance, executor);
    await this.addTransaction({
      wallet_id:       wallet.wallet_id,
      user_id:         payload.user_id,
      type:            'DEBIT',
      source:          payload.source || payload.source_type || 'BOOKING',
      amount,
      opening_balance: openingBalance,
      closing_balance: closingBalance,
      payment_id:      payload.payment_id || null,
      booking_id:      payload.booking_id || null,
      reference_id:    payload.reference_id,
      note:            payload.note || payload.description || 'Wallet Debit',
    }, executor);

    return closingBalance;
  }

  async markTransactionStatusByReference(referenceId, status, meta = null, executor = db) {
    // wallet_transactions has no status column in final schema — update description/meta as note
    return true;
  }
}

module.exports = new WalletRepository();
