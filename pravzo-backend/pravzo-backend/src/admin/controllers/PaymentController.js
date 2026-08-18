const { validationResult } = require('express-validator');
const PaymentService = require('../services/PaymentService');
const { successResponse, errorResponse } = require('../../../src/utils/response');
const logger = require('../../../src/utils/logger');
const { exportToFile, validateExportFormat } = require('../../../src/utils/exportHelper');

class PaymentController {
  // Get paginated payments list
  async getPayments(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        search: req.query.search,
        paymentStatus: req.query.paymentStatus,
        paymentMethod: req.query.paymentMethod,
        paymentType: req.query.paymentType,
        bookingId: req.query.bookingId,
        userId: req.query.userId,
        riderId: req.query.riderId,
        city: req.query.city,
        transactionId: req.query.transactionId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await PaymentService.getPayments(filters, pagination);

      return successResponse(res, 200, 'Payments retrieved successfully', result);
    } catch (error) {
      logger.error('Get Payments Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get payment by ID
  async getPaymentById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const paymentId = parseInt(req.params.id);

      const payment = await PaymentService.getPaymentById(paymentId);

      return successResponse(res, 200, 'Payment details retrieved successfully', payment);
    } catch (error) {
      logger.error('Get Payment By ID Controller Error:', error);
      return errorResponse(res, error.message === 'Payment not found' ? 404 : 500, error.message);
    }
  }


  // Get payment statistics
  async getPaymentStatistics(req, res) {
    try {
      const statistics = await PaymentService.getPaymentStatistics();

      return successResponse(res, 200, 'Payment statistics retrieved successfully', statistics);
    } catch (error) {
      logger.error('Get Payment Statistics Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Export payments
  async exportPayments(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      // CRIT-2 fix: validate format param before any service/DB call
      const { valid, fmt, error: fmtError } = validateExportFormat(req.query.format);
      if (!valid) {
        return errorResponse(res, 400, fmtError);
      }

      const filters = {
        paymentStatus: req.query.paymentStatus,
        paymentMethod: req.query.paymentMethod,
        userId: req.query.userId,
        riderId: req.query.riderId,
        city: req.query.city,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await PaymentService.exportPayments(fmt, filters);

      if (!result.data || result.data.length === 0) {
        return errorResponse(res, 404, 'No payments found matching the filters');
      }

      await exportToFile(res, result.data, fmt, 'payments');
    } catch (error) {
      logger.error('Export Payments Controller Error:', error);
      // HIGH-1 fix: headers may be partially written for Excel
      if (res.headersSent) return;
      return errorResponse(res, 500, error.message);
    }
  }

  // Process refund
  async processRefund(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const paymentId = parseInt(req.params.id);
      const { refundAmount, refundReason } = req.body;
      const adminId = req.admin.admin_id;

      await PaymentService.processRefund(paymentId, refundAmount, refundReason, adminId);

      return successResponse(res, 200, 'Refund processed successfully');
    } catch (error) {
      logger.error('Process Refund Controller Error:', error);
      return errorResponse(res, error.message === 'Payment not found' ? 404 : 400, error.message);
    }
  }

  // Update payment status
  async updatePaymentStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const paymentId = parseInt(req.params.id);
      const { status } = req.body;
      const adminId = req.admin.admin_id;

      await PaymentService.updatePaymentStatus(paymentId, status, adminId);

      return successResponse(res, 200, 'Payment status updated successfully');
    } catch (error) {
      logger.error('Update Payment Status Controller Error:', error);
      return errorResponse(res, error.message === 'Payment not found' ? 404 : 400, error.message);
    }
  }

  // Verify payment
  async verifyPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const paymentId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;

      await PaymentService.verifyPayment(paymentId, adminId);

      return successResponse(res, 200, 'Payment verified successfully');
    } catch (error) {
      logger.error('Verify Payment Controller Error:', error);
      return errorResponse(res, error.message === 'Payment not found' ? 404 : 400, error.message);
    }
  }

  // ==================== WALLET METHODS ====================

  // Get user wallet
  async getUserWallet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);

      const wallet = await PaymentService.getUserWallet(userId);

      return successResponse(res, 200, 'User wallet retrieved successfully', wallet);
    } catch (error) {
      logger.error('Get User Wallet Controller Error:', error);
      return errorResponse(res, error.message === 'User wallet not found' ? 404 : 500, error.message);
    }
  }

  // Get rider wallet
  async getRiderWallet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);

      const wallet = await PaymentService.getRiderWallet(riderId);

      return successResponse(res, 200, 'Rider wallet retrieved successfully', wallet);
    } catch (error) {
      logger.error('Get Rider Wallet Controller Error:', error);
      return errorResponse(res, error.message === 'Rider wallet not found' ? 404 : 500, error.message);
    }
  }

  // Credit user wallet
  async creditUserWallet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const { amount, description } = req.body;
      const adminId = req.admin.admin_id;

      await PaymentService.creditUserWallet(userId, amount, description, adminId);

      return successResponse(res, 200, 'User wallet credited successfully');
    } catch (error) {
      logger.error('Credit User Wallet Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Debit user wallet
  async debitUserWallet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const { amount, description } = req.body;
      const adminId = req.admin.admin_id;

      await PaymentService.debitUserWallet(userId, amount, description, adminId);

      return successResponse(res, 200, 'User wallet debited successfully');
    } catch (error) {
      logger.error('Debit User Wallet Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Credit rider wallet
  async creditRiderWallet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const { amount, description } = req.body;
      const adminId = req.admin.admin_id;

      await PaymentService.creditRiderWallet(riderId, amount, description, adminId);

      return successResponse(res, 200, 'Rider wallet credited successfully');
    } catch (error) {
      logger.error('Credit Rider Wallet Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Get wallet history
  async getWalletHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const walletType = req.query.type || 'USER';
      const limit = parseInt(req.query.limit) || 50;

      const history = await PaymentService.getWalletHistory(userId, walletType, limit);

      return successResponse(res, 200, 'Wallet history retrieved successfully', history);
    } catch (error) {
      logger.error('Get Wallet History Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }


  // ==================== SETTLEMENT METHODS ====================

  // Get settlements
  async getSettlements(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        status: req.query.status,
        riderId: req.query.riderId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await PaymentService.getSettlements(filters, pagination);

      return successResponse(res, 200, 'Settlements retrieved successfully', result);
    } catch (error) {
      logger.error('Get Settlements Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get settlement by ID
  async getSettlementById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const settlementId = parseInt(req.params.id);

      const settlement = await PaymentService.getSettlementById(settlementId);

      return successResponse(res, 200, 'Settlement details retrieved successfully', settlement);
    } catch (error) {
      logger.error('Get Settlement By ID Controller Error:', error);
      return errorResponse(res, error.message === 'Settlement not found' ? 404 : 500, error.message);
    }
  }

  // Process settlement
  async processSettlement(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const settlementId = parseInt(req.params.id);
      const { transactionReference, utrNumber } = req.body;
      const adminId = req.admin.admin_id;

      await PaymentService.processSettlement(settlementId, transactionReference, utrNumber, adminId);

      return successResponse(res, 200, 'Settlement processed successfully');
    } catch (error) {
      logger.error('Process Settlement Controller Error:', error);
      return errorResponse(res, error.message === 'Settlement not found' ? 404 : 400, error.message);
    }
  }

  // ==================== COMMISSION METHODS ====================

  // Get commission overview
  async getCommissionOverview(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const overview = await PaymentService.getCommissionOverview(filters);

      return successResponse(res, 200, 'Commission overview retrieved successfully', overview);
    } catch (error) {
      logger.error('Get Commission Overview Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // ==================== ANALYTICS METHODS ====================

  // Get revenue analytics
  async getRevenueAnalytics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const analytics = await PaymentService.getRevenueAnalytics(filters);

      return successResponse(res, 200, 'Revenue analytics retrieved successfully', analytics);
    } catch (error) {
      logger.error('Get Revenue Analytics Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get payment method distribution
  async getPaymentMethodDistribution(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const distribution = await PaymentService.getPaymentMethodDistribution(filters);

      return successResponse(res, 200, 'Payment method distribution retrieved successfully', distribution);
    } catch (error) {
      logger.error('Get Payment Method Distribution Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get top cities
  async getTopCities(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const limit = parseInt(req.query.limit) || 10;

      const cities = await PaymentService.getTopCities(filters, limit);

      return successResponse(res, 200, 'Top cities retrieved successfully', cities);
    } catch (error) {
      logger.error('Get Top Cities Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get top users
  async getTopUsers(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const limit = parseInt(req.query.limit) || 10;

      const users = await PaymentService.getTopUsers(filters, limit);

      return successResponse(res, 200, 'Top users retrieved successfully', users);
    } catch (error) {
      logger.error('Get Top Users Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get top riders
  async getTopRiders(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const limit = parseInt(req.query.limit) || 10;

      const riders = await PaymentService.getTopRiders(filters, limit);

      return successResponse(res, 200, 'Top riders retrieved successfully', riders);
    } catch (error) {
      logger.error('Get Top Riders Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get peak hours
  async getPeakHours(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const peakHours = await PaymentService.getPeakHours(filters);

      return successResponse(res, 200, 'Peak hours retrieved successfully', peakHours);
    } catch (error) {
      logger.error('Get Peak Hours Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get daily report
  async getDailyReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const report = await PaymentService.getDailyReport(filters);

      return successResponse(res, 200, 'Daily report retrieved successfully', report);
    } catch (error) {
      logger.error('Get Daily Report Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get monthly report
  async getMonthlyReport(req, res) {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();

      const report = await PaymentService.getMonthlyReport(year);

      return successResponse(res, 200, 'Monthly report retrieved successfully', report);
    } catch (error) {
      logger.error('Get Monthly Report Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get yearly report
  async getYearlyReport(req, res) {
    try {
      const report = await PaymentService.getYearlyReport();

      return successResponse(res, 200, 'Yearly report retrieved successfully', report);
    } catch (error) {
      logger.error('Get Yearly Report Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }
}

module.exports = new PaymentController();

