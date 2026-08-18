'use strict';

const db = require("../../../src/config/db");
const Payout = require("../models/Payout");

const ALLOWED_METHODS = ["bank_transfer", "upi", "manual"];
const ALLOWED_STATUSES = [
  "pending",
  "queued",
  "processing",
  "initiated",
  "completed",
  "failed",
  "reversed",
  "cancelled",
];

class PayoutRepository {
  async create(payload, executor = db) {
    const method = ALLOWED_METHODS.includes(payload.method)
      ? payload.method
      : "bank_transfer";

    const status = ALLOWED_STATUSES.includes(payload.status)
      ? payload.status
      : "pending";

    const accountHolderName = payload.account_holder_name || payload.beneficiary_name || null;
    const bankAccountNumber = payload.bank_account_number || payload.account_number || null;

    const [result] = await executor.query(
      `INSERT INTO payouts
      (
        user_id,
        wallet_transaction_id,
        amount,
        method,
        status,
        account_holder_name,
        bank_account_number,
        ifsc_code,
        branch_name,
        upi_id,
        reference_id,
        idempotency_key,
        remarks,
        currency,
        created_by,
        processed_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        payload.user_id,
        payload.wallet_transaction_id || null,
        payload.amount,
        method,
        status,
        accountHolderName,
        bankAccountNumber,
        payload.ifsc_code || null,
        payload.branch_name || null,
        payload.upi_id || null,
        payload.reference_id || null,
        payload.idempotency_key || null,
        payload.remarks || null,
        payload.currency || "INR",
        payload.created_by || null,
        payload.processed_at || null,
      ],
    );

    return this.findById(result.insertId, executor);
  }

  async findById(payoutId, executor = db) {
    const [rows] = await executor.query(
      `SELECT * FROM payouts WHERE payout_id = ? LIMIT 1`,
      [payoutId],
    );

    if (rows.length === 0) return null;
    return new Payout(rows[0]);
  }

  async findByReferenceId(referenceId, executor = db) {
    const [rows] = await executor.query(
      `SELECT * FROM payouts WHERE reference_id = ? LIMIT 1`,
      [referenceId],
    );

    if (rows.length === 0) return null;
    return new Payout(rows[0]);
  }

  async listByUserId(userId, executor = db) {
    const [rows] = await executor.query(
      `SELECT *
       FROM payouts
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId],
    );

    return rows.map((row) => new Payout(row));
  }

  async updateStatus(
    payoutId,
    { status, reference_id = null, remarks = null, processed_at = null },
    executor = db,
  ) {
    const safeStatus = ALLOWED_STATUSES.includes(status) ? status : "pending";

    const [result] = await executor.query(
      `UPDATE payouts
       SET status = ?,
           reference_id = COALESCE(?, reference_id),
           remarks = COALESCE(?, remarks),
           processed_at = COALESCE(?, processed_at),
           updated_at = NOW()
       WHERE payout_id = ?`,
      [safeStatus, reference_id, remarks, processed_at, payoutId],
    );

    if (!result.affectedRows) return null;
    return this.findById(payoutId, executor);
  }
}

module.exports = new PayoutRepository();
