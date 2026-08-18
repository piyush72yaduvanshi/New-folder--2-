'use strict';

const PaymentProvider = require('./PaymentProvider');
const structuredLogger = require('../../../utils/structuredLogger');

class MockPaymentProvider extends PaymentProvider {
  async createOrder({ amount, currency = 'INR', referenceId, description }) {
    const orderId = `mock_order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    structuredLogger.debug('[MockPayment] createOrder', { orderId, amount, referenceId });
    return {
      orderId,
      amount,
      currency,
      status: 'CREATED',
      gatewayOrderId: orderId,
      raw: { mock: true, referenceId, description }
    };
  }

  async verifyPayment({ orderId, gatewayOrderId, gatewayPaymentId, signature }) {
    // Mock always succeeds — replace with real signature verification in production
    structuredLogger.debug('[MockPayment] verifyPayment', { orderId, gatewayPaymentId });
    return {
      verified: true,
      paymentId: gatewayPaymentId || `mock_pay_${Date.now()}`,
      amount: 0,  // Real provider returns actual amount
      status: 'SUCCESS'
    };
  }

  async initiateRefund({ paymentId, amount, reason }) {
    const refundId = `mock_refund_${Date.now()}`;
    structuredLogger.debug('[MockPayment] initiateRefund', { paymentId, amount, reason });
    return { refundId, status: 'PROCESSED', amount };
  }

  async getPaymentStatus(gatewayPaymentId) {
    return { status: 'SUCCESS', amount: 0, currency: 'INR', raw: { mock: true } };
  }

  verifyWebhookSignature(rawBody, signature) {
    return true; // Mock always valid
  }

  getProviderName() { return 'mock'; }
}

module.exports = MockPaymentProvider;

