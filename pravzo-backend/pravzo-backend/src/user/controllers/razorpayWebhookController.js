const logger = require("../../../src/utils/logger");
const crypto = require("crypto");
const db = require("../../../src/config/db");
const walletRepository = require("../repositories/walletRepository");

function timingSafeEqualHex(a, b) {
  if (!a || !b) return false;

  const aBuf = Buffer.from(String(a), "utf8");
  const bBuf = Buffer.from(String(b), "utf8");

  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function verifyWebhookSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return timingSafeEqualHex(expected, signature);
}

exports.handleRazorpayWebhook = async (req, res) => {
  logger.debug("\n==============================");
  logger.debug("🔥 RazorpayX Webhook Hit");
  logger.debug("==============================");
  const signature = req.headers["x-razorpay-signature"];
  const eventId = req.headers["x-razorpay-event-id"];
  const secret = process.env.RAZORPAYX_WEBHOOK_SECRET;

  let connection = null;

  try {
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Webhook secret is not configured",
      });
    }
    logger.debug("RawBody Exists :", !!req.rawBody);
    if (!req.rawBody) {
      return res.status(400).json({
        success: false,
        message: "Raw body not available for webhook verification",
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Missing webhook signature",
      });
    }

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Missing webhook event id",
      });
    }

    if (!verifyWebhookSignature(req.rawBody, signature, secret)) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }
    logger.debug("✅ Signature Verified");
    logger.debug("Webhook Event :", req.body.event);
    logger.debug("Webhook Payload :", req.body);
    const payload = req.body;
    const event = payload?.event;

    if (!event) {
      return res.status(400).json({
        success: false,
        message: "Missing webhook event type",
      });
    }

    try {
      await db.query(
        `INSERT INTO webhook_events (event_id, event_type, payload)
         VALUES (?, ?, ?)`,
        [eventId, event, JSON.stringify(payload)],
      );
    } catch (insertErr) {
      if (insertErr.code === "ER_DUP_ENTRY") {
        return res.status(200).json({
          success: true,
          message: "Duplicate webhook ignored",
        });
      }
      throw insertErr;
    }

    if (!event.startsWith("payout.")) {
      return res.status(200).json({
        success: true,
        message: "Webhook received",
      });
    }

    const payoutEntity = payload.payload?.payout?.entity;

    if (!payoutEntity) {
      return res.status(200).json({
        success: true,
        message: "No payout entity found",
      });
    }

    const providerPayoutId = payoutEntity.id || null;
    const providerStatus = payoutEntity.status || null;
    const referenceId = payoutEntity.reference_id || null;
    const failureReason =
      payoutEntity.status_details?.description ||
      payoutEntity.failure_reason ||
      null;

    if (!providerPayoutId && !referenceId) {
      return res.status(200).json({
        success: true,
        message: "Payout identifier missing",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT payout_id, user_id, amount, status, reference_id
       FROM payouts
       WHERE razorpayx_payout_id = ? OR reference_id = ?
       LIMIT 1
       FOR UPDATE`,
      [providerPayoutId, referenceId],
    );

    if (!rows.length) {
      await connection.commit();
      connection.release();
      connection = null;

      return res.status(200).json({
        success: true,
        message: "Payout not mapped locally",
      });
    }

    const localPayout = rows[0];
    logger.debug("✅ Local Payout Found");
    logger.debug(localPayout);
    const currentStatus = localPayout.status;
    logger.debug("Current DB Status :", currentStatus);
    if (["processed", "failed", "cancelled"].includes(currentStatus)) {
      await connection.commit();
      connection.release();
      connection = null;

      return res.status(200).json({
        success: true,
        message: "Terminal payout already handled",
      });
    }

    await connection.query(
      `UPDATE payouts
       SET
         status = COALESCE(?, status),
         failure_reason = ?,
         notes = JSON_SET(
           COALESCE(notes, JSON_OBJECT()),
           '$.webhook_event', ?,
           '$.provider_status', ?,
           '$.provider_payout_id', ?,
           '$.last_event_id', ?
         )
       WHERE payout_id = ?`,
      [
        providerStatus,
        failureReason,
        event,
        providerStatus,
        providerPayoutId,
        eventId,
        localPayout.payout_id,
      ],
    );
    logger.debug("Payout table updated");
    logger.debug("Provider Status :", providerStatus);
    logger.debug("Entering processed block...");

    if (providerStatus === "processed") {
      logger.debug("✅ Payout Processed");
      await walletRepository.markTransactionStatusByReference(
        localPayout.reference_id,
        "success",
        {
          webhook_event: event,
          provider_status: providerStatus,
          provider_payout_id: providerPayoutId,
          event_id: eventId,
        },
        connection,
      );
    } else if (providerStatus === "reversed" || event === "payout.reversed") {
      logger.debug("↩️ Payout Reversed");
      await walletRepository.markTransactionStatusByReference(
        localPayout.reference_id,
        "failed",
        {
          webhook_event: event,
          provider_status: providerStatus,
          provider_payout_id: providerPayoutId,
          failure_reason: failureReason,
          event_id: eventId,
        },
        connection,
      );

      await walletRepository.creditMoney(
        {
          user_id: localPayout.user_id,
          amount: Number(localPayout.amount),
          source: "cashout_refund",
          payment_id: null,
          booking_id: null,
          payout_id: localPayout.payout_id,
          reference_id: `${localPayout.reference_id}_reversal_refund`,
          note: "Wallet refunded due to payout reversal",
          status: "success",
          meta: {
            webhook_event: event,
            provider_status: providerStatus,
            provider_payout_id: providerPayoutId,
            event_id: eventId,
          },
        },
        connection,
      );
    } else if (
      ["pending", "queued", "processing", "initiated"].includes(providerStatus)
    ) {
      logger.debug("⏳ Payout Pending");
      await walletRepository.markTransactionStatusByReference(
        localPayout.reference_id,
        "pending",
        {
          webhook_event: event,
          provider_status: providerStatus,
          provider_payout_id: providerPayoutId,
          event_id: eventId,
        },
        connection,
      );
    } else if (["failed", "cancelled"].includes(providerStatus)) {
      logger.debug("❌ Payout Failed");
      await walletRepository.markTransactionStatusByReference(
        localPayout.reference_id,
        "failed",
        {
          webhook_event: event,
          provider_status: providerStatus,
          provider_payout_id: providerPayoutId,
          failure_reason: failureReason,
          event_id: eventId,
        },
        connection,
      );

      await walletRepository.creditMoney(
        {
          user_id: localPayout.user_id,
          amount: Number(localPayout.amount),
          source: "cashout_refund",
          payment_id: null,
          booking_id: null,
          payout_id: localPayout.payout_id,
          reference_id: `${localPayout.reference_id}_failed_refund`,
          note: "Wallet refunded due to payout failure",
          status: "success",
          meta: {
            webhook_event: event,
            provider_status: providerStatus,
            provider_payout_id: providerPayoutId,
            event_id: eventId,
          },
        },
        connection,
      );
    }

    await connection.commit();
    connection.release();
    connection = null;

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
        connection.release();
      } catch (rollbackError) {
        logger.error("Webhook rollback error:", rollbackError);
      }
    }

    logger.error("========== WEBHOOK ERROR ==========");

    logger.error(error.response?.data || error);

    logger.error("==================================");
    logger.debug("🎉 Webhook Completed Successfully");
    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};
