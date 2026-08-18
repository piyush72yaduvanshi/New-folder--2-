const logger = require("../../../src/utils/logger");
const UserRepository = require("../repositories/UserRepository");
const otpService = require("../services/otpService");
const {
  getCache,
  setCache,
  deleteCache,
  deleteByPattern,
} = require("../services/cacheService");

// ─── helpers ────────────────────────────────────────────────

function formatMySQLDate(dateInput) {
  if (
    typeof dateInput === "string" &&
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateInput)
  ) {
    return dateInput;
  }
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 19).replace("T", " ");
  }
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 10) return digits;
  return null;
}

// ─── GET PROFILE ─────────────────────────────────────────────

exports.getMyProfile = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const cacheKey = `user_profile:${userId}`;
    const cachedProfile = await getCache(cacheKey);

    if (cachedProfile) {
      return res.status(200).json({
        success: true,
        data: cachedProfile,
        cached: true,
      });
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userResponse = user.toSelfProfileResponse();
    await setCache(cacheKey, userResponse, 600);

    return res.status(200).json({
      success: true,
      data: userResponse,
      cached: false,
    });
  } catch (error) {
    logger.error("Get My Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get profile",
    });
  }
};

// ─── UPDATE PROFILE ──────────────────────────────────────────

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const allowedFields = [
      "full_name",
      "email",
      "gender",
      "address",
      "profile_photo",
      "driving_license_photo",
      "driving_license_back_photo",
      "driving_license_number",
      "aadhar_card_photo",
      "aadhar_card_back_photo",
      "aadhar_number",
      "bank_account_number",
      "ifsc_code",
      "branch_name",
      "account_holder_name",
      "upi_id",
      "payout_schedule",
      "emergency_contact_name",
      "emergency_contact_number",
      "date_of_birth",
    ];

    const fields = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        fields[key] = req.body[key];
      }
    }

    if (req.body.date_of_birth !== undefined) {
      fields.date_of_birth = req.body.date_of_birth
        ? formatMySQLDate(req.body.date_of_birth).slice(0, 10)
        : null;
    }

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    fields.updated_at = formatMySQLDate();

    const success = await UserRepository.update(userId, fields);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedUser = await UserRepository.findById(userId);

    await deleteCache(`user_profile:${userId}`);
    await deleteByPattern(`user_dashboard:${userId}:*`);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser.toSelfProfileResponse(),
    });
  } catch (error) {
    logger.error("Update My Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

// ─── DELETE PROFILE ──────────────────────────────────────────

exports.deleteMyProfile = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const success = await UserRepository.delete(userId);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await deleteCache(`user_profile:${userId}`);
    await deleteCache(`user_wallet:${userId}`);
    await deleteByPattern(`user_dashboard:${userId}:*`);

    return res.status(200).json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    logger.error("Delete My Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete account",
    });
  }
};

// ─── GET BANK DETAILS ────────────────────────────────────────

exports.getMyBankDetails = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const user = await UserRepository.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user.toMaskedBankResponse(),
    });
  } catch (error) {
    logger.error("Get Bank Details Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get bank details",
    });
  }
};

// ─── UPDATE BANK DETAILS ─────────────────────────────────────

exports.updateMyBankDetails = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const fields = {};

    const allowedFields = [
      "bank_account_number",
      "ifsc_code",
      "branch_name",
      "account_holder_name",
      "upi_id",
      "payout_schedule",
    ];

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) fields[key] = req.body[key];
    }

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No bank fields to update",
      });
    }

    fields.updated_at = formatMySQLDate();

    const success = await UserRepository.update(userId, fields);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await deleteCache(`user_profile:${userId}`);

    return res.status(200).json({
      success: true,
      message: "Bank details updated successfully",
    });
  } catch (error) {
    logger.error("Update Bank Details Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update bank details",
    });
  }
};

// ─── UPDATE MOBILE — STEP 1: send OTP to NEW number ──────────
// POST /api/users/:id/mobile
// Body: { new_mobile }
// Sends OTP to the new number for verification

exports.updateMyMobile = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { new_mobile } = req.body;

    if (!new_mobile) {
      return res.status(400).json({
        success: false,
        message: "new_mobile is required",
      });
    }

    const phone = normalizePhone(new_mobile);
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number",
      });
    }

    // Make sure this number is not already taken by another user
    const existing = await UserRepository.findByPhone(phone);
    if (existing && Number(existing.user_id) !== userId) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already registered to another account",
      });
    }

    // If it's already the same number, nothing to do
    const currentUser = await UserRepository.findById(userId);
    const currentPhone = normalizePhone(currentUser.phone_number);
    if (currentPhone === phone) {
      return res.status(400).json({
        success: false,
        message: "New mobile number is the same as your current number",
      });
    }

    // Send OTP to the NEW number
    await otpService.generateAndSend(phone, "change_mobile");

    return res.status(200).json({
      success: true,
      message: "OTP sent to new mobile number for verification",
      ...(process.env.TEST_MODE === "true" && {
        _dev_note: "Check server console for OTP (TEST_MODE=true)",
      }),
    });
  } catch (error) {
    logger.error("Update Mobile Step-1 Error:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to send OTP",
    });
  }
};

// ─── UPDATE MOBILE — STEP 2: verify OTP and commit change ────
// PUT /api/users/:id/mobile/verify
// Body: { new_mobile, otp }

exports.verifyAndUpdateMobile = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { new_mobile, otp } = req.body;

    if (!new_mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "new_mobile and otp are required",
      });
    }

    const phone = normalizePhone(new_mobile);
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number",
      });
    }

    // Double-check it's not taken
    const existing = await UserRepository.findByPhone(phone);
    if (existing && Number(existing.user_id) !== userId) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already registered to another account",
      });
    }

    // Verify OTP
    const result = await otpService.verifyOtp(phone, otp, "change_mobile");
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.reason || "Invalid or expired OTP",
      });
    }

    // Commit the phone number change
    await UserRepository.update(userId, { phone_number: phone });

    await deleteCache(`user_profile:${userId}`);
    await deleteByPattern(`user_dashboard:${userId}:*`);

    return res.status(200).json({
      success: true,
      message: "Mobile number updated successfully",
    });
  } catch (error) {
    logger.error("Update Mobile Step-2 Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update mobile number",
    });
  }
};

// ─── UPDATE EMAIL — STEP 1: send OTP to NEW email ────────────
// POST /api/users/:id/email
// Body: { new_email }
// NOTE: Email OTP is sent to the new email address.
//       For now we reuse the sms OTP table with identifier = new_email.
//       When an email service is wired, swap smsService for emailService.

exports.updateMyEmail = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { new_email } = req.body;

    if (!new_email) {
      return res.status(400).json({
        success: false,
        message: "new_email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(new_email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    const normalizedEmail = new_email.trim().toLowerCase();

    // Check if already taken by someone else
    const existing = await UserRepository.findByEmail(normalizedEmail);
    if (existing && Number(existing.user_id) !== userId) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered to another account",
      });
    }

    const currentUser = await UserRepository.findById(userId);
    if (
      currentUser.email &&
      currentUser.email.toLowerCase() === normalizedEmail
    ) {
      return res.status(400).json({
        success: false,
        message: "New email is the same as your current email",
      });
    }

    // Use email as identifier in otp_logs (purpose = change_email)
    // smsService logs to console; swap with emailService when ready
    await otpService.generateAndSend(normalizedEmail, "change_email");

    return res.status(200).json({
      success: true,
      message: "OTP sent to new email address for verification",
      ...(process.env.TEST_MODE === "true" && {
        _dev_note: "Check server console for OTP (TEST_MODE=true)",
      }),
    });
  } catch (error) {
    logger.error("Update Email Step-1 Error:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to send OTP",
    });
  }
};

// ─── UPDATE EMAIL — STEP 2: verify OTP and commit change ─────
// PUT /api/users/:id/email/verify
// Body: { new_email, otp }

exports.verifyAndUpdateEmail = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { new_email, otp } = req.body;

    if (!new_email || !otp) {
      return res.status(400).json({
        success: false,
        message: "new_email and otp are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(new_email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    const normalizedEmail = new_email.trim().toLowerCase();

    // Double-check not taken
    const existing = await UserRepository.findByEmail(normalizedEmail);
    if (existing && Number(existing.user_id) !== userId) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered to another account",
      });
    }

    // Verify OTP (identifier = email for change_email purpose)
    const result = await otpService.verifyOtp(
      normalizedEmail,
      otp,
      "change_email"
    );
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.reason || "Invalid or expired OTP",
      });
    }

    // Commit
    await UserRepository.update(userId, { email: normalizedEmail });

    await deleteCache(`user_profile:${userId}`);
    await deleteByPattern(`user_dashboard:${userId}:*`);

    return res.status(200).json({
      success: true,
      message: "Email address updated successfully",
    });
  } catch (error) {
    logger.error("Update Email Step-2 Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update email address",
    });
  }
};

// ─── SUBMIT / GET KYC ──────────────────────────────────────────

exports.submitKyc = async (req, res) => {
  try {
    const userId = Number(req.params.id || req.user.id);
    const {
      driving_license_number,
      driving_license_photo,
      driving_license_back_photo,
      aadhar_number,
      aadhar_card_photo,
      aadhar_card_back_photo,
      date_of_birth,
      gender,
      address,
      city,
    } = req.body;

    const fields = {
      kyc_status: 'PENDING',
      ...(driving_license_number && { driving_license_number }),
      ...(driving_license_photo && { driving_license_photo }),
      ...(driving_license_back_photo && { driving_license_back_photo }),
      ...(aadhar_number && { aadhar_number }),
      ...(aadhar_card_photo && { aadhar_card_photo }),
      ...(aadhar_card_back_photo && { aadhar_card_back_photo }),
      ...(date_of_birth && { date_of_birth }),
      ...(gender && { gender }),
      ...(address && { address }),
      ...(city && { city }),
    };

    const success = await UserRepository.update(userId, fields);
    if (!success) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await deleteCache(`user_profile:${userId}`);
    const user = await UserRepository.findById(userId);

    return res.status(200).json({
      success: true,
      message: 'KYC submitted successfully and is under review',
      data: user.toKycResponse(),
    });
  } catch (error) {
    logger.error('Submit KYC Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit KYC',
    });
  }
};

exports.getMyKyc = async (req, res) => {
  try {
    const userId = Number(req.params.id || req.user.id);
    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: user.toKycResponse(),
    });
  } catch (error) {
    logger.error('Get KYC Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get KYC status',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED USER PROFILE ROUTES (documents, preferences, emergency-contacts, wallet)
// ─────────────────────────────────────────────────────────────────────────────
const db_ext = require("../../../src/config/db");
const walletRepo_ext = require("../repositories/walletRepository");

// ── DOCUMENTS ──────────────────────────────────────────────────────────────

exports.getUserDocuments = async (req, res) => {
  try {
    const userId = Number(req.params.id || req.user.id);
    const [rows] = await db_ext.query(
      `SELECT document_id, document_type, document_number,
              file_url, file_url_back, status, created_at, updated_at
       FROM user_documents WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    logger.error("Get User Documents Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to get documents" });
  }
};

exports.uploadUserDocument = async (req, res) => {
  try {
    const userId = Number(req.params.id || req.user.id);
    const { document_type, file_path, document_number, expiry_date, notes } = req.body;

    if (!document_type || !file_path) {
      return res.status(400).json({ success: false, message: "document_type and file_path are required" });
    }

    const ALLOWED_TYPES = ["DL", "AADHAR", "PAN", "PASSPORT", "VOTER_ID", "OTHER"];
    const docType = String(document_type).toUpperCase();
    if (!ALLOWED_TYPES.includes(docType)) {
      return res.status(400).json({ success: false, message: `document_type must be one of: ${ALLOWED_TYPES.join(", ")}` });
    }

    const [existing] = await db_ext.query(
      `SELECT document_id FROM user_documents WHERE user_id = ? AND document_type = ? LIMIT 1`,
      [userId, docType]
    );

    if (existing.length) {
      await db_ext.query(
        `UPDATE user_documents
         SET file_url = ?, document_number = COALESCE(?, document_number),
             status = 'PENDING', updated_at = NOW()
         WHERE document_id = ?`,
        [file_path, document_number || null, existing[0].document_id]
      );
      return res.status(200).json({
        success: true,
        message: "Document updated successfully",
        data: { document_id: existing[0].document_id, document_type: docType, status: "PENDING" },
      });
    }

    const [result] = await db_ext.query(
      `INSERT INTO user_documents
         (user_id, document_type, document_number, file_url, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'PENDING', NOW(), NOW())`,
      [userId, docType, document_number || null, file_path]
    );

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: { document_id: result.insertId, document_type: docType, status: "PENDING" },
    });
  } catch (error) {
    logger.error("Upload Document Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to upload document" });
  }
};

// ── PREFERENCES ────────────────────────────────────────────────────────────

exports.getPreferences = async (req, res) => {
  try {
    const userId = Number(req.params.id || req.user.id);
    let prefs = null;
    try {
      const [rows] = await db_ext.query(
        `SELECT * FROM user_preferences WHERE user_id = ? LIMIT 1`,
        [userId]
      );
      prefs = rows[0] || null;
    } catch {
      prefs = null;
    }

    return res.status(200).json({
      success: true,
      data: prefs || {
        user_id: userId,
        notifications_push: true,
        notifications_email: true,
        notifications_sms: true,
        language: "en",
        theme: "light",
      },
    });
  } catch (error) {
    logger.error("Get Preferences Error:", error);
    return res.status(500).json({ success: false, message: "Failed to get preferences" });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const userId = Number(req.params.id || req.user.id);
    const fields = req.body;

    if (!fields || !Object.keys(fields).length) {
      return res.status(400).json({ success: false, message: "No preferences to update" });
    }

    const ALLOWED = ["notifications_push", "notifications_email", "notifications_sms", "language", "theme", "currency"];
    const updateFields = {};
    for (const k of ALLOWED) {
      if (fields[k] !== undefined) updateFields[k] = fields[k];
    }

    try {
      const setClauses = Object.keys(updateFields).map(c => `${c} = ?`).join(", ");
      const vals = [...Object.values(updateFields), userId];
      await db_ext.query(
        `INSERT INTO user_preferences (user_id, ${Object.keys(updateFields).join(",")})
         VALUES (?, ${Object.keys(updateFields).map(() => "?").join(",")})
         ON DUPLICATE KEY UPDATE ${setClauses}, updated_at = NOW()`,
        [userId, ...Object.values(updateFields), ...vals]
      );
    } catch {
      // Table may not exist — silent
    }

    return res.status(200).json({ success: true, message: "Preferences updated successfully", data: { ...updateFields, user_id: userId } });
  } catch (error) {
    logger.error("Update Preferences Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update preferences" });
  }
};

// ── EMERGENCY CONTACTS ─────────────────────────────────────────────────────

exports.getEmergencyContacts = async (req, res) => {
  try {
    const userId = Number(req.params.id || req.user.id);
    let contacts = [];
    try {
      const [rows] = await db_ext.query(
        `SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY created_at ASC`,
        [userId]
      );
      contacts = rows;
    } catch {
      // Table may not exist — return from user_profiles
      const user = await UserRepository.findById(userId);
      if (user && user.emergency_contact_name) {
        contacts = [{
          id: 1,
          user_id: userId,
          name: user.emergency_contact_name,
          mobile: user.emergency_contact_number,
          relation: "Family",
        }];
      }
    }
    return res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    logger.error("Get Emergency Contacts Error:", error);
    return res.status(500).json({ success: false, message: "Failed to get emergency contacts" });
  }
};

exports.addEmergencyContact = async (req, res) => {
  try {
    const userId = Number(req.params.id || req.user.id);
    const { name, mobile, relation } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ success: false, message: "name and mobile are required" });
    }

    let contactId = null;
    try {
      const [result] = await db_ext.query(
        `INSERT INTO emergency_contacts (user_id, name, mobile, relation, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [userId, name, mobile, relation || "Other"]
      );
      contactId = result.insertId;
    } catch {
      // Fallback: save to user_profiles
      await UserRepository.update(userId, {
        emergency_contact_name: name,
        emergency_contact_number: mobile,
      });
      contactId = null;
    }

    return res.status(201).json({
      success: true,
      message: "Emergency contact added successfully",
      data: { id: contactId, name, mobile, relation: relation || "Other" },
    });
  } catch (error) {
    logger.error("Add Emergency Contact Error:", error);
    return res.status(500).json({ success: false, message: "Failed to add emergency contact" });
  }
};

exports.updateEmergencyContact = async (req, res) => {
  try {
    const userId = Number(req.params.id || req.user.id);
    const contactId = Number(req.params.contactId);
    const { name, mobile, relation } = req.body;

    try {
      await db_ext.query(
        `UPDATE emergency_contacts
         SET name = COALESCE(?, name), mobile = COALESCE(?, mobile),
             relation = COALESCE(?, relation), updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [name || null, mobile || null, relation || null, contactId, userId]
      );
    } catch {
      // Fallback
      if (name || mobile) {
        await UserRepository.update(userId, {
          ...(name && { emergency_contact_name: name }),
          ...(mobile && { emergency_contact_number: mobile }),
        });
      }
    }

    return res.status(200).json({ success: true, message: "Emergency contact updated" });
  } catch (error) {
    logger.error("Update Emergency Contact Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update emergency contact" });
  }
};

exports.deleteEmergencyContact = async (req, res) => {
  try {
    const userId = Number(req.params.id || req.user.id);
    const contactId = Number(req.params.contactId);

    try {
      await db_ext.query(
        `DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?`,
        [contactId, userId]
      );
    } catch {
      // Silent — table may not exist
    }

    return res.status(200).json({ success: true, message: "Emergency contact removed" });
  } catch (error) {
    logger.error("Delete Emergency Contact Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete emergency contact" });
  }
};

// ── WALLET (under /users/:id/wallet) ──────────────────────────────────────

exports.getUserWallet = async (req, res) => {
  try {
    const userId = Number(req.params.id || req.user.id);
    const wallet = await walletRepo_ext.getOrCreateWallet(userId);
    return res.status(200).json({
      success: true,
      data: {
        wallet_id: wallet.wallet_id,
        user_id: wallet.user_id,
        wallet_balance: Number(wallet.wallet_balance),
        currency: wallet.currency || "INR",
        is_active: wallet.is_active,
        updated_at: wallet.updated_at,
      },
    });
  } catch (error) {
    logger.error("Get User Wallet Error:", error);
    return res.status(500).json({ success: false, message: "Failed to get wallet" });
  }
};
