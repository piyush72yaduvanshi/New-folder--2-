class Payment {
  constructor(data = {}) {
    this.payment_id = data.payment_id || null;
    this.user_id = data.user_id || null;
    this.booking_id = data.booking_id || null;

    this.gateway = data.gateway || null;
    this.gateway_order_id = data.gateway_order_id || null;
    this.gateway_payment_id = data.gateway_payment_id || null;

    this.amount =
      data.amount !== undefined && data.amount !== null
        ? Number(data.amount)
        : 0;

    this.currency = data.currency || "INR";
    this.purpose = data.purpose || null;
    this.status = data.status || "PENDING";
    this.method = data.method || null;

    this.meta = this.parseMeta(data.meta);

    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  parseMeta(meta) {
    if (meta === undefined || meta === null) return null;
    if (typeof meta === "object") return meta;

    try {
      return JSON.parse(meta);
    } catch (error) {
      return null;
    }
  }

  toResponse() {
    return {
      payment_id: this.payment_id,
      user_id: this.user_id,
      booking_id: this.booking_id,
      gateway: this.gateway,
      gateway_order_id: this.gateway_order_id,
      gateway_payment_id: this.gateway_payment_id,
      amount: this.amount,
      currency: this.currency,
      purpose: this.purpose,
      status: this.status,
      method: this.method,
      meta: this.meta,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  toSafeResponse() {
    return {
      payment_id: this.payment_id,
      booking_id: this.booking_id,
      gateway: this.gateway,
      gateway_order_id: this.gateway_order_id,
      gateway_payment_id: this.gateway_payment_id,
      amount: this.amount,
      currency: this.currency,
      purpose: this.purpose,
      status: this.status,
      method: this.method,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Payment;