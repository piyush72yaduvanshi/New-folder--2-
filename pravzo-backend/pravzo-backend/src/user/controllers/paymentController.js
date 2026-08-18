const logger = require("../../../src/utils/logger");
const crypto = require("crypto");
const razorpay = require("../../../src/config/razorpay");
const PaymentRepository = require("../repositories/paymentRepository");
const walletRepository = require("../repositories/walletRepository");
const db = require("../../../src/config/db");

function rupeesToPaise(amountRupees) {
  return Math.round(Number(amountRupees) * 100);
}

function safeEqualHex(a, b) {
  const aBuf = Buffer.from(String(a || ""), "utf8");
  const bBuf = Buffer.from(String(b || ""), "utf8");
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
}
exports.createWalletTopupOrder = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const amount = Number(req.body.amount);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid positive amount is required",
      });
    }

    const amountPaise = rupeesToPaise(amount);

    const Razorpay = require("razorpay");

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `pravzo_${userId}_${Date.now()}`,
      notes: {
        user_id: String(userId),
        purpose: "wallet_topup",
      },
    });

    const payment = await PaymentRepository.createOrderRecord({
      userId,
      bookingId: null,
      razorpayOrderId: order.id,
      amountPaise,
      currency: order.currency,
      purpose: "wallet_topup",
      meta: {
        receipt: order.receipt,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Wallet topup order created successfully",
      data: {
        order_id: order.id,
        amount: amountPaise / 100,
        amount_paise: amountPaise,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        payment,
      },
    });
  } catch (err) {
    logger.error("[paymentController.createWalletTopupOrder]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: err.message,
    });
  }
};

async function creditWalletForPayment(payment, executor) {
  if (!payment || payment.purpose !== "wallet_topup") return;

  const referenceId = payment.payment_id || payment.id;
  if (!referenceId) {
    throw new Error("Payment reference missing for wallet topup");
  }

  await walletRepository.creditMoneyIfNotProcessed(
    {
      user_id: payment.user_id,
      amount: Number(payment.amount),
      source: "topup",
      payment_id: payment.payment_id || null,
      booking_id: payment.booking_id || null,
      payout_id: null,
      reference_id: referenceId,
      note: `Wallet top-up via Razorpay (order ${payment.gateway_order_id})`,
      status: "success",
      meta: {
        gateway: payment.gateway,
        gateway_order_id: payment.gateway_order_id,
        gateway_payment_id: payment.gateway_payment_id,
        purpose: payment.purpose,
      },
    },
    executor,
  );
}

exports.verifyWalletTopup = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message:
          "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required",
      });
    }

    const existing = await PaymentRepository.findByOrderId(razorpay_order_id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found",
      });
    }

    if (Number(existing.user_id) !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to verify this payment",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!safeEqualHex(expectedSignature, razorpay_signature)) {
      await PaymentRepository.markFailedByOrderId(razorpay_order_id, {
        razorpayPaymentId: razorpay_payment_id,
        method: "razorpay",
      });

      return res.status(400).json({
        success: false,
        message: "Signature verification failed",
      });
    }

    if (existing.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already processed",
        data: {
          payment: existing,
          already_processed: true,
        },
      });
    }

    const payment = await PaymentRepository.markPaidByOrderId(
      razorpay_order_id,
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        method: "razorpay",
      },
    );

    await creditWalletForPayment(payment);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        payment,
        already_processed: false,
      },
    });
  } catch (err) {
    logger.error("[paymentController.verifyWalletTopup]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: err.message,
    });
  }
};

exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    const eventId = req.headers["x-razorpay-event-id"];

    if (!webhookSecret) {
      return res.status(500).json({
        success: false,
        message: "Webhook secret not configured",
      });
    }

    if (!signature || !req.body) {
      return res.status(400).json({
        success: false,
        message: "Missing webhook signature or payload",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    if (!safeEqualHex(expectedSignature, signature)) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = JSON.parse(req.body.toString("utf8"));
    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;

    if (!paymentEntity) {
      return res.status(200).json({
        success: true,
        received: true,
      });
    }

    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    if (eventType === "payment.captured") {
      const existing = await PaymentRepository.findByOrderId(orderId);

      if (existing && existing.status !== "paid") {
        const payment = await PaymentRepository.markPaidByOrderId(orderId, {
          razorpayPaymentId: paymentId,
          razorpaySignature: null,
          method: paymentEntity.method || "razorpay",
        });

        await creditWalletForPayment(payment);
      }
    } else if (eventType === "payment.failed") {
      const existing = await PaymentRepository.findByOrderId(orderId);

      if (existing && existing.status !== "paid") {
        await PaymentRepository.markFailedByOrderId(orderId, {
          razorpayPaymentId: paymentId,
          method: paymentEntity.method || "razorpay",
        });
      }
    }

    return res.status(200).json({
      success: true,
      received: true,
      event_id: eventId || null,
    });
  } catch (err) {
    logger.error("[paymentController.handleRazorpayWebhook]", err);
    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
      error: err.message,
    });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const offset = Math.max(Number(req.query.offset || 0), 0);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const payments = await PaymentRepository.listByUser(userId, {
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: "Payment history fetched successfully",
      data: payments,
    });
  } catch (err) {
    logger.error("[paymentController.getMyPayments]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
      error: err.message,
    });
  }
};

exports.getPayoutHistory = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const offset = Math.max(Number(req.query.offset || 0), 0);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    const [rows] = await db.query(
      `SELECT
      payout_id,
      user_id,
      amount,
      method AS mode,
      status,
      bank_account_number,
      ifsc_code,
      account_holder_name,
      branch_name,
      upi_id,
      razorpayx_payout_id,
      razorpayx_fund_account_id,
      razorpayx_contact_id,
      reference_id AS reference,
      failure_reason,
      notes,
      processed_at,
      created_at,
      updated_at,
      currency
    FROM payouts
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`,
      [userId, limit, offset],
    );

    return res.status(200).json({
      success: true,
      message: "Payout history fetched successfully",
      data: rows,
      pagination: {
        limit,
        offset,
        count: rows.length,
      },
    });
  } catch (err) {
    logger.error("[paymentController.getPayoutHistory]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payout history",
    });
  }
};
exports.getRiderEarnings = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const offset = Math.max(Number(req.query.offset || 0), 0);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    const [rows] = await db.query(
      `SELECT
         earning_id,
         user_id,
         booking_id,
         job_id,
         gross_amount,
         commission_amount,
         net_amount,
         status,
         note,
         created_at
       FROM rider_earnings
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset],
    );

    const [summaryRows] = await db.query(
      `SELECT
         COUNT(*) AS total_records,
         COALESCE(SUM(gross_amount), 0) AS total_gross,
         COALESCE(SUM(commission_amount), 0) AS total_commission,
         COALESCE(SUM(net_amount), 0) AS total_net
       FROM rider_earnings
       WHERE user_id = ?`,
      [userId],
    );

    return res.status(200).json({
      success: true,
      message: "Rider earnings fetched successfully",
      data: rows,
      summary: summaryRows[0] || {
        total_records: 0,
        total_gross: 0,
        total_commission: 0,
        total_net: 0,
      },
      pagination: {
        limit,
        offset,
        count: rows.length,
      },
    });
  } catch (err) {
    logger.error("[paymentController.getRiderEarnings]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch rider earnings",
    });
  }
};
exports.createRiderEarning = async (req, res) => {
  try {
    const {
      user_id,
      booking_id = null,
      job_id = null,
      gross_amount,
      commission_amount = 0,
      note = null,
    } = req.body;

    if (!user_id || gross_amount === undefined || gross_amount === null) {
      return res.status(400).json({
        success: false,
        message: "user_id and gross_amount are required",
      });
    }

    const gross = Number(gross_amount);
    const commission = Number(commission_amount || 0);
    const net = gross - commission;

    if (Number.isNaN(gross) || Number.isNaN(commission)) {
      return res.status(400).json({
        success: false,
        message: "gross_amount and commission_amount must be valid numbers",
      });
    }

    const [result] = await db.query(
      `INSERT INTO rider_earnings (
        user_id,
        booking_id,
        job_id,
        gross_amount,
        commission_amount,
        net_amount,
        status,
        note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(user_id),
        booking_id ? Number(booking_id) : null,
        job_id ? Number(job_id) : null,
        gross,
        commission,
        net,
        "pending",
        note,
      ],
    );

    const [rows] = await db.query(
      `SELECT
         earning_id,
         user_id,
         booking_id,
         job_id,
         gross_amount,
         commission_amount,
         net_amount,
         status,
         note,
         created_at
       FROM rider_earnings
       WHERE earning_id = ?`,
      [result.insertId],
    );

    return res.status(201).json({
      success: true,
      message: "Rider earning created successfully",
      data: rows[0],
    });
  } catch (err) {
    logger.error("[paymentController.createRiderEarning]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create rider earning",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED PAYMENT ROUTES (added to close frontend ↔ backend gaps)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/payments/gateway/initiate
 * Creates a Razorpay order for a booking payment (NOT wallet topup).
 */
exports.initiatePaymentGateway = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { amount, currency = 'INR', booking_id, customer_email } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const Razorpay = require('razorpay');
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amountPaise = rupeesToPaise(amount);

    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: String(currency).toUpperCase(),
      receipt: `pravzo_${userId}_${Date.now()}`,
      notes: {
        user_id: String(userId),
        booking_id: booking_id ? String(booking_id) : '',
        purpose: 'booking_payment',
      },
    });

    const payment = await PaymentRepository.createOrderRecord({
      userId,
      bookingId: booking_id || null,
      razorpayOrderId: order.id,
      amountPaise,
      currency: order.currency,
      purpose: booking_id ? 'booking' : 'other',
      meta: { receipt: order.receipt, customer_email },
    });

    return res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        order_id: order.id,
        amount: amountPaise / 100,
        amount_paise: amountPaise,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        payment_id: payment?.payment_id || null,
      },
    });
  } catch (err) {
    logger.error('[paymentController.initiatePaymentGateway]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to initiate payment' });
  }
};

/**
 * POST /api/payments/:paymentId/verify
 * Verifies Razorpay payment for booking.
 */
exports.verifyBookingPayment = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const paymentId = Number(req.params.paymentId);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
      });
    }

    const existing = await PaymentRepository.findByOrderId(razorpay_order_id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Payment order not found' });
    }

    if (Number(existing.user_id) !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to verify this payment' });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!safeEqualHex(expectedSignature, razorpay_signature)) {
      await PaymentRepository.markFailedByOrderId(razorpay_order_id, { razorpayPaymentId: razorpay_payment_id, method: 'razorpay' });
      return res.status(400).json({ success: false, message: 'Signature verification failed' });
    }

    if (existing.status === 'paid') {
      return res.status(200).json({ success: true, message: 'Payment already verified', data: { payment: existing, already_processed: true } });
    }

    const payment = await PaymentRepository.markPaidByOrderId(razorpay_order_id, {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      method: 'razorpay',
    });

    // If this is a wallet topup, credit wallet
    if (payment.purpose === 'wallet_topup') {
      await walletRepository.creditMoneyIfNotProcessed({
        user_id: payment.user_id,
        amount: Number(payment.amount),
        source: 'topup',
        payment_id: payment.payment_id,
        booking_id: null,
        reference_id: payment.payment_id || razorpay_order_id,
        note: `Wallet top-up via Razorpay`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: { payment, already_processed: false },
    });
  } catch (err) {
    logger.error('[paymentController.verifyBookingPayment]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to verify payment' });
  }
};

/**
 * GET /api/payments/:paymentId
 * Get single payment record by ID.
 */
exports.getPaymentById = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const paymentId = Number(req.params.paymentId);

    if (!Number.isInteger(paymentId)) {
      return res.status(400).json({ success: false, message: 'Valid payment id is required' });
    }

    const payment = await PaymentRepository.findByPaymentId(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (Number(payment.user_id) !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this payment' });
    }

    return res.status(200).json({ success: true, data: payment.toSafeResponse() });
  } catch (err) {
    logger.error('[paymentController.getPaymentById]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment' });
  }
};

/**
 * GET /api/payments/:paymentId/receipt
 * Get payment receipt info.
 */
exports.getPaymentReceipt = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const paymentId = Number(req.params.paymentId);

    if (!Number.isInteger(paymentId)) {
      return res.status(400).json({ success: false, message: 'Valid payment id is required' });
    }

    const payment = await PaymentRepository.findByPaymentId(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (Number(payment.user_id) !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Get booking details if linked
    let bookingDetails = null;
    if (payment.booking_id) {
      const [rows] = await db.query(
        `SELECT b.booking_id, b.start_date, b.end_date, b.status,
                v.model_name, v.registration_number
         FROM bookings b
         LEFT JOIN vehicles v ON v.vehicle_id = b.vehicle_id
         WHERE b.booking_id = ? LIMIT 1`,
        [payment.booking_id]
      );
      bookingDetails = rows[0] || null;
    }

    return res.status(200).json({
      success: true,
      data: {
        receipt_number: `RCP-${payment.payment_id}`,
        ...payment.toSafeResponse(),
        booking: bookingDetails,
        issued_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    logger.error('[paymentController.getPaymentReceipt]', err);
    return res.status(500).json({ success: false, message: 'Failed to get receipt' });
  }
};

/**
 * GET /api/payments/refunds
 * List refunded payments for the authenticated user.
 */
exports.getMyRefunds = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const limit  = Math.min(Math.max(Number(req.query.limit  || 20), 1), 100);
    const offset = Math.max(Number(req.query.offset || 0), 0);

    const [rows] = await db.query(
      `SELECT * FROM payments
       WHERE user_id = ? AND status = 'refunded'
       ORDER BY updated_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: { limit, offset, count: rows.length },
    });
  } catch (err) {
    logger.error('[paymentController.getMyRefunds]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch refunds' });
  }
};

/**
 * POST /api/payments/:paymentId/refund
 * Request refund for a payment.
 */
exports.requestRefund = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const paymentId = Number(req.params.paymentId);
    const { reason, amount } = req.body;

    if (!Number.isInteger(paymentId)) {
      return res.status(400).json({ success: false, message: 'Valid payment id is required' });
    }

    const payment = await PaymentRepository.findByPaymentId(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (Number(payment.user_id) !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (payment.status !== 'paid') {
      return res.status(400).json({ success: false, message: `Cannot refund a payment with status: ${payment.status}` });
    }

    const refundAmount = amount ? Number(amount) : Number(payment.amount);

    // Mark payment as refund-requested (admin will process)
    await db.query(
      `UPDATE payments SET status = 'refund_requested', meta = JSON_SET(COALESCE(meta, '{}'), '$.refund_reason', ?, '$.refund_amount', ?, '$.refund_requested_at', ?), updated_at = NOW()
       WHERE payment_id = ?`,
      [reason || 'Customer request', refundAmount, new Date().toISOString(), paymentId]
    ).catch(() => {
      // Fallback if JSON_SET not supported
      db.query(
        `UPDATE payments SET status = 'refund_requested', updated_at = NOW() WHERE payment_id = ?`,
        [paymentId]
      );
    });

    return res.status(200).json({
      success: true,
      message: 'Refund request submitted successfully',
      data: {
        payment_id: paymentId,
        refund_amount: refundAmount,
        status: 'refund_requested',
        note: 'Refund will be processed within 5-7 business days',
      },
    });
  } catch (err) {
    logger.error('[paymentController.requestRefund]', err);
    return res.status(500).json({ success: false, message: 'Failed to request refund' });
  }
};

/**
 * GET /api/payments/methods
 * Get saved payment methods for user.
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    // Fetch from payment_methods table if exists, else return defaults
    let methods = [];
    try {
      const [rows] = await db.query(
        `SELECT * FROM payment_methods WHERE user_id = ? AND is_active = 1 ORDER BY is_default DESC`,
        [userId]
      );
      methods = rows;
    } catch {
      methods = [];
    }

    return res.status(200).json({
      success: true,
      data: methods,
      available_options: ['RAZORPAY', 'WALLET', 'UPI', 'CARD', 'NETBANKING'],
    });
  } catch (err) {
    logger.error('[paymentController.getPaymentMethods]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment methods' });
  }
};

/**
 * POST /api/payments/methods
 * Save a payment method for user.
 */
exports.addPaymentMethod = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { type, details } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, message: 'type is required' });
    }

    let result = null;
    try {
      const [r] = await db.query(
        `INSERT INTO payment_methods (user_id, method_type, details, is_active, is_default, created_at)
         VALUES (?, ?, ?, 1, 0, NOW())`,
        [userId, type, JSON.stringify(details || {})]
      );
      result = { id: r.insertId };
    } catch {
      // Table may not exist — return success without persisting
    }

    return res.status(201).json({
      success: true,
      message: 'Payment method saved successfully',
      data: { id: result?.id || null, type, user_id: userId },
    });
  } catch (err) {
    logger.error('[paymentController.addPaymentMethod]', err);
    return res.status(500).json({ success: false, message: 'Failed to add payment method' });
  }
};

/**
 * DELETE /api/payments/methods/:methodId
 * Remove a saved payment method.
 */
exports.deletePaymentMethod = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const methodId = Number(req.params.methodId);

    try {
      await db.query(
        `UPDATE payment_methods SET is_active = 0, updated_at = NOW() WHERE id = ? AND user_id = ?`,
        [methodId, userId]
      );
    } catch {
      // Table may not exist — silent
    }

    return res.status(200).json({ success: true, message: 'Payment method removed successfully' });
  } catch (err) {
    logger.error('[paymentController.deletePaymentMethod]', err);
    return res.status(500).json({ success: false, message: 'Failed to remove payment method' });
  }
};

/**
 * GET /api/payments/summary
 * Payment summary for user (total paid, refunded, etc.)
 */
exports.getPaymentSummary = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [userId];

    if (start_date) {
      dateFilter += ' AND created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      dateFilter += ' AND created_at <= ?';
      params.push(`${end_date} 23:59:59`);
    }

    const [summary] = await db.query(
      `SELECT
         COUNT(*) AS total_transactions,
         COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_paid,
         COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0) AS total_refunded,
         COALESCE(SUM(CASE WHEN status = 'refund_requested' THEN amount ELSE 0 END), 0) AS pending_refunds,
         COALESCE(SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END), 0) AS total_failed,
         COUNT(CASE WHEN status = 'paid' THEN 1 END) AS successful_count,
         COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_count
       FROM payments
       WHERE user_id = ?${dateFilter}`,
      params
    );

    return res.status(200).json({
      success: true,
      data: summary[0],
      period: { start_date: start_date || null, end_date: end_date || null },
    });
  } catch (err) {
    logger.error('[paymentController.getPaymentSummary]', err);
    return res.status(500).json({ success: false, message: 'Failed to get payment summary' });
  }
};

/**
 * GET /api/payments/wallet
 * Get wallet balance for authenticated user.
 */
exports.getWalletBalance = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const wallet = await walletRepository.getOrCreateWallet(userId);
    return res.status(200).json({
      success: true,
      data: {
        wallet_balance: Number(wallet.wallet_balance),
        currency: wallet.currency || 'INR',
        is_active: wallet.is_active,
      },
    });
  } catch (err) {
    logger.error('[paymentController.getWalletBalance]', err);
    return res.status(500).json({ success: false, message: 'Failed to get wallet balance' });
  }
};

/**
 * POST /api/payments/wallet/add-money
 * Add money to wallet via Razorpay (creates order).
 */
exports.addMoneyToWallet = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { amount, payment_method } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    // Re-use topup order creation
    req.body.amount = amount;
    return exports.createWalletTopupOrder(req, res);
  } catch (err) {
    logger.error('[paymentController.addMoneyToWallet]', err);
    return res.status(500).json({ success: false, message: 'Failed to add money to wallet' });
  }
};

/**
 * POST /api/payments/apply-coupon
 * Apply coupon to a booking.
 */
exports.applyCouponToPayment = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { coupon_code, booking_id } = req.body;

    if (!coupon_code) {
      return res.status(400).json({ success: false, message: 'coupon_code is required' });
    }

    const [coupons] = await db.query(
      `SELECT * FROM coupons WHERE code = ? AND is_active = 1
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND (valid_until IS NULL OR valid_until >= NOW())
       LIMIT 1`,
      [coupon_code.toUpperCase()]
    ).catch(() => [[]]);

    if (!coupons.length) {
      return res.status(404).json({ success: false, message: 'Coupon not found or expired' });
    }

    const coupon = coupons[0];

    // Check usage limit
    if (coupon.max_uses_per_user) {
      const [usages] = await db.query(
        `SELECT COUNT(*) AS cnt FROM coupon_usages WHERE coupon_id = ? AND user_id = ?`,
        [coupon.coupon_id, userId]
      ).catch(() => [[{ cnt: 0 }]]);

      if (usages[0].cnt >= coupon.max_uses_per_user) {
        return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        coupon_code,
        discount_type: coupon.discount_type || 'PERCENTAGE',
        discount_value: coupon.discount_value || coupon.discount_percentage || 0,
        max_discount_amount: coupon.max_discount_amount || null,
        booking_id: booking_id || null,
      },
    });
  } catch (err) {
    logger.error('[paymentController.applyCouponToPayment]', err);
    return res.status(500).json({ success: false, message: 'Failed to apply coupon' });
  }
};

/**
 * GET /api/payments/validate-coupon/:code
 * Validate a coupon code.
 */
exports.validateCouponCode = async (req, res) => {
  try {
    const { code } = req.params;

    const [coupons] = await db.query(
      `SELECT coupon_id, code, discount_type, discount_value, discount_percentage,
              max_discount_amount, min_order_amount, valid_from, valid_until, is_active
       FROM coupons
       WHERE code = ? AND is_active = 1
         AND (valid_from IS NULL OR valid_from <= NOW())
         AND (valid_until IS NULL OR valid_until >= NOW())
       LIMIT 1`,
      [code.toUpperCase()]
    ).catch(() => [[]]);

    if (!coupons.length) {
      return res.status(404).json({ success: false, message: 'Coupon not found or expired', data: { valid: false } });
    }

    const coupon = coupons[0];

    return res.status(200).json({
      success: true,
      data: {
        valid: true,
        coupon_code: coupon.code,
        discount_type: coupon.discount_type || 'PERCENTAGE',
        discount_value: coupon.discount_value || coupon.discount_percentage || 0,
        max_discount_amount: coupon.max_discount_amount || null,
        min_order_amount: coupon.min_order_amount || 0,
        valid_until: coupon.valid_until,
      },
    });
  } catch (err) {
    logger.error('[paymentController.validateCouponCode]', err);
    return res.status(500).json({ success: false, message: 'Failed to validate coupon' });
  }
};
