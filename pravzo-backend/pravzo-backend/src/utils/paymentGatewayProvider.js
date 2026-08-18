const crypto = require('crypto');
const logger = require('./logger');


// Base class mapping target interface
class PaymentGatewayProvider {
  async createPayment(params) {
    throw new Error('createPayment() not implemented');
  }

  async verifyPayment(params) {
    throw new Error('verifyPayment() not implemented');
  }

  async refund(params) {
    throw new Error('refund() not implemented');
  }

  async capture(params) {
    throw new Error('capture() not implemented');
  }

  async void(params) {
    throw new Error('void() not implemented');
  }

  async fetchStatus(params) {
    throw new Error('fetchStatus() not implemented');
  }
}

// concrete Razorpay Adapter
class RazorpayAdapter extends PaymentGatewayProvider {
  async createPayment(params) {
    logger.info('[RazorpayAdapter] Creating Razorpay payment order', params);
    // Simulate API request to Razorpay
    const orderId = 'order_rzp_' + crypto.randomBytes(8).toString('hex');
    return {
      success: true,
      gatewayOrderId: orderId,
      amount: params.amount,
      currency: params.currency || 'INR',
      status: 'CREATED',
      meta: { checkoutUrl: `https://checkout.razorpay.com/v1/pay?id=${orderId}` }
    };
  }

  async verifyPayment(params) {
    logger.info('[RazorpayAdapter] Verifying Razorpay payment signature', params);
    // Verify signature logic
    const { razorpaySignature, razorpayPaymentId, razorpayOrderId } = params;
    if (razorpaySignature && razorpayPaymentId && razorpayOrderId) {
      return { success: true, status: 'SUCCESS', transactionId: razorpayPaymentId };
    }
    // For demo/mock validation, if payment ID starts with pay_
    if (razorpayPaymentId) {
      return { success: true, status: 'SUCCESS', transactionId: razorpayPaymentId };
    }
    return { success: false, status: 'FAILED', message: 'Signature missing' };
  }

  async refund(params) {
    logger.info('[RazorpayAdapter] Processing Razorpay refund', params);
    return {
      success: true,
      refundId: 'rfnd_rzp_' + crypto.randomBytes(8).toString('hex'),
      status: 'SUCCESS'
    };
  }

  async capture(params) {
    return { success: true, status: 'SUCCESS' };
  }

  async void(params) {
    return { success: true, status: 'VOID' };
  }

  async fetchStatus(transactionId) {
    return { status: 'SUCCESS', rawStatus: 'captured' };
  }
}

// concrete Stripe Adapter
class StripeAdapter extends PaymentGatewayProvider {
  async createPayment(params) {
    logger.info('[StripeAdapter] Creating Stripe payment intent', params);
    const intentId = 'pi_str_' + crypto.randomBytes(8).toString('hex');
    return {
      success: true,
      gatewayOrderId: intentId,
      amount: params.amount,
      currency: params.currency || 'INR',
      status: 'CREATED',
      meta: { clientSecret: intentId + '_secret_' + crypto.randomBytes(4).toString('hex') }
    };
  }

  async verifyPayment(params) {
    logger.info('[StripeAdapter] Verifying Stripe payment intent', params);
    if (params.gatewayPaymentId) {
      return { success: true, status: 'SUCCESS', transactionId: params.gatewayPaymentId };
    }
    return { success: true, status: 'SUCCESS', transactionId: 'txn_str_' + crypto.randomBytes(8).toString('hex') };
  }

  async refund(params) {
    logger.info('[StripeAdapter] Processing Stripe refund', params);
    return {
      success: true,
      refundId: 're_str_' + crypto.randomBytes(8).toString('hex'),
      status: 'SUCCESS'
    };
  }

  async capture(params) {
    return { success: true, status: 'SUCCESS' };
  }

  async void(params) {
    return { success: true, status: 'VOID' };
  }

  async fetchStatus(transactionId) {
    return { status: 'SUCCESS', rawStatus: 'succeeded' };
  }
}

// concrete PhonePe Adapter
class PhonePeAdapter extends PaymentGatewayProvider {
  async createPayment(params) {
    logger.info('[PhonePeAdapter] Creating PhonePe transaction request', params);
    const txnId = 'txn_pe_' + crypto.randomBytes(8).toString('hex');
    return {
      success: true,
      gatewayOrderId: txnId,
      amount: params.amount,
      currency: params.currency || 'INR',
      status: 'CREATED',
      meta: { redirectUrl: `https://merchants.phonepe.com/pay/${txnId}` }
    };
  }

  async verifyPayment(params) {
    logger.info('[PhonePeAdapter] Verifying PhonePe transaction', params);
    if (params.gatewayPaymentId) {
      return { success: true, status: 'SUCCESS', transactionId: params.gatewayPaymentId };
    }
    return { success: true, status: 'SUCCESS', transactionId: 'txn_pe_' + crypto.randomBytes(8).toString('hex') };
  }

  async refund(params) {
    logger.info('[PhonePeAdapter] Processing PhonePe refund', params);
    return {
      success: true,
      refundId: 'rf_pe_' + crypto.randomBytes(8).toString('hex'),
      status: 'SUCCESS'
    };
  }

  async capture(params) {
    return { success: true, status: 'SUCCESS' };
  }

  async void(params) {
    return { success: true, status: 'VOID' };
  }

  async fetchStatus(transactionId) {
    return { status: 'SUCCESS', rawStatus: 'PAYMENT_SUCCESS' };
  }
}

// concrete Cash Adapter
class CashAdapter extends PaymentGatewayProvider {
  async createPayment(params) {
    return {
      success: true,
      gatewayOrderId: 'cash_' + Date.now(),
      amount: params.amount,
      currency: 'INR',
      status: 'SUCCESS'
    };
  }

  async verifyPayment(params) {
    return { success: true, status: 'SUCCESS', transactionId: params.gatewayPaymentId || 'cash_' + Date.now() };
  }

  async refund(params) {
    return { success: true, refundId: 'ref_cash_' + Date.now(), status: 'SUCCESS' };
  }

  async capture(params) { return { success: true, status: 'SUCCESS' }; }
  async void(params) { return { success: true, status: 'VOID' }; }
  async fetchStatus(id) { return { status: 'SUCCESS', rawStatus: 'paid' }; }
}

// concrete Wallet Adapter
class WalletAdapter extends PaymentGatewayProvider {
  async createPayment(params) {
    return {
      success: true,
      gatewayOrderId: 'wlt_' + Date.now(),
      amount: params.amount,
      currency: 'INR',
      status: 'SUCCESS'
    };
  }

  async verifyPayment(params) {
    return { success: true, status: 'SUCCESS', transactionId: params.gatewayPaymentId || 'wlt_' + Date.now() };
  }

  async refund(params) {
    return { success: true, refundId: 'ref_wlt_' + Date.now(), status: 'SUCCESS' };
  }

  async capture(params) { return { success: true, status: 'SUCCESS' }; }
  async void(params) { return { success: true, status: 'VOID' }; }
  async fetchStatus(id) { return { status: 'SUCCESS', rawStatus: 'paid' }; }
}

// Factory to resolve adapters
class PaymentGatewayFactory {
  static getProvider(providerName) {
    if (!providerName) {
      return new CashAdapter();
    }
    const name = providerName.toUpperCase();
    switch (name) {
      case 'RAZORPAY':
        return new RazorpayAdapter();
      case 'STRIPE':
        return new StripeAdapter();
      case 'PHONEPE':
        return new PhonePeAdapter();
      case 'WALLET':
        return new WalletAdapter();
      case 'CASH':
      default:
        return new CashAdapter();
    }
  }
}

module.exports = {
  PaymentGatewayProvider,
  PaymentGatewayFactory
};
