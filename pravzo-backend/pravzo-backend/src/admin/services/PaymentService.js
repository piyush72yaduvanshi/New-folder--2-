const PaymentRepository = require('../repositories/PaymentRepository');
const logger = require('../../../src/utils/logger');

class PaymentService {
  // Get paginated payments list
  async getPayments(filters, pagination) {
    try {
      const result = await PaymentRepository.getPayments(filters, pagination);
      
      // Format response data
      result.payments = result.payments.map(payment => ({
        paymentId: payment.payment_id,
        transactionId: payment.transaction_id,
        bookingId: payment.booking_id,
        amount: parseFloat(payment.amount || 0),
        paymentMethod: payment.payment_method,
        paymentStatus: payment.payment_status,
        paymentType: payment.payment_type,
        gateway: {
          name: payment.gateway_name,
          transactionId: payment.gateway_transaction_id,
          charges: parseFloat(payment.gateway_charges || 0)
        },
        commission: {
          platform: parseFloat(payment.platform_commission || 0),
          riderEarning: parseFloat(payment.rider_earning || 0)
        },
        refund: {
          amount: parseFloat(payment.refund_amount || 0),
          status: payment.refund_status
        },
        customer: payment.user_id ? {
          userId: payment.user_id,
          name: payment.user_name,
          phone: payment.user_phone
        } : null,
        rider: payment.rider_id ? {
          riderId: payment.rider_id,
          name: payment.rider_name,
          phone: payment.rider_phone,
          riderCode: payment.rider_code
        } : null,
        booking: payment.booking_id ? {
          pickupAddress: payment.pickup_address,
          dropoffAddress: payment.dropoff_address
        } : null,
        city: payment.city,
        verified: payment.verified === 1,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at
      }));

      return result;
    } catch (error) {
      logger.error('PaymentService - Get Payments Error:', error);
      throw new Error('Failed to fetch payments');
    }
  }


  // Get payment by ID with complete details
  async getPaymentById(paymentId) {
    try {
      const payment = await PaymentRepository.getPaymentDetails(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      return {
        paymentInfo: {
          paymentId: payment.payment_id,
          transactionId: payment.transaction_id,
          paymentStatus: payment.payment_status,
          paymentMethod: payment.payment_method,
          paymentType: payment.payment_type,
          verified: payment.verified === 1,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        },
        amount: {
          total: parseFloat(payment.amount || 0),
          baseFare: parseFloat(payment.base_fare || 0),
          distanceCharge: parseFloat(payment.distance_charge || 0),
          timeCharge: parseFloat(payment.time_charge || 0),
          surgeCharge: parseFloat(payment.surge_charge || 0),
          taxes: parseFloat(payment.taxes || 0),
          platformFee: parseFloat(payment.platform_fee || 0),
          discount: parseFloat(payment.discount || 0),
          walletUsed: parseFloat(payment.wallet_used || 0)
        },
        coupon: payment.coupon_code ? {
          code: payment.coupon_code,
          discount: parseFloat(payment.coupon_discount || 0)
        } : null,
        gateway: {
          name: payment.gateway_name,
          transactionId: payment.gateway_transaction_id,
          charges: parseFloat(payment.gateway_charges || 0),
          response: payment.gateway_response
        },
        commission: {
          platform: parseFloat(payment.platform_commission || 0),
          riderEarning: parseFloat(payment.rider_earning || 0)
        },
        refund: {
          amount: parseFloat(payment.refund_amount || 0),
          status: payment.refund_status,
          reason: payment.refund_reason,
          initiatedAt: payment.refund_initiated_at,
          completedAt: payment.refund_completed_at
        },
        settlement: payment.settlement_id ? {
          settlementId: payment.settlement_id,
          settlementCode: payment.settlement_code,
          status: payment.settlement_status,
          settledAt: payment.settled_at
        } : null,
        customer: payment.user_id ? {
          userId: payment.user_id,
          name: payment.user_name,
          phone: payment.user_phone,
          email: payment.user_email
        } : null,
        rider: payment.rider_id ? {
          riderId: payment.rider_id,
          name: payment.rider_name,
          phone: payment.rider_phone,
          email: payment.rider_email,
          riderCode: payment.rider_code
        } : null,
        booking: payment.booking_id ? {
          bookingId: payment.trip_id,
          pickupAddress: payment.pickup_address,
          dropoffAddress: payment.dropoff_address,
          distance: parseFloat(payment.distance_km || 0),
          duration: payment.duration_minutes,
          status: payment.booking_status
        } : null,
        invoice: payment.invoice_number ? {
          invoiceNumber: payment.invoice_number,
          invoiceUrl: payment.invoice_url
        } : null,
        city: payment.city
      };
    } catch (error) {
      logger.error('PaymentService - Get Payment By ID Error:', error);
      if (error.message === 'Payment not found') {
        throw error;
      }
      throw new Error('Failed to fetch payment details');
    }
  }

  // Get payment statistics
  async getPaymentStatistics() {
    try {
      const stats = await PaymentRepository.getPaymentStatistics();

      return {
        overview: {
          totalTransactions: stats.total_transactions,
          successfulTransactions: stats.successful_transactions,
          failedTransactions: stats.failed_transactions,
          pendingTransactions: stats.pending_transactions,
          refundedTransactions: stats.refunded_transactions
        },
        revenue: {
          total: parseFloat(stats.total_revenue || 0).toFixed(2),
          today: parseFloat(stats.today_revenue || 0).toFixed(2),
          weekly: parseFloat(stats.weekly_revenue || 0).toFixed(2),
          monthly: parseFloat(stats.monthly_revenue || 0).toFixed(2),
          yearly: parseFloat(stats.yearly_revenue || 0).toFixed(2),
          avgTransaction: parseFloat(stats.avg_transaction || 0).toFixed(2)
        },
        financials: {
          totalRefunded: parseFloat(stats.total_refunded || 0).toFixed(2),
          totalCommission: parseFloat(stats.total_commission || 0).toFixed(2),
          totalGatewayCharges: parseFloat(stats.total_gateway_charges || 0).toFixed(2)
        },
        metrics: {
          successRate: parseFloat(stats.success_rate || 0),
          failureRate: parseFloat(stats.failure_rate || 0),
          refundRate: parseFloat(stats.refund_rate || 0)
        }
      };
    } catch (error) {
      logger.error('PaymentService - Get Statistics Error:', error);
      throw new Error('Failed to fetch payment statistics');
    }
  }


  // Export payments
  async exportPayments(format, filters) {
    try {
      const data = await PaymentRepository.getPaymentsForExport(filters);

      if (!data || data.length === 0) {
        return { data: [], count: 0 };
      }

      // Format data for export
      const formattedData = data.map(payment => ({
        'Payment ID': payment.payment_id,
        'Transaction ID': payment.transaction_id,
        'Booking ID': payment.booking_id || 'N/A',
        'Amount (₹)': payment.amount,
        'Payment Method': payment.payment_method,
        'Payment Status': payment.payment_status,
        'Payment Type': payment.payment_type,
        'Customer Name': payment.customer_name || 'N/A',
        'Customer Phone': payment.customer_phone || 'N/A',
        'Rider Name': payment.rider_name || 'N/A',
        'Rider Code': payment.rider_code || 'N/A',
        'Gateway': payment.gateway_name || 'N/A',
        'Gateway Transaction ID': payment.gateway_transaction_id || 'N/A',
        'Platform Commission (₹)': payment.platform_commission,
        'Rider Earning (₹)': payment.rider_earning,
        'Taxes (₹)': payment.taxes,
        'Refund Amount (₹)': payment.refund_amount,
        'Refund Status': payment.refund_status,
        'City': payment.city || 'N/A',
        'Created At': payment.created_at
      }));

      return {
        data: formattedData,
        count: formattedData.length
      };
    } catch (error) {
      logger.error('PaymentService - Export Payments Error:', error);
      throw new Error('Failed to export payments');
    }
  }

  // Process refund
  async processRefund(paymentId, refundAmount, refundReason, adminId) {
    try {
      const payment = await PaymentRepository.findById(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Business rule: Can only refund successful payments
      if (payment.payment_status !== 'SUCCESS') {
        throw new Error('Only successful payments can be refunded');
      }

      // Business rule: Refund amount cannot exceed payment amount
      const totalRefunded = parseFloat(payment.refund_amount || 0) + parseFloat(refundAmount);
      if (totalRefunded > parseFloat(payment.amount)) {
        throw new Error('Total refund amount cannot exceed payment amount');
      }

      // Determine refund type
      const refundType = totalRefunded >= parseFloat(payment.amount) ? 'FULL_REFUND' : 'PARTIAL_REFUND';

      const { formatMySQLDate } = require('../../../src/utils/helpers');
      const refundInitiatedAt = formatMySQLDate();

      await PaymentRepository.processRefund(paymentId, refundAmount, refundReason, refundType, adminId, refundInitiatedAt);

      logger.info('Refund processed successfully', {
        paymentId,
        refundAmount,
        refundType,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('PaymentService - Process Refund Error:', error);
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(paymentId, newStatus, adminId) {
    try {
      const payment = await PaymentRepository.findById(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Business rule: Cannot change refunded payment status
      if (payment.payment_status === 'REFUNDED') {
        throw new Error('Cannot change status of refunded payment');
      }

      const { formatMySQLDate } = require('../../../src/utils/helpers');
      const updatedAt = formatMySQLDate();

      await PaymentRepository.updatePaymentStatus(paymentId, newStatus, adminId, updatedAt);

      logger.info('Payment status updated', {
        paymentId,
        oldStatus: payment.payment_status,
        newStatus,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('PaymentService - Update Payment Status Error:', error);
      throw error;
    }
  }

  // Verify payment
  async verifyPayment(paymentId, adminId) {
    try {
      const payment = await PaymentRepository.findById(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.verified === 1) {
        throw new Error('Payment is already verified');
      }

      const { formatMySQLDate } = require('../../../src/utils/helpers');
      const verifiedAt = formatMySQLDate();

      await PaymentRepository.verifyPayment(paymentId, adminId, verifiedAt);

      logger.info('Payment verified', {
        paymentId,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('PaymentService - Verify Payment Error:', error);
      throw error;
    }
  }


  // ==================== WALLET METHODS ====================

  // Get user wallet
  async getUserWallet(userId) {
    try {
      const wallet = await PaymentRepository.getUserWallet(userId);

      if (!wallet) {
        throw new Error('User wallet not found');
      }

      const transactions = await PaymentRepository.getUserWalletTransactions(userId, 10);

      return {
        walletInfo: {
          walletId: wallet.wallet_id,
          balance: parseFloat(wallet.balance || 0).toFixed(2),
          status: wallet.status
        },
        user: {
          userId: wallet.user_id,
          name: wallet.full_name,
          phone: wallet.phone_number,
          email: wallet.email
        },
        statistics: {
          totalCredited: parseFloat(wallet.total_credited || 0).toFixed(2),
          totalDebited: parseFloat(wallet.total_debited || 0).toFixed(2),
          totalRefunded: parseFloat(wallet.total_refunded || 0).toFixed(2),
          totalBonus: parseFloat(wallet.total_bonus || 0).toFixed(2)
        },
        recentTransactions: transactions.map(t => ({
          transactionId: t.transaction_id,
          type: t.transaction_type,
          amount: parseFloat(t.amount),
          balanceBefore: parseFloat(t.balance_before),
          balanceAfter: parseFloat(t.balance_after),
          description: t.description,
          createdAt: t.created_at
        }))
      };
    } catch (error) {
      logger.error('PaymentService - Get User Wallet Error:', error);
      if (error.message === 'User wallet not found') {
        throw error;
      }
      throw new Error('Failed to fetch user wallet');
    }
  }

  // Get rider wallet
  async getRiderWallet(riderId) {
    try {
      const wallet = await PaymentRepository.getRiderWallet(riderId);

      if (!wallet) {
        throw new Error('Rider wallet not found');
      }

      const transactions = await PaymentRepository.getRiderWalletTransactions(riderId, 10);

      return {
        walletInfo: {
          walletId: wallet.wallet_id,
          balance: parseFloat(wallet.balance || 0).toFixed(2),
          pendingSettlement: parseFloat(wallet.pending_settlement || 0).toFixed(2),
          status: wallet.status
        },
        rider: {
          riderId: wallet.rider_id,
          name: wallet.full_name,
          phone: wallet.phone_number,
          email: wallet.email,
          riderCode: wallet.rider_code
        },
        statistics: {
          totalEarnings: parseFloat(wallet.total_earnings || 0).toFixed(2),
          totalSettled: parseFloat(wallet.total_settled || 0).toFixed(2),
          totalBonus: parseFloat(wallet.total_bonus || 0).toFixed(2),
          totalPenalties: parseFloat(wallet.total_penalties || 0).toFixed(2)
        },
        recentTransactions: transactions.map(t => ({
          transactionId: t.transaction_id,
          type: t.transaction_type,
          amount: parseFloat(t.amount),
          balanceBefore: parseFloat(t.balance_before),
          balanceAfter: parseFloat(t.balance_after),
          description: t.description,
          createdAt: t.created_at
        }))
      };
    } catch (error) {
      logger.error('PaymentService - Get Rider Wallet Error:', error);
      if (error.message === 'Rider wallet not found') {
        throw error;
      }
      throw new Error('Failed to fetch rider wallet');
    }
  }

  // Credit user wallet
  async creditUserWallet(userId, amount, description, adminId) {
    try {
      if (amount <= 0) {
        throw new Error('Credit amount must be greater than zero');
      }

      await PaymentRepository.creditUserWallet(userId, amount, description, 'ADMIN_CREDIT', null, adminId);

      logger.info('User wallet credited', {
        userId,
        amount,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('PaymentService - Credit User Wallet Error:', error);
      throw error;
    }
  }

  // Debit user wallet
  async debitUserWallet(userId, amount, description, adminId) {
    try {
      if (amount <= 0) {
        throw new Error('Debit amount must be greater than zero');
      }

      await PaymentRepository.debitUserWallet(userId, amount, description, 'ADMIN_DEBIT', null, adminId);

      logger.info('User wallet debited', {
        userId,
        amount,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('PaymentService - Debit User Wallet Error:', error);
      throw error;
    }
  }

  // Credit rider wallet
  async creditRiderWallet(riderId, amount, description, adminId) {
    try {
      if (amount <= 0) {
        throw new Error('Credit amount must be greater than zero');
      }

      await PaymentRepository.creditRiderWallet(riderId, amount, description, 'BONUS', null, adminId);

      logger.info('Rider wallet credited', {
        riderId,
        amount,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('PaymentService - Credit Rider Wallet Error:', error);
      throw error;
    }
  }

  // Get wallet history
  async getWalletHistory(userId, walletType = 'USER', limit = 50) {
    try {
      let transactions;

      if (walletType === 'USER') {
        transactions = await PaymentRepository.getUserWalletTransactions(userId, limit);
      } else {
        transactions = await PaymentRepository.getRiderWalletTransactions(userId, limit);
      }

      return {
        walletType,
        transactions: transactions.map(t => ({
          transactionId: t.transaction_id,
          type: t.transaction_type,
          amount: parseFloat(t.amount),
          balanceBefore: parseFloat(t.balance_before),
          balanceAfter: parseFloat(t.balance_after),
          referenceType: t.reference_type,
          referenceId: t.reference_id,
          description: t.description,
          performedBy: t.performed_by,
          adminRemarks: t.admin_remarks,
          createdAt: t.created_at
        }))
      };
    } catch (error) {
      logger.error('PaymentService - Get Wallet History Error:', error);
      throw new Error('Failed to fetch wallet history');
    }
  }


  // ==================== SETTLEMENT METHODS ====================

  // Get settlements
  async getSettlements(filters, pagination) {
    try {
      const result = await PaymentRepository.getSettlements(filters, pagination);
      
      // Format response data
      result.settlements = result.settlements.map(settlement => ({
        settlementId: settlement.settlement_id,
        settlementCode: settlement.settlement_code,
        rider: {
          riderId: settlement.rider_id,
          name: settlement.rider_name,
          phone: settlement.rider_phone,
          riderCode: settlement.rider_code,
          email: settlement.rider_email
        },
        amount: {
          totalEarnings: parseFloat(settlement.total_earnings || 0),
          platformCommission: parseFloat(settlement.platform_commission || 0),
          taxes: parseFloat(settlement.taxes || 0),
          penalties: parseFloat(settlement.penalties || 0),
          bonuses: parseFloat(settlement.bonuses || 0),
          adjustments: parseFloat(settlement.adjustments || 0),
          settlementAmount: parseFloat(settlement.settlement_amount || 0)
        },
        period: {
          start: settlement.period_start,
          end: settlement.period_end
        },
        trips: {
          total: settlement.total_trips,
          completed: settlement.completed_trips
        },
        bankDetails: settlement.bank_account_number ? {
          accountNumber: settlement.bank_account_number,
          ifscCode: settlement.ifsc_code
        } : null,
        status: settlement.status,
        transactionReference: settlement.transaction_reference,
        utrNumber: settlement.utr_number,
        processedAt: settlement.processed_at,
        completedAt: settlement.completed_at,
        createdAt: settlement.created_at
      }));

      return result;
    } catch (error) {
      logger.error('PaymentService - Get Settlements Error:', error);
      throw new Error('Failed to fetch settlements');
    }
  }

  // Get settlement details
  async getSettlementById(settlementId) {
    try {
      const settlement = await PaymentRepository.getSettlementDetails(settlementId);

      if (!settlement) {
        throw new Error('Settlement not found');
      }

      return {
        settlementInfo: {
          settlementId: settlement.settlement_id,
          settlementCode: settlement.settlement_code,
          status: settlement.status,
          createdAt: settlement.created_at,
          processedAt: settlement.processed_at,
          completedAt: settlement.completed_at
        },
        rider: {
          riderId: settlement.rider_id,
          name: settlement.rider_name,
          phone: settlement.rider_phone,
          email: settlement.rider_email,
          riderCode: settlement.rider_code,
          assignedCity: settlement.assigned_city
        },
        amount: {
          totalEarnings: parseFloat(settlement.total_earnings || 0).toFixed(2),
          platformCommission: parseFloat(settlement.platform_commission || 0).toFixed(2),
          taxes: parseFloat(settlement.taxes || 0).toFixed(2),
          penalties: parseFloat(settlement.penalties || 0).toFixed(2),
          bonuses: parseFloat(settlement.bonuses || 0).toFixed(2),
          adjustments: parseFloat(settlement.adjustments || 0).toFixed(2),
          settlementAmount: parseFloat(settlement.settlement_amount || 0).toFixed(2)
        },
        period: {
          start: settlement.period_start,
          end: settlement.period_end
        },
        trips: {
          total: settlement.total_trips,
          completed: settlement.completed_trips
        },
        bankDetails: {
          accountNumber: settlement.bank_account_number,
          ifscCode: settlement.ifsc_code
        },
        transaction: {
          reference: settlement.transaction_reference,
          utrNumber: settlement.utr_number
        },
        processing: {
          remarks: settlement.processing_remarks,
          failureReason: settlement.failure_reason
        }
      };
    } catch (error) {
      logger.error('PaymentService - Get Settlement By ID Error:', error);
      if (error.message === 'Settlement not found') {
        throw error;
      }
      throw new Error('Failed to fetch settlement details');
    }
  }

  // Process settlement
  async processSettlement(settlementId, transactionReference, utrNumber, adminId) {
    try {
      const settlement = await PaymentRepository.getSettlementDetails(settlementId);

      if (!settlement) {
        throw new Error('Settlement not found');
      }

      // Business rule: Can only process pending settlements
      if (settlement.status !== 'PENDING') {
        throw new Error('Only pending settlements can be processed');
      }

      const { formatMySQLDate } = require('../../../src/utils/helpers');
      const processedAt = formatMySQLDate();

      await PaymentRepository.processSettlement(settlementId, transactionReference, utrNumber, adminId, processedAt);

      logger.info('Settlement processed successfully', {
        settlementId,
        settlementCode: settlement.settlement_code,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('PaymentService - Process Settlement Error:', error);
      throw error;
    }
  }

  // ==================== COMMISSION METHODS ====================

  // Get commission overview
  async getCommissionOverview(filters) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const overview = await PaymentRepository.getCommissionOverview(startDate, endDate);
      const byCity = await PaymentRepository.getCommissionByCity(startDate, endDate);

      return {
        period: {
          startDate,
          endDate
        },
        overview: {
          totalBookings: overview.total_bookings || 0,
          totalRevenue: parseFloat(overview.total_revenue || 0).toFixed(2),
          totalCommission: parseFloat(overview.total_commission || 0).toFixed(2),
          totalRiderEarnings: parseFloat(overview.total_rider_earnings || 0).toFixed(2),
          totalTaxes: parseFloat(overview.total_taxes || 0).toFixed(2),
          totalGatewayCharges: parseFloat(overview.total_gateway_charges || 0).toFixed(2),
          avgCommission: parseFloat(overview.avg_commission || 0).toFixed(2)
        },
        byCity: byCity.map(city => ({
          city: city.city,
          totalBookings: city.total_bookings,
          totalRevenue: parseFloat(city.total_revenue || 0).toFixed(2),
          totalCommission: parseFloat(city.total_commission || 0).toFixed(2),
          totalRiderEarnings: parseFloat(city.total_rider_earnings || 0).toFixed(2),
          avgCommission: parseFloat(city.avg_commission || 0).toFixed(2)
        }))
      };
    } catch (error) {
      logger.error('PaymentService - Get Commission Overview Error:', error);
      throw new Error('Failed to fetch commission overview');
    }
  }


  // ==================== ANALYTICS METHODS ====================

  // Get revenue analytics
  async getRevenueAnalytics(filters) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const data = await PaymentRepository.getRevenueAnalytics(startDate, endDate);

      return {
        period: {
          startDate,
          endDate
        },
        revenue: {
          total: parseFloat(data.total_revenue || 0).toFixed(2),
          today: parseFloat(data.today_revenue || 0).toFixed(2),
          week: parseFloat(data.week_revenue || 0).toFixed(2),
          month: parseFloat(data.month_revenue || 0).toFixed(2),
          year: parseFloat(data.year_revenue || 0).toFixed(2),
          avgTransaction: parseFloat(data.avg_transaction || 0).toFixed(2)
        },
        commission: {
          total: parseFloat(data.total_commission || 0).toFixed(2)
        },
        riderEarnings: {
          total: parseFloat(data.total_rider_earnings || 0).toFixed(2)
        },
        transactions: {
          total: data.total_transactions || 0
        }
      };
    } catch (error) {
      logger.error('PaymentService - Get Revenue Analytics Error:', error);
      throw new Error('Failed to fetch revenue analytics');
    }
  }

  // Get payment method distribution
  async getPaymentMethodDistribution(filters) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const data = await PaymentRepository.getPaymentMethodDistribution(startDate, endDate);

      return data.map(method => ({
        paymentMethod: method.payment_method,
        transactionCount: method.transaction_count,
        successfulCount: method.successful_count,
        totalAmount: parseFloat(method.total_amount || 0).toFixed(2),
        avgAmount: parseFloat(method.avg_amount || 0).toFixed(2),
        successRate: parseFloat(method.success_rate || 0)
      }));
    } catch (error) {
      logger.error('PaymentService - Get Payment Method Distribution Error:', error);
      throw new Error('Failed to fetch payment method distribution');
    }
  }

  // Get top cities by revenue
  async getTopCities(filters, limit = 10) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const cities = await PaymentRepository.getTopCitiesByRevenue(startDate, endDate, limit);

      return cities.map(city => ({
        city: city.city,
        totalTransactions: city.total_transactions,
        totalRevenue: parseFloat(city.total_revenue || 0).toFixed(2),
        avgTransaction: parseFloat(city.avg_transaction || 0).toFixed(2),
        totalCommission: parseFloat(city.total_commission || 0).toFixed(2)
      }));
    } catch (error) {
      logger.error('PaymentService - Get Top Cities Error:', error);
      throw new Error('Failed to fetch top cities');
    }
  }

  // Get top users by spending
  async getTopUsers(filters, limit = 10) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const users = await PaymentRepository.getTopUsersBySpending(startDate, endDate, limit);

      return users.map(user => ({
        userId: user.user_id,
        name: user.full_name,
        phone: user.phone_number,
        email: user.email,
        totalTransactions: user.total_transactions,
        totalSpent: parseFloat(user.total_spent || 0).toFixed(2),
        avgTransaction: parseFloat(user.avg_transaction || 0).toFixed(2)
      }));
    } catch (error) {
      logger.error('PaymentService - Get Top Users Error:', error);
      throw new Error('Failed to fetch top users');
    }
  }

  // Get top riders by earnings
  async getTopRiders(filters, limit = 10) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const riders = await PaymentRepository.getTopRidersByEarnings(startDate, endDate, limit);

      return riders.map(rider => ({
        riderId: rider.rider_id,
        name: rider.full_name,
        phone: rider.phone_number,
        riderCode: rider.rider_code,
        assignedCity: rider.assigned_city,
        totalTrips: rider.total_trips,
        totalEarnings: parseFloat(rider.total_earnings || 0).toFixed(2),
        avgEarning: parseFloat(rider.avg_earning || 0).toFixed(2),
        totalCommissionPaid: parseFloat(rider.total_commission_paid || 0).toFixed(2)
      }));
    } catch (error) {
      logger.error('PaymentService - Get Top Riders Error:', error);
      throw new Error('Failed to fetch top riders');
    }
  }

  // Get peak revenue hours
  async getPeakHours(filters) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const hours = await PaymentRepository.getPeakRevenueHours(startDate, endDate);

      return hours.map(hour => ({
        hour: hour.hour,
        timeRange: `${hour.hour}:00 - ${hour.hour}:59`,
        totalTransactions: hour.total_transactions,
        totalRevenue: parseFloat(hour.total_revenue || 0).toFixed(2),
        avgTransaction: parseFloat(hour.avg_transaction || 0).toFixed(2)
      }));
    } catch (error) {
      logger.error('PaymentService - Get Peak Hours Error:', error);
      throw new Error('Failed to fetch peak hours');
    }
  }

  // Get daily report
  async getDailyReport(filters) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const report = await PaymentRepository.getDailyReport(startDate, endDate);

      return report.map(day => ({
        date: day.date,
        totalTransactions: day.total_transactions,
        revenue: parseFloat(day.revenue || 0).toFixed(2),
        commission: parseFloat(day.commission || 0).toFixed(2),
        riderEarnings: parseFloat(day.rider_earnings || 0).toFixed(2),
        failedTransactions: day.failed_transactions,
        totalRefunds: parseFloat(day.total_refunds || 0).toFixed(2)
      }));
    } catch (error) {
      logger.error('PaymentService - Get Daily Report Error:', error);
      throw new Error('Failed to fetch daily report');
    }
  }

  // Get monthly report
  async getMonthlyReport(year) {
    try {
      const report = await PaymentRepository.getMonthlyReport(year || new Date().getFullYear());

      return report.map(month => ({
        month: month.month,
        monthName: month.month_name,
        totalTransactions: month.total_transactions,
        revenue: parseFloat(month.revenue || 0).toFixed(2),
        commission: parseFloat(month.commission || 0).toFixed(2),
        riderEarnings: parseFloat(month.rider_earnings || 0).toFixed(2),
        avgTransaction: parseFloat(month.avg_transaction || 0).toFixed(2)
      }));
    } catch (error) {
      logger.error('PaymentService - Get Monthly Report Error:', error);
      throw new Error('Failed to fetch monthly report');
    }
  }

  // Get yearly report
  async getYearlyReport() {
    try {
      const report = await PaymentRepository.getYearlyReport();

      return report.map(year => ({
        year: year.year,
        totalTransactions: year.total_transactions,
        revenue: parseFloat(year.revenue || 0).toFixed(2),
        commission: parseFloat(year.commission || 0).toFixed(2),
        riderEarnings: parseFloat(year.rider_earnings || 0).toFixed(2),
        avgTransaction: parseFloat(year.avg_transaction || 0).toFixed(2)
      }));
    } catch (error) {
      logger.error('PaymentService - Get Yearly Report Error:', error);
      throw new Error('Failed to fetch yearly report');
    }
  }

  // Helper method to get date range
  getDateRange(filters) {
    const { period, startDate, endDate } = filters;

    if (startDate && endDate) {
      return { startDate, endDate };
    }

    const now = new Date();
    let start, end;

    switch (period) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7));
        end = new Date();
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        start = new Date(now.setDate(now.getDate() - 30));
        end = new Date();
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }
}

module.exports = new PaymentService();

