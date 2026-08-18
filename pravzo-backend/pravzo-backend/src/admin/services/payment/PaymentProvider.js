
'use strict';

class PaymentProvider {

  async createOrder(params) {
    throw new Error('PaymentProvider.createOrder() must be implemented');
  }


  async verifyPayment(params) {
    throw new Error('PaymentProvider.verifyPayment() must be implemented');
  }

  async initiateRefund(params) {
    throw new Error('PaymentProvider.initiateRefund() must be implemented');
  }


  async getPaymentStatus(gatewayPaymentId) {
    throw new Error('PaymentProvider.getPaymentStatus() must be implemented');
  }


  verifyWebhookSignature(rawBody, signature) {
    throw new Error('PaymentProvider.verifyWebhookSignature() must be implemented');
  }

 
  getProviderName() {
    return 'abstract';
  }
}

module.exports = PaymentProvider;

