

'use strict';

const db = require('../../../src/config/db');
const walletRepository = require('../repositories/WalletRepository');
const structuredLogger = require('../../../src/utils/structuredLogger');

class WalletService {

  
  async recordTransaction(opts) {
    const {
      userId,
      type,
      amount,
      description,
      referenceType,
      referenceId,
      performedById = null,
      performedByType = 'SYSTEM',
      notes = null,
      connection: externalConn = null
    } = opts;

    if (!userId || !type || !amount || amount <= 0) {
      throw new Error('Invalid wallet transaction parameters');
    }
    if (!['CREDIT', 'DEBIT'].includes(type)) {
      throw new Error(`Invalid transaction type: ${type}`);
    }

    const conn = externalConn || await db.getConnection();
    const ownsTransaction = !externalConn;

    try {
      if (ownsTransaction) await conn.beginTransaction();

      // ── Idempotency check via WalletRepository ─────────────────────────────
      if (referenceType && referenceId) {
        const existing = await walletRepository.findIdempotentTransaction(userId, referenceType, referenceId, conn);
        if (existing) {
          if (ownsTransaction) await conn.commit();
          structuredLogger.warn('Wallet idempotency: duplicate transaction skipped', {
            userId, referenceType, referenceId, existingId: existing.transaction_id
          });
          return {
            balanceBefore: null,
            balanceAfter: null,
            transactionId: existing.transaction_id,
            idempotent: true
          };
        }
      }

      // ── Row lock via WalletRepository ──────────────────────────────────────
      const userRow = await walletRepository.lockUserForUpdate(userId, conn);
      if (!userRow) throw new Error(`User ${userId} not found`);

      const balanceBefore = parseFloat(userRow.wallet_balance) || 0;
      let balanceAfter;

      if (type === 'CREDIT') {
        balanceAfter = parseFloat((balanceBefore + amount).toFixed(2));
      } else {
        if (balanceBefore < amount) {
          throw new Error(`Insufficient wallet balance. Available: ₹${balanceBefore}, Required: ₹${amount}`);
        }
        balanceAfter = parseFloat((balanceBefore - amount).toFixed(2));
      }

      // ── Write ledger entry FIRST (immutable record) ──────────────────────
      const transactionId = await walletRepository.insertLedgerEntry({
        userId,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        description,
        referenceType,
        referenceId,
        performedByType,
        performedById,
        notes
      }, conn);

      // ── Update balance AFTER ledger is written ─────────────────────────────
      await walletRepository.updateUserBalance(userId, balanceAfter, conn);

      if (ownsTransaction) await conn.commit();

      structuredLogger.audit(`Wallet ${type}`, {
        userId, type, amount, balanceBefore, balanceAfter,
        referenceType, referenceId, transactionId, performedById
      });

      return { balanceBefore, balanceAfter, transactionId, idempotent: false };

    } catch (error) {
      if (ownsTransaction && conn) {
        try { await conn.rollback(); } catch (_) {}
      }
      structuredLogger.error(`Wallet ${type} failed`, { userId, amount, error: error.message });
      throw error;
    } finally {
      if (ownsTransaction && conn) {
        try { conn.release(); } catch (_) {}
      }
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  /** Credit a user's wallet */
  async credit(userId, amount, description, referenceType, referenceId, adminId = null, notes = null) {
    return this.recordTransaction({
      userId, type: 'CREDIT', amount, description,
      referenceType, referenceId,
      performedById: adminId,
      performedByType: adminId ? 'ADMIN' : 'SYSTEM',
      notes
    });
  }

  /** Debit a user's wallet */
  async debit(userId, amount, description, referenceType, referenceId, adminId = null, notes = null) {
    return this.recordTransaction({
      userId, type: 'DEBIT', amount, description,
      referenceType, referenceId,
      performedById: adminId,
      performedByType: adminId ? 'ADMIN' : 'SYSTEM',
      notes
    });
  }

  /** Admin manual adjustment (can be credit or debit) */
  async adminAdjustment(userId, amount, type, reason, adminId, idempotencyKey = null) {
    if (!['CREDIT', 'DEBIT'].includes(type)) {
      throw new Error('Adjustment type must be CREDIT or DEBIT');
    }
    const safeRefId = idempotencyKey || `ADJ-${adminId}-${Date.now()}`;
    return this.recordTransaction({
      userId, type, amount,
      description: `Admin adjustment: ${reason}`,
      referenceType: 'ADMIN_ADJUSTMENT',
      referenceId: safeRefId,
      performedById: adminId,
      performedByType: 'ADMIN',
      notes: reason
    });
  }

  /** Process a refund to user wallet */
  async refund(userId, amount, bookingId, reason, adminId = null, refundId = null) {
    const safeRefundId = refundId || `REFUND-${bookingId}-${Date.now()}`;
    return this.recordTransaction({
      userId, type: 'CREDIT', amount,
      description: `Refund for booking #${bookingId}: ${reason}`,
      referenceType: 'REFUND',
      referenceId: safeRefundId,
      performedById: adminId,
      performedByType: adminId ? 'ADMIN' : 'SYSTEM',
      notes: reason
    });
  }

  /** Bonus credit (incentive/reward) */
  async bonus(userId, amount, reason, referenceId = null) {
    return this.recordTransaction({
      userId, type: 'CREDIT', amount,
      description: `Bonus: ${reason}`,
      referenceType: 'BONUS',
      referenceId: referenceId || `BONUS-${Date.now()}`,
      performedByType: 'SYSTEM',
      notes: reason
    });
  }

  /** Penalty deduction */
  async penalty(userId, amount, reason, referenceId = null, adminId = null) {
    return this.recordTransaction({
      userId, type: 'DEBIT', amount,
      description: `Penalty: ${reason}`,
      referenceType: 'PENALTY',
      referenceId: referenceId || `PENALTY-${Date.now()}`,
      performedById: adminId,
      performedByType: adminId ? 'ADMIN' : 'SYSTEM',
      notes: reason
    });
  }

  // ─── Balance & History ────────────────────────────────────────────────────────

  /** Get current wallet balance */
  async getBalance(userId) {
    const balance = await walletRepository.getBalance(userId);
    if (balance === null) throw new Error(`User ${userId} not found`);
    return balance;
  }

  /** Get wallet transaction history with pagination */
  async getHistory(userId, { page = 1, limit = 20 } = {}) {
    const { transactions, total, totalPages } = await walletRepository.getHistory(userId, page, limit);

    return {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page * limit < total,
        hasPrevious: page > 1
      }
    };
  }

  /** Derive balance from ledger (for audit/reconciliation) */
  async getDerivedBalance(userId) {
    return walletRepository.getDerivedBalance(userId);
  }
}

module.exports = new WalletService();

