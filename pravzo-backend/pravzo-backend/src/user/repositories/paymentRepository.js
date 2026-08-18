const db = require("../../../src/config/db");
const Payment = require("../models/Payment");

const ALLOWED_PURPOSES = ["wallet_topup", "booking", "refund", "other"];
const ALLOWED_STATUSES = ["created", "paid", "failed", "refunded"];
const ALLOWED_GATEWAYS = ["razorpay"];
const ALLOWED_METHODS = [
  "card",
  "upi",
  "netbanking",
  "wallet",
  "emi",
  "bank_transfer",
  "other",
];

class PaymentRepository {
  async createOrderRecord(payload, executor = db) {
    const amountPaise = Number(payload.amountPaise);

    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      throw new Error("Invalid payment amount");
    }

    const existing = await this.findByOrderId(payload.razorpayOrderId, executor);
    if (existing) return existing;

    const currency = String(payload.currency || "INR").toUpperCase();
    const purpose = ALLOWED_PURPOSES.includes(payload.purpose)
      ? payload.purpose
      : "wallet_topup";

    const gateway = ALLOWED_GATEWAYS.includes(payload.gateway)
      ? payload.gateway
      : "razorpay";

    const [result] = await executor.query(
      `INSERT INTO payments
      (
        user_id,
        booking_id,
        gateway,
        gateway_order_id,
        gateway_payment_id,
        gateway_signature,
        amount,
        currency,
        purpose,
        status,
        method,
        meta
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.userId,
        payload.bookingId || null,
        gateway,
        payload.razorpayOrderId,
        null,
        null,
        (amountPaise / 100).toFixed(2),
        currency,
        purpose,
        "created",
        null,
        JSON.stringify(payload.meta || {}),
      ],
    );

    return this.findByPaymentId(result.insertId, executor);
  }

  async findByOrderId(gatewayOrderId, executor = db) {
    const [rows] = await executor.query(
      `SELECT * FROM payments WHERE gateway_order_id = ? LIMIT 1`,
      [gatewayOrderId],
    );

    if (rows.length === 0) return null;
    return new Payment(rows[0]);
  }

  async findByPaymentId(paymentId, executor = db) {
    const [rows] = await executor.query(
      `SELECT * FROM payments WHERE payment_id = ? LIMIT 1`,
      [paymentId],
    );

    if (rows.length === 0) return null;
    return new Payment(rows[0]);
  }

  async findByGatewayPaymentId(gatewayPaymentId, executor = db) {
    const [rows] = await executor.query(
      `SELECT * FROM payments WHERE gateway_payment_id = ? LIMIT 1`,
      [gatewayPaymentId],
    );

    if (rows.length === 0) return null;
    return new Payment(rows[0]);
  }

  async markPaidByOrderId(
    gatewayOrderId,
    { razorpayPaymentId, razorpaySignature = null, method = null },
    executor = db,
  ) {
    const existing = await this.findByOrderId(gatewayOrderId, executor);

    if (!existing) {
      throw new Error("Payment order record not found");
    }

    if (existing.status === "paid") {
      return existing;
    }

    const safeStatus = ALLOWED_STATUSES.includes("paid") ? "paid" : "created";
    const safeMethod =
      method && ALLOWED_METHODS.includes(method) ? method : null;

    await executor.query(
      `UPDATE payments
       SET gateway_payment_id = COALESCE(?, gateway_payment_id),
           gateway_signature = COALESCE(?, gateway_signature),
           status = ?,
           method = COALESCE(?, method)
       WHERE gateway_order_id = ?
         AND status <> 'paid'`,
      [razorpayPaymentId, razorpaySignature, safeStatus, safeMethod, gatewayOrderId],
    );

    return this.findByOrderId(gatewayOrderId, executor);
  }

  async markFailedByOrderId(
    gatewayOrderId,
    { razorpayPaymentId = null, method = null } = {},
    executor = db,
  ) {
    const existing = await this.findByOrderId(gatewayOrderId, executor);

    if (!existing) {
      throw new Error("Payment order record not found");
    }

    if (existing.status === "paid") {
      return existing;
    }

    const safeStatus = ALLOWED_STATUSES.includes("failed") ? "failed" : "created";
    const safeMethod =
      method && ALLOWED_METHODS.includes(method) ? method : null;

    await executor.query(
      `UPDATE payments
       SET gateway_payment_id = COALESCE(?, gateway_payment_id),
           method = COALESCE(?, method),
           status = ?
       WHERE gateway_order_id = ?
         AND status <> 'paid'`,
      [razorpayPaymentId, safeMethod, safeStatus, gatewayOrderId],
    );

    return this.findByOrderId(gatewayOrderId, executor);
  }

  async markRefunded(paymentId, executor = db) {
    const existing = await this.findByPaymentId(paymentId, executor);

    if (!existing) {
      throw new Error("Payment record not found");
    }

    await executor.query(
      `UPDATE payments
       SET status = ?
       WHERE payment_id = ?`,
      ["refunded", paymentId],
    );

    return this.findByPaymentId(paymentId, executor);
  }

  async listByUser(userId, { limit = 20, offset = 0 } = {}, executor = db) {
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const [rows] = await executor.query(
      `SELECT *
       FROM payments
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, safeLimit, safeOffset],
    );

    return rows.map((row) => new Payment(row));
  }
}

module.exports = new PaymentRepository();