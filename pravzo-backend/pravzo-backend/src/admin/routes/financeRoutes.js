const express = require('express');
const FinanceController = require('../controllers/FinanceController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const {
  creditDebitWalletValidation,
  createPaymentValidation,
  verifyPaymentValidation,
  processRefundValidation,
  runSettlementValidation,
  completeSettlementValidation,
  queryDateRangeValidation
} = require('../validations/financeValidation');

// ------------------------------------------------------------
// WALLET ROUTER
// ------------------------------------------------------------
const walletRouter = express.Router();

walletRouter.use(authMiddleware);

// Get list of wallets
walletRouter.get(
  '/',
  permissionMiddleware(['SUPER_ADMIN']),
  FinanceController.getWallets
);

// Get wallet detail by ID
walletRouter.get(
  '/:id',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  FinanceController.getWalletById
);

// Get transactions for wallet
walletRouter.get(
  '/:id/transactions',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  FinanceController.getWalletTransactions
);

// Credit wallet
walletRouter.post(
  '/:id/credit',
  creditDebitWalletValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  FinanceController.creditWallet
);

// Debit wallet
walletRouter.post(
  '/:id/debit',
  creditDebitWalletValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  FinanceController.debitWallet
);

// Get wallet ledger trace
walletRouter.get(
  '/:id/ledger',
  permissionMiddleware(['SUPER_ADMIN']),
  FinanceController.getWalletLedger
);

// ------------------------------------------------------------
// PAYMENT ROUTER
// ------------------------------------------------------------
const paymentRouter = express.Router();

paymentRouter.use(authMiddleware);

// Create payment intent
paymentRouter.post(
  '/create',
  createPaymentValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  FinanceController.createPayment
);

// Verify gateway payment completion
paymentRouter.post(
  '/:id/verify',
  verifyPaymentValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  FinanceController.verifyPayment
);

// Initiate transaction refund
paymentRouter.post(
  '/:id/refund',
  processRefundValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  FinanceController.processRefund
);

// Get payment transactions list
paymentRouter.get(
  '/',
  queryDateRangeValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  FinanceController.getPayments
);

// Get payment detail by ID (parameterized route must be placed last)
paymentRouter.get(
  '/:id',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  FinanceController.getPaymentById
);

// Get historical audit attempts
paymentRouter.get(
  '/:id/history',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  FinanceController.getPaymentHistory
);

// ------------------------------------------------------------
// SETTLEMENT ROUTER
// ------------------------------------------------------------
const settlementRouter = express.Router();

settlementRouter.use(authMiddleware);

// Trigger batch settlement calculations
settlementRouter.post(
  '/run',
  runSettlementValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  FinanceController.runSettlement
);

// Get list of settlements
settlementRouter.get(
  '/',
  permissionMiddleware(['SUPER_ADMIN']),
  FinanceController.getSettlements
);

// Get settlement details by ID
settlementRouter.get(
  '/:id',
  permissionMiddleware(['SUPER_ADMIN']),
  FinanceController.getSettlementById
);

// Process settlement payout
settlementRouter.patch(
  '/:id/process',
  permissionMiddleware(['SUPER_ADMIN']),
  FinanceController.processSettlement
);

// Mark settlement payout as complete
settlementRouter.patch(
  '/:id/complete',
  completeSettlementValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  FinanceController.completeSettlement
);

// ------------------------------------------------------------
// LEDGER ROUTER
// ------------------------------------------------------------
const ledgerRouter = express.Router();

ledgerRouter.use(authMiddleware);
ledgerRouter.use(permissionMiddleware(['SUPER_ADMIN']));

// Get trial balance
ledgerRouter.get(
  '/trial-balance',
  FinanceController.getTrialBalance
);

// Get ledger accounts registry structure
ledgerRouter.get(
  '/accounts',
  FinanceController.getLedgerAccounts
);

// Get paginated ledger entry journal rows
ledgerRouter.get(
  '/entries',
  queryDateRangeValidation,
  FinanceController.getLedgerEntries
);

// Default ledger landing retrieves ledger entries
ledgerRouter.get(
  '/',
  queryDateRangeValidation,
  FinanceController.getLedgerEntries
);

// ------------------------------------------------------------
// FINANCIAL REPORTS & RECONCILIATION ROUTER
// ------------------------------------------------------------
const reportRouter = express.Router();

reportRouter.use(authMiddleware);
reportRouter.use(permissionMiddleware(['SUPER_ADMIN']));

// Revenue reports
reportRouter.get(
  '/revenue',
  queryDateRangeValidation,
  FinanceController.getRevenueReport
);

// Expense reports
reportRouter.get(
  '/expenses',
  queryDateRangeValidation,
  FinanceController.getExpensesReport
);

// Refund reports
reportRouter.get(
  '/refunds',
  queryDateRangeValidation,
  FinanceController.getRefundsReport
);

// Commission reports
reportRouter.get(
  '/commissions',
  queryDateRangeValidation,
  FinanceController.getCommissionsReport
);

// Tax reports
reportRouter.get(
  '/taxes',
  queryDateRangeValidation,
  FinanceController.getTaxesReport
);

// Execute daily gateway audit checking reconciliation
reportRouter.post(
  '/reconcile',
  permissionMiddleware(['SUPER_ADMIN']),
  FinanceController.runReconciliation
);

module.exports = {
  walletRouter,
  paymentRouter,
  settlementRouter,
  ledgerRouter,
  reportRouter
};

