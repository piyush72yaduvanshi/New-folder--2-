'use strict';

const { validationResult } = require('express-validator');
const FinanceService = require('../services/FinanceService');
const { sendSuccess, sendError, sendValidationError } = require('../../../src/utils/responseWrapper');
const DTO = require('../../../src/utils/dtoMapper');
const logger = require('../../../src/utils/logger');

// Helper: map service-thrown error messages to HTTP status codes
function statusFor(msg = '') {
  if (msg.includes('not found')) return 404;
  if (
    msg.includes('Cannot') ||
    msg.includes('Invalid') ||
    msg.includes('Insufficient') ||
    msg.includes('exceeded') ||
    msg.includes('rejected')
  ) return 400;
  return 500;
}

class FinanceController {
  // ==================== WALLET METHODS ====================

  async getWallets(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const filters = {
        holderType: req.query.holderType,
        status: req.query.status
      };
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await FinanceService.getWallets(filters, pagination);
      return sendSuccess(res, 200, 'Wallet accounts retrieved successfully', result, {
        req,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('FinanceController.getWallets Error:', error);
      return sendError(res, 500, error.message, 'WALLETS_FETCH_FAILED', null, req);
    }
  }

  async getWalletById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const walletId = parseInt(req.params.id);
      const wallet = await FinanceService.getWalletById(walletId);
      return sendSuccess(res, 200, 'Wallet account retrieved successfully', wallet, { req });
    } catch (error) {
      logger.error('FinanceController.getWalletById Error:', error);
      return sendError(res, statusFor(error.message), error.message, 'WALLET_FETCH_FAILED', null, req);
    }
  }

  async getWalletTransactions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const walletId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit) || 50;

      const transactions = await FinanceService.getWalletTransactions(walletId, limit);
      return sendSuccess(res, 200, 'Wallet transactions retrieved successfully', transactions, { req });
    } catch (error) {
      logger.error('FinanceController.getWalletTransactions Error:', error);
      return sendError(res, statusFor(error.message), error.message, 'WALLET_TRANSACTIONS_FETCH_FAILED', null, req);
    }
  }

  async creditWallet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const walletId = parseInt(req.params.id);
      const { amount, description } = req.body;
      const adminId = req.admin.admin_id;

      const result = await FinanceService.creditWallet(walletId, amount, description, adminId);
      return sendSuccess(res, 200, result.message, null, { req });
    } catch (error) {
      logger.error('FinanceController.creditWallet Error:', error);
      return sendError(res, statusFor(error.message), error.message, 'WALLET_CREDIT_FAILED', null, req);
    }
  }

  async debitWallet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const walletId = parseInt(req.params.id);
      const { amount, description } = req.body;
      const adminId = req.admin.admin_id;

      const result = await FinanceService.debitWallet(walletId, amount, description, adminId);
      return sendSuccess(res, 200, result.message, null, { req });
    } catch (error) {
      logger.error('FinanceController.debitWallet Error:', error);
      return sendError(res, statusFor(error.message), error.message, 'WALLET_DEBIT_FAILED', null, req);
    }
  }

  async getWalletLedger(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const walletId = parseInt(req.params.id);
      const ledger = await FinanceService.getWalletLedger(walletId);
      return sendSuccess(res, 200, 'Wallet ledger records retrieved successfully', ledger, { req });
    } catch (error) {
      logger.error('FinanceController.getWalletLedger Error:', error);
      return sendError(res, statusFor(error.message), error.message, 'WALLET_LEDGER_FETCH_FAILED', null, req);
    }
  }

  // ==================== PAYMENT METHODS ====================

  async createPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const { referenceType, referenceId, userId, amount, paymentMethod, gatewayProvider } = req.body;

      const payment = await FinanceService.createPayment(
        referenceType, referenceId, userId, amount, paymentMethod, gatewayProvider
      );
      return sendSuccess(res, 201, 'Payment order initialized successfully', payment, { req });
    } catch (error) {
      logger.error('FinanceController.createPayment Error:', error);
      return sendError(res, statusFor(error.message), error.message, 'PAYMENT_CREATE_FAILED', null, req);
    }
  }

  async verifyPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const paymentId = parseInt(req.params.id);
      const gatewayDetails = req.body;
      const adminId = req.admin ? req.admin.admin_id : 0;

      const result = await FinanceService.verifyPayment(paymentId, gatewayDetails, adminId);
      return sendSuccess(res, 200, 'Payment verified successfully', result, { req });
    } catch (error) {
      logger.error('FinanceController.verifyPayment Error:', error);
      return sendError(res, statusFor(error.message), error.message, 'PAYMENT_VERIFY_FAILED', null, req);
    }
  }

  async processRefund(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const paymentId = parseInt(req.params.id);
      const { amount, reason } = req.body;
      const adminId = req.admin ? req.admin.admin_id : 0;

      const result = await FinanceService.processRefund(paymentId, amount, reason, adminId);
      return sendSuccess(res, 200, result.message, null, { req });
    } catch (error) {
      logger.error('FinanceController.processRefund Error:', error);
      return sendError(res, statusFor(error.message), error.message, 'REFUND_FAILED', null, req);
    }
  }

  async getPayments(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const filters = {
        status: req.query.status,
        method: req.query.method,
        userId: req.query.userId ? parseInt(req.query.userId) : null,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await FinanceService.getPayments(filters, pagination);
      return sendSuccess(res, 200, 'Payments list retrieved successfully', result, {
        req,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('FinanceController.getPayments Error:', error);
      return sendError(res, 500, error.message, 'PAYMENTS_FETCH_FAILED', null, req);
    }
  }

  async getPaymentById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const paymentId = parseInt(req.params.id);
      const payment = await FinanceService.getPaymentById(paymentId);
      return sendSuccess(res, 200, 'Payment details retrieved successfully', payment, { req });
    } catch (error) {
      logger.error('FinanceController.getPaymentById Error:', error);
      return sendError(res, statusFor(error.message), error.message, 'PAYMENT_FETCH_FAILED', null, req);
    }
  }

  async getPaymentHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const paymentId = parseInt(req.params.id);
      const history = await FinanceService.getPaymentHistory(paymentId);
      return sendSuccess(res, 200, 'Payment audits retrieved successfully', history, { req });
    } catch (error) {
      logger.error('FinanceController.getPaymentHistory Error:', error);
      return sendError(res, statusFor(error.message), error.message, 'PAYMENT_HISTORY_FETCH_FAILED', null, req);
    }
  }

  // ==================== SETTLEMENT METHODS ====================

  async runSettlement(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const { period } = req.body;
      const adminId = req.admin.admin_id;

      const result = await FinanceService.runSettlement(period, adminId);
      return sendSuccess(res, 201, 'Settlement batch generated successfully', result, { req });
    } catch (error) {
      logger.error('FinanceController.runSettlement Error:', error);
      return sendError(res, statusFor(error.message), error.message, 'SETTLEMENT_RUN_FAILED', null, req);
    }
  }

  async getSettlements(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const filters = {
        status: req.query.status,
        recipientType: req.query.recipientType,
        recipientId: req.query.recipientId ? parseInt(req.query.recipientId) : null
      };
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await FinanceService.getSettlements(filters, pagination);

      // DTO maps settlements + JOIN enriched rider/branch fields → payout list
      return sendSuccess(res, 200, 'Settlement list retrieved successfully',
        DTO.toPayoutList(result),
        { req, pagination: result.pagination }   // repository always returns pagination — no fallback needed
      );
    } catch (error) {
      logger.error('FinanceController.getSettlements Error:', error);
      return sendError(res, 500, error.message, 'SETTLEMENTS_FETCH_FAILED', null, req);
    }
  }

  async getSettlementById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const settlementId = parseInt(req.params.id);
      const settlement = await FinanceService.getSettlementById(settlementId);
      return sendSuccess(res, 200, 'Settlement details retrieved successfully', settlement, { req });
    } catch (error) {
      logger.error('FinanceController.getSettlementById Error:', error);
      return sendError(res, statusFor(error.message), error.message, 'SETTLEMENT_FETCH_FAILED', null, req);
    }
  }

  async processSettlement(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const settlementId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;

      const result = await FinanceService.processSettlement(settlementId, adminId);
      return sendSuccess(res, 200, 'Settlement processing initialized', result, { req });
    } catch (error) {
      logger.error('FinanceController.processSettlement Error:', error);
      return sendError(res, statusFor(error.message), error.message, 'SETTLEMENT_PROCESS_FAILED', null, req);
    }
  }

  async completeSettlement(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const settlementId = parseInt(req.params.id);
      const { transactionId } = req.body;
      const adminId = req.admin.admin_id;

      const result = await FinanceService.completeSettlement(settlementId, transactionId, adminId);
      return sendSuccess(res, 200, 'Settlement completed and paid successfully', result, { req });
    } catch (error) {
      logger.error('FinanceController.completeSettlement Error:', error);
      return sendError(res, statusFor(error.message), error.message, 'SETTLEMENT_COMPLETE_FAILED', null, req);
    }
  }

  // ==================== LEDGER METHODS ====================

  async getLedgerAccounts(req, res) {
    try {
      const accounts = await FinanceService.getLedgerAccounts();
      return sendSuccess(res, 200, 'Ledger accounts structure retrieved', accounts, { req });
    } catch (error) {
      logger.error('FinanceController.getLedgerAccounts Error:', error);
      return sendError(res, 500, error.message, 'LEDGER_ACCOUNTS_FETCH_FAILED', null, req);
    }
  }

  async getLedgerEntries(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const filters = {
        accountId: req.query.accountId ? parseInt(req.query.accountId) : null,
        referenceType: req.query.referenceType,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await FinanceService.getLedgerEntries(filters, pagination);

      return sendSuccess(res, 200, 'Ledger entries list retrieved',
        DTO.toLedgerEntryList(result),
        { req, pagination: result.pagination }   // repository always returns pagination — no fallback needed
      );
    } catch (error) {
      logger.error('FinanceController.getLedgerEntries Error:', error);
      return sendError(res, 500, error.message, 'LEDGER_ENTRIES_FETCH_FAILED', null, req);
    }
  }

  async getTrialBalance(req, res) {
    try {
      const result = await FinanceService.getTrialBalance();
      return sendSuccess(res, 200, 'Trial balance compiled successfully', result, { req });
    } catch (error) {
      logger.error('FinanceController.getTrialBalance Error:', error);
      return sendError(res, 500, error.message, 'TRIAL_BALANCE_FETCH_FAILED', null, req);
    }
  }

  // ==================== REPORTS & TAXES ====================

  async getRevenueReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const { startDate, endDate } = req.query;
      const report = await FinanceService.getFinanceReport('revenue', startDate, endDate);
      return sendSuccess(res, 200, 'Revenue analytics report generated', report, { req });
    } catch (error) {
      logger.error('FinanceController.getRevenueReport Error:', error);
      return sendError(res, 500, error.message, 'REVENUE_REPORT_FAILED', null, req);
    }
  }

  async getExpensesReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const { startDate, endDate } = req.query;
      const report = await FinanceService.getFinanceReport('expenses', startDate, endDate);
      return sendSuccess(res, 200, 'Expenses analytics report generated', report, { req });
    } catch (error) {
      logger.error('FinanceController.getExpensesReport Error:', error);
      return sendError(res, 500, error.message, 'EXPENSES_REPORT_FAILED', null, req);
    }
  }

  async getRefundsReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const { startDate, endDate } = req.query;
      const report = await FinanceService.getFinanceReport('refunds', startDate, endDate);
      return sendSuccess(res, 200, 'Refunds analytics report generated', report, { req });
    } catch (error) {
      logger.error('FinanceController.getRefundsReport Error:', error);
      return sendError(res, 500, error.message, 'REFUNDS_REPORT_FAILED', null, req);
    }
  }

  async getCommissionsReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const { startDate, endDate } = req.query;
      const report = await FinanceService.getFinanceReport('commissions', startDate, endDate);
      return sendSuccess(res, 200, 'Commissions analytics report generated', report, { req });
    } catch (error) {
      logger.error('FinanceController.getCommissionsReport Error:', error);
      return sendError(res, 500, error.message, 'COMMISSIONS_REPORT_FAILED', null, req);
    }
  }

  async getTaxesReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const { startDate, endDate } = req.query;
      const report = await FinanceService.getFinanceReport('taxes', startDate, endDate);
      return sendSuccess(res, 200, 'GST taxes ledger summary compiled', report, { req });
    } catch (error) {
      logger.error('FinanceController.getTaxesReport Error:', error);
      return sendError(res, 500, error.message, 'TAXES_REPORT_FAILED', null, req);
    }
  }

  async runReconciliation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array(), req);

      const { date } = req.body;
      const adminId = req.admin ? req.admin.admin_id : 0;

      const result = await FinanceService.runReconciliation(date, adminId);
      return sendSuccess(res, 201, 'Gateway reconciliation executed successfully', result, { req });
    } catch (error) {
      logger.error('FinanceController.runReconciliation Error:', error);
      return sendError(res, 500, error.message, 'RECONCILIATION_FAILED', null, req);
    }
  }
}

module.exports = new FinanceController();

