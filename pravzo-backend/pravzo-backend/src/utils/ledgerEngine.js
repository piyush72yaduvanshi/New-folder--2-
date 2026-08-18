const db = require('../config/db');
const crypto = require('crypto');
const logger = require('./logger');

class LedgerEngine {
  // Mapping of holder types to liability account codes
  static getWalletAccountCode(holderType) {
    const mapping = {
      'CUSTOMER': '2000-CUSTOMER-WALLETS',
      'RIDER': '2010-RIDER-WALLETS',
      'BRANCH': '2020-BRANCH-WALLETS',
      'PARTNER': '2030-PARTNER-WALLETS',
      'ADMIN': '2040-ADMIN-WALLETS',
      'PLATFORM': '2050-PLATFORM-WALLETS'
    };
    return mapping[holderType.toUpperCase()] || '2000-CUSTOMER-WALLETS';
  }

  // Instance wrapper so callers using the exported singleton still work
  getWalletAccountCode(holderType) {
    return LedgerEngine.getWalletAccountCode(holderType);
  }


  async postDoubleEntry(entries, referenceType, referenceId, description, conn) {
    if (!conn) {
      throw new Error('LedgerEngine requires a transactional connection to run');
    }

    // 1. Verify entries are not empty
    if (!entries || entries.length < 2) {
      throw new Error('Double-entry bookkeeping requires at least 2 entries');
    }

    // 2. Validate Debits vs Credits balance
    let debitSum = 0;
    let creditSum = 0;

    for (const entry of entries) {
      const amount = parseFloat(entry.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error(`Invalid transaction amount: ${entry.amount}`);
      }

      if (entry.entryType === 'DEBIT') {
        debitSum += amount;
      } else if (entry.entryType === 'CREDIT') {
        creditSum += amount;
      } else {
        throw new Error(`Invalid entry type: ${entry.entryType}`);
      }
    }

    // Account for float precision issues (round to 4 decimals)
    if (Math.abs(debitSum - creditSum) > 0.0001) {
      throw new Error(`Ledger is out of balance. Debits: ${debitSum.toFixed(4)}, Credits: ${creditSum.toFixed(4)}`);
    }

    const entryGroupId = crypto.randomUUID();

    // 3. Post each entry
    for (const entry of entries) {
      // Find ledger account ID
      const [accountRows] = await conn.query(
        'SELECT account_id FROM ledger_accounts WHERE account_code = ?',
        [entry.accountCode]
      );

      if (accountRows.length === 0) {
        throw new Error(`Ledger account not found for code: ${entry.accountCode}`);
      }

      const accountId = accountRows[0].account_id;

      // Insert ledger entry
      await conn.query(
        `INSERT INTO ledger_entries (
          entry_group_id, account_id, holder_type, holder_id, entry_type, amount, reference_type, reference_id, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entryGroupId,
          accountId,
          entry.holderType || null,
          entry.holderId || null,
          entry.entryType,
          entry.amount,
          referenceType,
          String(referenceId),
          description
        ]
      );

      // 4. Synchronize Wallet Account running balance if it's a wallet transaction
      if (entry.holderType && entry.holderId) {
        // Find or create wallet account
        let wallet = await this.getOrCreateWalletAccount(entry.holderType, entry.holderId, conn);

        // Derive balance dynamically from ledger
        const currentBalance = await this.deriveWalletBalance(wallet.wallet_id, conn);

        // Sync and insert transaction
        await conn.query(
          `INSERT INTO wallet_transactions (
            wallet_id, transaction_type, amount, running_balance, reference_type, reference_id, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            wallet.wallet_id,
            entry.entryType === 'CREDIT' ? 'CREDIT' : 'DEBIT', // Credits increase Liability, Debits decrease
            entry.amount,
            currentBalance,
            referenceType,
            String(referenceId),
            description
          ]
        );
      }
    }

    return entryGroupId;
  }


  async getOrCreateWalletAccount(holderType, holderId, conn) {
    const [rows] = await conn.query(
      'SELECT wallet_id, user_id AS holder_id, wallet_balance, is_active FROM wallets WHERE user_id = ?',
      [holderId]
    );

    if (rows.length > 0) {
      return {
        wallet_id: rows[0].wallet_id,
        holder_type: holderType,
        holder_id: rows[0].holder_id,
        account_number: `WLT-${holderId}`,
        status: rows[0].is_active ? 'ACTIVE' : 'INACTIVE'
      };
    }

    const [insertRes] = await conn.query(
      'INSERT INTO wallets (user_id, wallet_balance, is_active, created_at, updated_at) VALUES (?, 0.00, 1, NOW(), NOW())',
      [holderId]
    );

    return {
      wallet_id: insertRes.insertId,
      holder_type: holderType,
      holder_id: holderId,
      account_number: `WLT-${holderId}`,
      status: 'ACTIVE'
    };
  }

  async deriveWalletBalance(walletId, conn) {
    const [walletRows] = await conn.query(
      'SELECT wallet_id, user_id, wallet_balance FROM wallets WHERE wallet_id = ?',
      [walletId]
    );

    if (walletRows.length === 0) {
      return 0.00;
    }

    return parseFloat(walletRows[0].wallet_balance || 0);
  }
}

module.exports = new LedgerEngine();
