
'use strict';

const MockPaymentProvider = require('./MockPaymentProvider');

class PaymentProviderFactory {
  static getProvider() {
    const providerName = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();

    if (process.env.NODE_ENV === 'production' && providerName === 'mock') {
      throw new Error('Mock payment provider is not allowed in production environment.');
    }

    switch (providerName) {
      case 'mock':
        return new MockPaymentProvider();

      case 'razorpay':

        throw new Error('Razorpay provider not yet implemented. Set PAYMENT_PROVIDER=mock for development.');

      default:
        throw new Error(`Unknown payment provider: "${providerName}". Set PAYMENT_PROVIDER=mock in .env.`);
    }
  }

  static getProviderName() {
    return (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
  }
}

module.exports = PaymentProviderFactory;

