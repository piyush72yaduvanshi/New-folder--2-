/**
 * otpService.js
 *
 * Handles OTP lifecycle entirely in MySQL (otp_logs table).
 * Redis is NOT required — works even when USE_REDIS=false.
 *
 * Flow:
 *   1. generateAndSend(mobile, purpose)
 *        → invalidates old OTPs for same mobile+purpose
 *        → inserts a new 6-digit OTP (expires in OTP_EXPIRY_MINUTES)
 *        → sends via smsService
 *
 *   2. verifyOtp(mobile, code, purpose)
 *        → finds the latest unused, non-expired OTP
 *        → increments attempt counter (max MAX_ATTEMPTS)
 *        → marks as used on success
 *        → returns { valid: true/false, reason? }
 */

const crypto = require("crypto");
const db = require("../../../src/config/db");
const smsService = require("./smsService");

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
const MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;
const OTP_RESEND_COOLDOWN_SECONDS =
  Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60;

// ─── helpers ────────────────────────────────────────────────

function generateOtpCode() {
  // Cryptographically random 6-digit number
  const num = crypto.randomInt(100000, 999999);
  return String(num);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// Let mysql2 handle Date objects directly — it uses the DB server's timezone
// (which is IST here based on NOW()). Avoid manual UTC string conversion.

// ─── generateAndSend ────────────────────────────────────────

/**
 * Creates a new OTP for `mobile` with `purpose` and fires SMS.
 *
 * @param {string} mobile   - 10-digit Indian mobile number
 * @param {string} purpose  - one of: login | register | forgot_password | change_mobile | change_email
 * @returns {{ success: true, expiresAt: Date }}
 * @throws  Error on DB failure or SMS failure
 */
async function generateAndSend(mobile, purpose) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Rate-limit: check if a valid OTP was sent recently (cooldown)
    const [recentRows] = await connection.query(
      `SELECT created_at FROM otp_logs
       WHERE identifier = ? AND purpose = ? AND is_used = 0
         AND expires_at > NOW()
       ORDER BY otp_id DESC
       LIMIT 1`,
      [mobile, purpose],
    );

    // In test mode, skip the per-OTP cooldown so tests can request OTPs in rapid succession
    // without triggering the application-level 60-second window.
    if (recentRows.length && process.env.NODE_ENV !== 'test') {
      const sentAt = new Date(recentRows[0].created_at);
      const secondsSinceSent = (Date.now() - sentAt.getTime()) / 1000;

      if (secondsSinceSent < OTP_RESEND_COOLDOWN_SECONDS) {
        const waitSecs = Math.ceil(
          OTP_RESEND_COOLDOWN_SECONDS - secondsSinceSent,
        );
        const err = new Error(
          `Please wait ${waitSecs} seconds before requesting a new OTP.`,
        );
        err.statusCode = 429;
        throw err;
      }
    }

    // Invalidate all previous OTPs for this mobile + purpose
    await connection.query(
      `UPDATE otp_logs
       SET is_used = 1
       WHERE identifier = ? AND purpose = ? AND is_used = 0`,
      [mobile, purpose],
    );

    const otpCode = generateOtpCode();
    const now = new Date();
    const expiresAt = addMinutes(now, OTP_EXPIRY_MINUTES);

    await connection.query(
      `INSERT INTO otp_logs (identifier, otp_code, purpose, expires_at, created_at)
   VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), NOW())`,
      [mobile, otpCode, purpose, OTP_EXPIRY_MINUTES],
    );

    await connection.commit();

    // Send SMS (outside transaction — if SMS fails, OTP is still stored)
    await smsService.sendOtp(mobile, otpCode, purpose);

    return { success: true, expiresAt };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// ─── verifyOtp ──────────────────────────────────────────────

/**
 * Verifies OTP entered by user.
 *
 * @param {string} mobile
 * @param {string} code    - 6-digit string entered by user
 * @param {string} purpose
 * @returns {{ valid: boolean, reason?: string }}
 */
async function verifyOtp(mobile, code, purpose) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Find the latest valid OTP row (lock for update to prevent race conditions)
    const [rows] = await connection.query(
      `SELECT otp_id, otp_code, attempts, is_used, expires_at
   FROM otp_logs
   WHERE identifier = ? AND purpose = ? AND is_used = 0 AND expires_at > NOW()
   ORDER BY otp_id DESC
   LIMIT 1
   FOR UPDATE`,
      [mobile, purpose],
    );

    if (!rows.length) {
      await connection.rollback();
      return {
        valid: false,
        reason: "No active OTP found. Please request a new one.",
      };
    }

    const row = rows[0];

    // Check expiry
    if (new Date(row.expires_at) < new Date()) {
      await connection.query(
        `UPDATE otp_logs SET is_used = 1 WHERE otp_id = ?`,
        [row.otp_id],
      );
      await connection.commit();
      return {
        valid: false,
        reason: "OTP has expired. Please request a new one.",
      };
    }

    // Check attempt limit
    if (row.attempts >= MAX_ATTEMPTS) {
      await connection.query(
        `UPDATE otp_logs SET is_used = 1 WHERE otp_id = ?`,
        [row.otp_id],
      );
      await connection.commit();
      return {
        valid: false,
        reason: "Too many incorrect attempts. Please request a new OTP.",
      };
    }

    // Compare using timing-safe comparison
    const inputBuf = Buffer.from(String(code).trim(), "utf8");
    const storedBuf = Buffer.from(String(row.otp_code), "utf8");
    const isMatch =
      inputBuf.length === storedBuf.length &&
      crypto.timingSafeEqual(inputBuf, storedBuf);

    if (!isMatch) {
      // Increment attempt count
      await connection.query(
        `UPDATE otp_logs SET attempts = attempts + 1 WHERE otp_id = ?`,
        [row.otp_id],
      );
      await connection.commit();

      const remaining = MAX_ATTEMPTS - (row.attempts + 1);
      return {
        valid: false,
        reason:
          remaining > 0
            ? `Incorrect OTP. ${remaining} attempt(s) remaining.`
            : "Too many incorrect attempts. Please request a new OTP.",
      };
    }

    // Mark as used on success
    await connection.query(
      `UPDATE otp_logs SET is_used = 1, attempts = attempts + 1 WHERE otp_id = ?`,
      [row.otp_id],
    );

    await connection.commit();
    return { valid: true };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { generateAndSend, verifyOtp };
