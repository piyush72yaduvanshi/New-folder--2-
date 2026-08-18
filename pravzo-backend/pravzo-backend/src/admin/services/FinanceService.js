const FinanceRepository = require('../repositories/FinanceRepository');
const ledgerEngine = require('../../../src/utils/ledgerEngine');
const { PaymentGatewayFactory } = require('../../../src/utils/paymentGatewayProvider');
const logger = require('../../../src/utils/logger');
const crypto = require('crypto');

class FinanceService {
  // ==================== WALLET METHODS ====================

  async getWallets(filters, pagination) {
    try {
      return await FinanceRepository.getWallets(filters, pagination);
    } catch (error) {
      logger.error('FinanceService.getWallets Error:', error);
      throw error;
    }
  }

  async getWalletById(walletId) {
    try {
      const wallet = await FinanceRepository.findWalletById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      // Dynamically derive current balance from ledger (Single source of truth)
      const conn = await FinanceRepository.getConnection();
      try {
        wallet.balance = await ledgerEngine.deriveWalletBalance(walletId, conn);
      } finally {
        conn.release();
      }
      return wallet;
    } catch (error) {
      logger.error(`FinanceService.getWalletById Error (${walletId}):`, error);
      throw error;
    }
  }

  async getWalletTransactions(walletId, limit) {
    try {
      const wallet = await FinanceRepository.findWalletById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      return await FinanceRepository.getWalletTransactions(walletId, limit);
    } catch (error) {
      logger.error(`FinanceService.getWalletTransactions Error (${walletId}):`, error);
      throw error;
    }
  }

  async creditWallet(walletId, amount, description, adminId) {
    const conn = await FinanceRepository.getConnection();
    try {
      await conn.beginTransaction();

      const wallet = await FinanceRepository.findWalletById(walletId, conn);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.status !== 'ACTIVE') {
        throw new Error(`Cannot credit. Wallet account is ${wallet.status}`);
      }

      const walletAccountCode = ledgerEngine.getWalletAccountCode(wallet.holder_type);

      // Create Balanced Ledger Entry:
      // Debit: Bank Asset
      // Credit: Wallet Liability
      const entries = [
        {
          accountCode: '1000-CASH-BANK',
          entryType: 'DEBIT',
          amount: amount
        },
        {
          accountCode: walletAccountCode,
          entryType: 'CREDIT',
          amount: amount,
          holderType: wallet.holder_type,
          holderId: wallet.holder_id
        }
      ];

      const referenceId = 'CRED-' + Date.now();
      await ledgerEngine.postDoubleEntry(entries, 'WALLET_CREDIT', referenceId, description || 'Admin manual credit adjustment', conn);

      await FinanceRepository.logFinancialActivity(
        'ADMIN',
        adminId,
        'CREDIT',
        `Manual wallet credit of ${amount} to wallet ID ${walletId}`,
        null,
        conn
      );

      await conn.commit();
      return { success: true, message: 'Wallet credited successfully' };
    } catch (error) {
      await conn.rollback();
      logger.error(`FinanceService.creditWallet Error (${walletId}):`, error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async debitWallet(walletId, amount, description, adminId) {
    const conn = await FinanceRepository.getConnection();
    try {
      await conn.beginTransaction();

      const wallet = await FinanceRepository.findWalletById(walletId, conn);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.status !== 'ACTIVE') {
        throw new Error(`Cannot debit. Wallet account is ${wallet.status}`);
      }

      // Check current true balance from ledger
      const currentBalance = await ledgerEngine.deriveWalletBalance(walletId, conn);
      if (currentBalance < amount) {
        throw new Error(`Insufficient wallet balance. Available: ${currentBalance}`);
      }

      const walletAccountCode = ledgerEngine.getWalletAccountCode(wallet.holder_type);

      // Create Balanced Ledger Entry:
      // Debit: Wallet Liability (reduces balance)
      // Credit: Bank Asset
      const entries = [
        {
          accountCode: walletAccountCode,
          entryType: 'DEBIT',
          amount: amount,
          holderType: wallet.holder_type,
          holderId: wallet.holder_id
        },
        {
          accountCode: '1000-CASH-BANK',
          entryType: 'CREDIT',
          amount: amount
        }
      ];

      const referenceId = 'DEB-' + Date.now();
      await ledgerEngine.postDoubleEntry(entries, 'WALLET_DEBIT', referenceId, description || 'Admin manual debit adjustment', conn);

      await FinanceRepository.logFinancialActivity(
        'ADMIN',
        adminId,
        'DEBIT',
        `Manual wallet debit of ${amount} from wallet ID ${walletId}`,
        null,
        conn
      );

      await conn.commit();
      return { success: true, message: 'Wallet debited successfully' };
    } catch (error) {
      await conn.rollback();
      logger.error(`FinanceService.debitWallet Error (${walletId}):`, error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async getWalletLedger(walletId) {
    try {
      const wallet = await FinanceRepository.findWalletById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      const conn = await FinanceRepository.getConnection();
      try {
        const [rows] = await conn.query(
          `SELECT le.*, la.account_code, la.account_name 
           FROM ledger_entries le 
           JOIN ledger_accounts la ON le.account_id = la.account_id 
           WHERE le.holder_type = ? AND le.holder_id = ?
           ORDER BY le.created_at DESC`,
          [wallet.holder_type, wallet.holder_id]
        );
        return rows;
      } catch (err) {
        return [];
      } finally {
        conn.release();
      }
    } catch (error) {
      logger.error(`FinanceService.getWalletLedger Error (${walletId}):`, error);
      throw error;
    }
  }

  // ==================== PAYMENT METHODS ====================

  async createPayment(referenceType, referenceId, userId, amount, paymentMethod, gatewayProvider) {
    const conn = await FinanceRepository.getConnection();
    try {
      await conn.beginTransaction();

      // Create standard transaction record
      const paymentData = {
        reference_type: referenceType,
        reference_id: referenceId,
        user_id: userId,
        amount: amount,
        status: 'PENDING',
        payment_method: paymentMethod,
        gateway_provider: gatewayProvider,
        transaction_id: null
      };

      const paymentId = await FinanceRepository.createPaymentTransaction(paymentData, conn);

      // Call abstraction adapter
      const adapter = PaymentGatewayFactory.getProvider(gatewayProvider);
      const gatewayRes = await adapter.createPayment({
        paymentId,
        amount,
        currency: 'INR',
        referenceType,
        referenceId
      });

      // Log attempts
      await FinanceRepository.createPaymentAttempt({
        payment_id: paymentId,
        gateway_provider: gatewayProvider || 'CASH',
        request_payload: JSON.stringify(paymentData),
        response_payload: JSON.stringify(gatewayRes),
        status: gatewayRes.success ? 'SUCCESS' : 'FAILED',
        error_code: gatewayRes.success ? null : 'CREATE_FAILED',
        error_message: gatewayRes.success ? null : 'Failed to instantiate gateway checkout'
      }, conn);

      if (gatewayRes.gatewayOrderId) {
        await FinanceRepository.updatePaymentTransactionStatus(paymentId, 'PROCESSING', gatewayRes.gatewayOrderId, conn);
      }

      await conn.commit();
      return {
        paymentId,
        amount,
        status: 'PROCESSING',
        gatewayOrderId: gatewayRes.gatewayOrderId,
        meta: gatewayRes.meta || {}
      };
    } catch (error) {
      await conn.rollback();
      logger.error('FinanceService.createPayment Error:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async verifyPayment(paymentId, gatewayDetails, adminId) {
    const conn = await FinanceRepository.getConnection();
    try {
      await conn.beginTransaction();

      const payment = await FinanceRepository.findPaymentById(paymentId, conn);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status === 'SUCCESS') {
        await conn.commit();
        return { success: true, status: 'SUCCESS' };
      }

      const provider = payment.gateway_provider || 'CASH';
      const adapter = PaymentGatewayFactory.getProvider(provider);

      // Perform gateway check
      const verification = await adapter.verifyPayment({
        paymentId: paymentId,
        amount: payment.amount,
        gatewayPaymentId: gatewayDetails.gatewayPaymentId,
        razorpaySignature: gatewayDetails.razorpaySignature,
        razorpayPaymentId: gatewayDetails.razorpayPaymentId,
        razorpayOrderId: gatewayDetails.razorpayOrderId
      });

      await FinanceRepository.createPaymentAttempt({
        payment_id: paymentId,
        gateway_provider: provider,
        request_payload: JSON.stringify(gatewayDetails),
        response_payload: JSON.stringify(verification),
        status: verification.success ? 'SUCCESS' : 'FAILED',
        error_code: verification.success ? null : 'VERIFY_FAILED',
        error_message: verification.success ? null : 'Verification checks did not pass'
      }, conn);

      if (verification.success) {
        const txnId = verification.transactionId || 'TXN-' + Date.now();
        await FinanceRepository.updatePaymentTransactionStatus(paymentId, 'SUCCESS', txnId, conn);

        // --- Double-Entry Ledger Entry Post ---
        // Basic payment event:
        // Debit: Cash/Bank Account (Asset)
        // Credit: Rental Revenue or Customer Wallet Escrow
        const entries = [];
        
        // Debit Bank
        entries.push({
          accountCode: '1000-CASH-BANK',
          entryType: 'DEBIT',
          amount: payment.amount
        });

        if (payment.reference_type === 'WALLET_CREDIT') {
          // Credit Customer Wallet Escrow Liability
          entries.push({
            accountCode: '2000-CUSTOMER-WALLETS',
            entryType: 'CREDIT',
            amount: payment.amount,
            holderType: 'CUSTOMER',
            holderId: payment.user_id
          });
        } else {
          // For Rentals/Bookings, calculate GST Tax dynamic splits:
          // 18% GST (CGST 9%, SGST 9%)
          const taxableValue = payment.amount / 1.18;
          const totalTax = payment.amount - taxableValue;
          const cgst = totalTax / 2;
          const sgst = totalTax / 2;

          // Credit Tax Liability
          entries.push({
            accountCode: '2100-TAX-PAYABLE',
            entryType: 'CREDIT',
            amount: totalTax
          });

          // Log tax record
          await conn.query(
            `INSERT INTO tax_transactions (reference_type, reference_id, cgst, sgst, igst, total_tax) 
             VALUES (?, ?, ?, ?, 0.00, ?)`,
            [payment.reference_type, payment.reference_id, cgst, sgst, totalTax]
          );

          // Credit Revenue Account
          entries.push({
            accountCode: '3000-RENTAL-REVENUE',
            entryType: 'CREDIT',
            amount: taxableValue
          });
        }

        await ledgerEngine.postDoubleEntry(
          entries,
          payment.reference_type,
          payment.reference_id,
          `Payment received via ${payment.payment_method} - Gateway ref: ${txnId}`,
          conn
        );
      } else {
        await FinanceRepository.updatePaymentTransactionStatus(paymentId, 'FAILED', null, conn);
      }

      await conn.commit();
      return { success: verification.success, status: verification.success ? 'SUCCESS' : 'FAILED' };
    } catch (error) {
      await conn.rollback();
      logger.error(`FinanceService.verifyPayment Error (${paymentId}):`, error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async processRefund(paymentId, amount, reason, adminId) {
    const conn = await FinanceRepository.getConnection();
    try {
      await conn.beginTransaction();

      const payment = await FinanceRepository.findPaymentById(paymentId, conn);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'SUCCESS') {
        throw new Error('Cannot refund. Base payment status is not SUCCESS');
      }

      // Calculate already refunded amounts
      const refunds = await FinanceRepository.getPaymentRefunds(paymentId, conn);
      const totalRefunded = refunds.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

      if (totalRefunded + amount > payment.amount) {
        throw new Error(`Refund limit exceeded. Max refundable remaining: ${payment.amount - totalRefunded}`);
      }

      const refundData = {
        payment_id: paymentId,
        amount: amount,
        status: 'PROCESSING',
        refund_reason: reason,
        transaction_id: null
      };

      const refundId = await FinanceRepository.createPaymentRefund(refundData, conn);

      // Call Gateway Refund Interface
      const provider = payment.gateway_provider || 'CASH';
      const adapter = PaymentGatewayFactory.getProvider(provider);
      const gatewayRefund = await adapter.refund({
        transactionId: payment.transaction_id,
        amount: amount,
        reason: reason
      });

      if (gatewayRefund.success) {
        const txnId = gatewayRefund.refundId || 'REF-' + Date.now();
        await conn.query(
          'UPDATE payment_refunds SET status = ?, transaction_id = ?, updated_at = NOW() WHERE refund_id = ?',
          ['SUCCESS', txnId, refundId]
        );

        // Update parent status
        const isFullRefund = (totalRefunded + amount) === payment.amount;
        const newStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
        await FinanceRepository.updatePaymentTransactionStatus(paymentId, newStatus, null, conn);

        // Record refund transactions
        await conn.query(
          'INSERT INTO refund_transactions (payment_id, amount, refund_type) VALUES (?, ?, ?)',
          [paymentId, amount, provider === 'WALLET' ? 'WALLET' : 'GATEWAY']
        );

        // --- Double-Entry Ledger Entry Post ---
        // Debit: Revenue Reversal (Rental Revenue or Customer Wallet escrow liability reduction)
        // Credit: Cash & Bank Account (Asset reduction)
        const entries = [];
        const walletAccountCode = ledgerEngine.getWalletAccountCode('CUSTOMER');

        if (payment.reference_type === 'WALLET_CREDIT') {
          // Debit Customer Wallet Escrow Liability
          entries.push({
            accountCode: walletAccountCode,
            entryType: 'DEBIT',
            amount: amount,
            holderType: 'CUSTOMER',
            holderId: payment.user_id
          });
        } else {
          // Re-apportion tax and revenue deductions
          const taxableRefund = amount / 1.18;
          const taxRefund = amount - taxableRefund;

          // Debit Tax Liability (reducing tax payable)
          entries.push({
            accountCode: '2100-TAX-PAYABLE',
            entryType: 'DEBIT',
            amount: taxRefund
          });

          // Debit Revenue Account
          entries.push({
            accountCode: '3000-RENTAL-REVENUE',
            entryType: 'DEBIT',
            amount: taxableRefund
          });
        }

        // Credit Cash Bank
        entries.push({
          accountCode: '1000-CASH-BANK',
          entryType: 'CREDIT',
          amount: amount
        });

        await ledgerEngine.postDoubleEntry(
          entries,
          'REFUND',
          payment.reference_id,
          `Refund parsed: ${reason} for paymentId ${paymentId}`,
          conn
        );
      } else {
        await conn.query(
          'UPDATE payment_refunds SET status = ?, updated_at = NOW() WHERE refund_id = ?',
          ['FAILED', refundId]
        );
        throw new Error('Gateway rejected refund request');
      }

      await FinanceRepository.logFinancialActivity(
        'ADMIN',
        adminId,
        'REFUND',
        `Processed refund of ${amount} for payment ${paymentId}`,
        null,
        conn
      );

      await conn.commit();
      return { success: true, message: 'Refund processed successfully' };
    } catch (error) {
      await conn.rollback();
      logger.error(`FinanceService.processRefund Error (${paymentId}):`, error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async getPayments(filters, pagination) {
    try {
      return await FinanceRepository.getPaymentsList(filters, pagination);
    } catch (error) {
      logger.error('FinanceService.getPayments Error:', error);
      throw error;
    }
  }

  async getPaymentById(paymentId) {
    try {
      const payment = await FinanceRepository.findPaymentById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }
      return payment;
    } catch (error) {
      logger.error(`FinanceService.getPaymentById Error (${paymentId}):`, error);
      throw error;
    }
  }

  async getPaymentHistory(paymentId) {
    try {
      const payment = await FinanceRepository.findPaymentById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }
      const attempts = await FinanceRepository.getPaymentAttempts(paymentId);
      const refunds = await FinanceRepository.getPaymentRefunds(paymentId);
      return {
        payment,
        attempts,
        refunds
      };
    } catch (error) {
      logger.error(`FinanceService.getPaymentHistory Error (${paymentId}):`, error);
      throw error;
    }
  }

  // ==================== SETTLEMENT METHODS ====================

  async runSettlement(period, adminId) {
    const conn = await FinanceRepository.getConnection();
    try {
      await conn.beginTransaction();

      // Find recipient wallets with positive balance
      const [walletRows] = await conn.query(
        "SELECT wallet_id, user_id AS holder_id, 'USER' AS holder_type, wallet_balance FROM wallets WHERE is_active = 1"
      );

      const settlementsToCreate = [];
      let totalAmount = 0;

      for (const w of walletRows) {
        const balance = parseFloat(w.wallet_balance || 0);
        if (balance > 0) {
          settlementsToCreate.push({
            recipient_type: w.holder_type,
            recipient_id: w.holder_id,
            wallet_id: w.wallet_id,
            amount: balance
          });
          totalAmount += balance;
        }
      }

      if (settlementsToCreate.length === 0) {
        return {
          settlementBatchId: null,
          totalSettlements: 0,
          totalAmount: 0,
          status: 'NO_UNSETTLED_EARNINGS'
        };
      }

      // Create settlement batch
      const batchId = await FinanceRepository.createSettlementBatch({
        settlement_period: period,
        total_settlements: settlementsToCreate.length,
        total_amount: totalAmount,
        status: 'PENDING'
      }, conn);

      for (const s of settlementsToCreate) {
        await FinanceRepository.createSettlement({
          batch_id: batchId,
          recipient_type: s.recipient_type,
          recipient_id: s.recipient_id,
          amount: s.amount,
          status: 'PENDING'
        }, conn);
      }

      await FinanceRepository.logFinancialActivity(
        'ADMIN',
        adminId,
        'SETTLEMENT',
        `Generated settlement batch ID ${batchId} containing ${settlementsToCreate.length} items. Total: ${totalAmount}`,
        null,
        conn
      );

      await conn.commit();
      return { batchId, totalSettlements: settlementsToCreate.length, totalAmount };
    } catch (error) {
      await conn.rollback();
      logger.error('FinanceService.runSettlement Error:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async getSettlements(filters, pagination) {
    try {
      return await FinanceRepository.getSettlements(filters, pagination);
    } catch (error) {
      logger.error('FinanceService.getSettlements Error:', error);
      throw error;
    }
  }

  async getSettlementById(settlementId) {
    try {
      const settlement = await FinanceRepository.getSettlementById(settlementId);
      if (!settlement) {
        throw new Error('Settlement not found');
      }
      return settlement;
    } catch (error) {
      logger.error(`FinanceService.getSettlementById Error (${settlementId}):`, error);
      throw error;
    }
  }

  async processSettlement(settlementId, adminId) {
    try {
      const settlement = await FinanceRepository.getSettlementById(settlementId);
      if (!settlement) {
        throw new Error('Settlement not found');
      }

      if (settlement.status !== 'PENDING') {
        throw new Error(`Cannot process. Settlement status is ${settlement.status}`);
      }

      await FinanceRepository.updateSettlement(settlementId, { status: 'PROCESSING' });
      return { success: true, status: 'PROCESSING' };
    } catch (error) {
      logger.error(`FinanceService.processSettlement Error (${settlementId}):`, error);
      throw error;
    }
  }

  async completeSettlement(settlementId, transactionId, adminId) {
    const conn = await FinanceRepository.getConnection();
    try {
      await conn.beginTransaction();

      const settlement = await FinanceRepository.getSettlementById(settlementId, conn);
      if (!settlement) {
        throw new Error('Settlement not found');
      }

      if (settlement.status !== 'PROCESSING' && settlement.status !== 'PENDING') {
        throw new Error(`Cannot complete. Settlement status is ${settlement.status}`);
      }

      const txnId = transactionId || 'SETTL-' + Date.now();

      // Find recipient wallet account details
      const wallet = await FinanceRepository.findWalletByHolder(
        settlement.recipient_type,
        settlement.recipient_id,
        conn
      );

      if (!wallet) {
        throw new Error(`Wallet not found for recipient ${settlement.recipient_type} id ${settlement.recipient_id}`);
      }

      // Clear liability and pay out:
      // Debit: Recipient Wallet Liability (clearing wallet balance)
      // Credit: Cash & Bank Account (Asset payout)
      const walletAccountCode = ledgerEngine.getWalletAccountCode(settlement.recipient_type);

      const entries = [
        {
          accountCode: walletAccountCode,
          entryType: 'DEBIT',
          amount: settlement.amount,
          holderType: settlement.recipient_type,
          holderId: settlement.recipient_id
        },
        {
          accountCode: '1000-CASH-BANK',
          entryType: 'CREDIT',
          amount: settlement.amount
        }
      ];

      await ledgerEngine.postDoubleEntry(
        entries,
        'SETTLEMENT',
        settlementId,
        `Settlement completed. Payout ref: ${txnId}`,
        conn
      );

      // Update settlement status
      await FinanceRepository.updateSettlement(settlementId, {
        status: 'SUCCESS',
        transaction_id: txnId,
        processed_at: new Date(),
        completed_at: new Date()
      }, conn);

      await FinanceRepository.logFinancialActivity(
        'ADMIN',
        adminId,
        'SETTLEMENT',
        `Settlement payout complete for ID ${settlementId}. Amount: ${settlement.amount}`,
        null,
        conn
      );

      await conn.commit();
      return { success: true, status: 'SUCCESS', transactionId: txnId };
    } catch (error) {
      await conn.rollback();
      logger.error(`FinanceService.completeSettlement Error (${settlementId}):`, error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // ==================== LEDGER METHODS ====================

  async getLedgerAccounts() {
    try {
      return await FinanceRepository.getLedgerAccounts();
    } catch (error) {
      logger.error('FinanceService.getLedgerAccounts Error:', error);
      throw error;
    }
  }

  async getLedgerEntries(filters, pagination) {
    try {
      return await FinanceRepository.getLedgerEntries(filters, pagination);
    } catch (error) {
      logger.error('FinanceService.getLedgerEntries Error:', error);
      throw error;
    }
  }

  async getTrialBalance() {
    try {
      const rows = await FinanceRepository.getTrialBalance();
      // Calculate overall totals
      let totalDebits = 0;
      let totalCredits = 0;
      rows.forEach(r => {
        totalDebits += parseFloat(r.total_debits);
        totalCredits += parseFloat(r.total_credits);
      });
      return {
        accounts: rows,
        totals: {
          debits: totalDebits,
          credits: totalCredits,
          balanced: Math.abs(totalDebits - totalCredits) < 0.0001
        }
      };
    } catch (error) {
      logger.error('FinanceService.getTrialBalance Error:', error);
      throw error;
    }
  }

  // ==================== REPORTS & TAXES ====================

  async getFinanceReport(type, startDate, endDate) {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days
      const end = endDate || new Date();

      switch (type.toLowerCase()) {
        case 'revenue':
          return await FinanceRepository.getRevenueReport(start, end);
        case 'expenses':
          return await FinanceRepository.getExpensesReport(start, end);
        case 'refunds':
          return await FinanceRepository.getRefundsReport(start, end);
        case 'commissions':
          return await FinanceRepository.getCommissionsReport(start, end);
        case 'taxes':
          return await FinanceRepository.getTaxesReport(start, end);
        default:
          throw new Error('Invalid report type specified');
      }
    } catch (error) {
      logger.error(`FinanceService.getFinanceReport Error (${type}):`, error);
      throw error;
    }
  }

  // ==================== RECONCILIATION RUNNER ====================

  async runReconciliation(dateStr, adminId) {
    const conn = await FinanceRepository.getConnection();
    try {
      await conn.beginTransaction();

      const date = dateStr || new Date().toISOString().split('T')[0];

      // Sum payment transaction success amounts — use payments table (canonical)
      const [payments] = await conn.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status IN ('paid','captured') AND DATE(created_at) = ?",
        [date]
      );
      const gatewayTotal = parseFloat(payments[0].total);

      // Sum ledger Cash Bank debits minus credit adjustments
      const [ledger] = await conn.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END), 0) as debits,
          COALESCE(SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END), 0) as credits
         FROM ledger_entries
         WHERE account_id = (SELECT account_id FROM ledger_accounts WHERE account_code = '1000-CASH-BANK')
           AND DATE(created_at) = ?`,
        [date]
      );
      const ledgerTotal = parseFloat(ledger[0].debits) - parseFloat(ledger[0].credits);

      // Validate trial balance equilibrium
      const equilibrium = await FinanceRepository.validateLedgerEquilibrium(conn);
      const trialBalanceDelta = Math.abs(parseFloat(equilibrium.debits) - parseFloat(equilibrium.credits));

      const discrepancyCount = (Math.abs(gatewayTotal - ledgerTotal) > 0.0001 || trialBalanceDelta > 0.0001) ? 1 : 0;
      const status = discrepancyCount === 0 ? 'MATCHED' : 'DISCREPANCY_FOUND';

      const details = JSON.stringify({
        gatewayTotal,
        ledgerTotal,
        trialBalanceEquilibrium: {
          debits: parseFloat(equilibrium.debits),
          credits: parseFloat(equilibrium.credits),
          balanced: trialBalanceDelta < 0.0001
        }
      });

      const reportId = await FinanceRepository.createReconciliationReport({
        reconciliation_date: date,
        total_gateway_amount: gatewayTotal,
        total_ledger_amount: ledgerTotal,
        discrepancy_count: discrepancyCount,
        status,
        details
      }, conn);

      await FinanceRepository.logFinancialActivity(
        'SYSTEM',
        0,
        'RECONCILIATION',
        `Run reconciliation report ID ${reportId} for date ${date}. Status: ${status}`,
        null,
        conn
      );

      await conn.commit();
      return { reportId, status, gatewayTotal, ledgerTotal, trialBalanceDelta };
    } catch (error) {
      await conn.rollback();
      logger.error(`FinanceService.runReconciliation Error (${dateStr}):`, error);
      throw error;
    } finally {
      conn.release();
    }
  }
}

module.exports = new FinanceService();

