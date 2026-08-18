const logger = require("../../../src/utils/logger");
const db = require("../../../src/config/db");
const walletRepository = require("../repositories/walletRepository");
const UserRepository = require("../repositories/UserRepository");
const razorpayxService =
  process.env.USE_MOCK_RAZORPAYX === "true"
    ? require("../services/mockRazorpayxService")
    : require("../services/razorpayxService");

exports.getMyWallet = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const wallet = await walletRepository.getOrCreateWallet(userId);

    return res.status(200).json({
      success: true,
      message: "Wallet fetched successfully",
      data: wallet,
    });
  } catch (error) {
    logger.error("Get Wallet Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch wallet",
    });
  }
};

exports.getMyWalletTransactions = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const transactions = await walletRepository.getWalletTransactions(userId);

    return res.status(200).json({
      success: true,
      message: "Wallet transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    logger.error("Get Wallet Transactions Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch wallet transactions",
    });
  }
};

exports.addMoney = async (req, res) => {
  try {
    const targetUserId = Number(req.body.user_id);
    const amountToAdd = Number(req.body.amount);

    if (process.env.TEST_MODE !== "true") {
      return res.status(403).json({
        success: false,
        message: "Manual topup is disabled",
      });
    }

    if (!Number.isInteger(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user id is required",
      });
    }

    if (!Number.isFinite(amountToAdd) || amountToAdd <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    const referenceId = `admin_topup_${targetUserId}_${Date.now()}`;

    const closingBalance = await walletRepository.creditMoney({
      user_id: targetUserId,
      amount: amountToAdd,
      source: "admin_topup",
      payment_id: null,
      booking_id: null,
      payout_id: null,
      reference_id: referenceId,
      note: `Manual wallet topup by admin ${req.user.id}`,
      status: "success",
    });

    return res.status(200).json({
      success: true,
      message: "Money added successfully",
      data: {
        user_id: targetUserId,
        wallet_balance: closingBalance,
        reference_id: referenceId,
      },
    });
  } catch (error) {
    logger.error("Add Money Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add money",
    });
  }
};

exports.instantCashout = async (req, res) => {
  let payoutId = null;
  let referenceId = null;
  let connection = null;

  try {
    const userId = Number(req.user.id);
    const requestedAmount = Number(req.body.amount);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    const user = await UserRepository.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "User account is not active",
      });
    }

    const hasUpi = !!user.upi_id;
    const hasBank = !!(
      user.bank_account_number &&
      user.ifsc_code &&
      user.account_holder_name
    );

    if (!hasUpi && !hasBank) {
      return res.status(400).json({
        success: false,
        message: "No payout method found. Add bank account or UPI first.",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [existingOpenPayouts] = await connection.query(
      `SELECT payout_id, status
       FROM payouts
       WHERE user_id = ?
         AND status IN ('pending', 'queued', 'processing', 'initiated')
       ORDER BY payout_id DESC
       LIMIT 1`,
      [userId],
    );

    if (existingOpenPayouts.length) {
      await connection.rollback();
      connection.release();
      connection = null;

      return res.status(409).json({
        success: false,
        message: "A payout request is already in progress",
      });
    }

    referenceId = `cashout_${userId}_${Date.now()}`;
    const payoutMethod = hasUpi ? "UPI" : "IMPS";
    const payoutMode = hasUpi ? "UPI" : "IMPS";
    const idempotencyKey = razorpayxService.generateIdempotencyKey(referenceId);

    const closingBalance = await walletRepository.deductMoney(
      {
        user_id: userId,
        amount: requestedAmount,
        source: "instant_cashout",
        payment_id: null,
        booking_id: null,
        payout_id: null,
        reference_id: referenceId,
        note: `Wallet cashout initiated (${payoutMethod})`,
        status: "pending",
      },
      connection,
    );

    const [insertResult] = await connection.query(
      `INSERT INTO payouts
       (
         user_id,
         amount,
         currency,
         method,
         status,
         idempotency_key,
         reference_id,
         notes
       )
       VALUES (?, ?, 'INR', ?, 'pending', ?, ?, ?)`,
      [
        userId,
        requestedAmount,
        payoutMethod,
        idempotencyKey,
        referenceId,
        JSON.stringify({
          source: "app_cashout",
          requested_by: userId,
          payout_method: payoutMethod,
        }),
      ],
    );

    payoutId = insertResult.insertId;

    // Payout is linked to wallet transaction via reference_id

    await connection.commit();
    connection.release();
    connection = null;

    const contact = await razorpayxService.createContact({
      name: user.account_holder_name || user.full_name,
      email: user.email || undefined,
      contact: user.phone_number,
      reference_id: `user_${userId}`,
      type: "vendor",
      notes: {
        user_id: String(userId),
        payout_id: String(payoutId),
      },
    });

    const fundAccount = hasUpi
      ? await razorpayxService.createVpaFundAccount({
          contact_id: contact.id,
          upi_id: user.upi_id,
        })
      : await razorpayxService.createBankFundAccount({
          contact_id: contact.id,
          account_holder_name: user.account_holder_name || user.full_name,
          ifsc: user.ifsc_code,
          account_number: user.bank_account_number,
        });

    const payout = await razorpayxService.createPayout({
      fund_account_id: fundAccount.id,
      amount: Math.round(requestedAmount * 100),
      mode: payoutMode,
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: referenceId,
      narration: `Cashout ${userId}`.slice(0, 30),
      notes: {
        user_id: String(userId),
        payout_id: String(payoutId),
      },
      idempotency_key: idempotencyKey,
    });

    await db.query(
      `UPDATE payouts
       SET
         status = ?,
         razorpayx_contact_id = ?,
         razorpayx_fund_account_id = ?,
         razorpayx_payout_id = ?,
         notes = JSON_SET(
           COALESCE(notes, JSON_OBJECT()),
           '$.provider_status', ?,
           '$.provider_reference_id', ?,
           '$.contact_id', ?,
           '$.fund_account_id', ?
         )
       WHERE payout_id = ?`,
      [
        payout.status || "processing",
        contact.id,
        fundAccount.id,
        payout.id,
        payout.status || "processing",
        referenceId,
        contact.id,
        fundAccount.id,
        payoutId,
      ],
    );
    if (process.env.USE_MOCK_RAZORPAYX === "true") {
      const triggerMockWebhook = require("../../../src/utils/mockWebhook");
    }

    logger.debug("Payout returned from service:");
    logger.debug(payout);
    logger.debug("Payout Status =", payout.status);
    await walletRepository.markTransactionStatusByReference(
      referenceId,
      payout.status === "processed" ? "success" : "pending",
      { provider_status: payout.status || "processing" },
    );

    return res.status(200).json({
      success: true,
      message: "Cashout initiated successfully",
      data: {
        payout_id: payoutId,
        provider_payout_id: payout.id,
        status: payout.status || "processing",
        amount: requestedAmount,
        method: payoutMethod,
        reference_id: referenceId,
        remaining_wallet_balance: closingBalance,
      },
    });
  } catch (error) {
    logger.error(
      "[walletController.instantCashout]",
      error?.response?.data || error.message || error,
    );

    if (connection) {
      try {
        await connection.rollback();
        connection.release();
        connection = null;
      } catch (rollbackError) {
        logger.error("Cashout rollback error:", rollbackError);
      }
    }

    if (payoutId && referenceId) {
      try {
        const failureReason =
          error?.response?.data?.error?.description ||
          error.message ||
          "Failed to initiate payout";

        const rollbackConnection = await db.getConnection();
        await rollbackConnection.beginTransaction();

        const [rows] = await rollbackConnection.query(
          `SELECT user_id, amount, reference_id, status
           FROM payouts
           WHERE payout_id = ?
           LIMIT 1
           FOR UPDATE`,
          [payoutId],
        );

        const localPayout = rows[0];

        if (localPayout) {
          await rollbackConnection.query(
            `UPDATE payouts
             SET
               status = 'failed',
               failure_reason = ?,
               notes = JSON_SET(
                 COALESCE(notes, JSON_OBJECT()),
                 '$.failure_stage', 'initiation'
               )
             WHERE payout_id = ?`,
            [failureReason, payoutId],
          );

          if (
            ["pending", "initiated", "queued", "processing"].includes(
              localPayout.status,
            )
          ) {
            await walletRepository.creditMoney(
              {
                user_id: localPayout.user_id,
                amount: Number(localPayout.amount),
                source: "cashout_refund",
                payment_id: null,
                booking_id: null,
                payout_id: payoutId,
                reference_id: `${localPayout.reference_id}_refund`,
                note: "Wallet refunded due to payout initiation failure",
                status: "success",
              },
              rollbackConnection,
            );

            await walletRepository.markTransactionStatusByReference(
              localPayout.reference_id,
              "failed",
              { failure_reason: failureReason },
              rollbackConnection,
            );
          }
        }

        await rollbackConnection.commit();
        rollbackConnection.release();
      } catch (updateErr) {
        logger.error(
          "[walletController.instantCashout] failed to rollback payout state:",
          updateErr,
        );
      }
    }

    return res.status(500).json({
      success: false,
      message:
        error?.response?.data?.error?.description ||
        error.message ||
        "Failed to initiate cashout",
    });
  }
};
