'use strict';
const jwt = require("jsonwebtoken");
const UserRepository = require("../repositories/UserRepository");
const { hashPassword, verifyPassword } = require("../../../src/utils/password");
const otpService = require("../services/otpService");
const { deleteCache } = require("../services/cacheService");
const jwtConfig = require("../../../src/config/jwt");
const logger = require("../../../src/utils/logger");

// Use centralized jwt config — do NOT read process.env directly here
const JWT_SECRET    = jwtConfig.userSecret;
const JWT_EXPIRES_IN = jwtConfig.userExpiresIn;

// ─── helpers ──────────────────────────────────────────────────────────────────

function generateToken(user) {
  return jwt.sign({ id: user.user_id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

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

function normalizeRole(role) {
  if (!role) return "CUSTOMER";
  const r = String(role).trim().toUpperCase();
  const allowed = {
    USER: "CUSTOMER",
    CUSTOMER: "CUSTOMER",
    RENT_A_VEHICLE: "CUSTOMER",
    VEHICLE: "CUSTOMER",
    RIDER: "RIDER",
    VEHICLE_WITH_JOB: "RIDER",
    VEHICLEWITHJOB: "RIDER",
  };
  return allowed[r] || "CUSTOMER";
}

// Strip country code to get 10-digit number for OTP matching
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 10) return digits;
  return null;
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────

exports.register = async (req, res) => {
  try {
    const data = req.body;
    const phone = data.mobile_number || data.phone_number;

    if (!phone || !data.email || !data.password) {
      return res.status(400).json({
        success: false,
        message: "phone_number, email, and password are required",
      });
    }

    const role = normalizeRole(data.role);

    const existingUser = await UserRepository.findByPhone(phone);
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Phone number already registered" });
    }

    const hashedPassword = await hashPassword(data.password);
    // Map to final schema fields — UserRepository.create() handles normalization
    const userData = {
      full_name:    data.user_name || data.full_name || "",
      phone_number: phone,        // aliased to phone in create()
      email:        data.email,
      password:     hashedPassword,
      date_of_birth: data.date_of_birth ? data.date_of_birth.slice(0, 10) : null,
      gender:       data.gender || null,
      address:      data.address || null,
      role:         role,
      status:       "ACTIVE",
      kyc_status:   "NOT_SUBMITTED",
    };

    const userId = await UserRepository.create(userData);
    const user   = await UserRepository.findById(userId);
    const token  = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { token, user: user.toSafeResponse() },
    });
  } catch (error) {
    logger.error("Registration error", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: error.message || "Registration failed" });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  try {
    const { mobile_number, phone_number, password } = req.body;
    const targetPhone = mobile_number || phone_number;

    if (!targetPhone || !password) {
      return res.status(400).json({ success: false, message: "Phone number and password are required" });
    }

    const user = await UserRepository.findByPhone(targetPhone);

    // Check account lock before verifying password (avoids timing oracle)
    if (user && user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      const lockUntil = new Date(user.account_locked_until).toISOString();
      return res.status(423).json({
        success: false,
        message: `Account is locked until ${lockUntil}. Please try again later.`,
      });
    }

    const isValidPassword = await verifyPassword(
      password,
      user ? (user.hashed_password || user.password || user.password_hash || '') : ""
    );
    if (!user || !isValidPassword) {
      return res.status(401).json({ success: false, message: "Invalid phone number or password" });
    }

    // Check account status
    const blockedStatuses = ['INACTIVE', 'BLOCKED', 'DELETED', 'SUSPENDED'];
    if (blockedStatuses.includes(String(user.status).toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status.toLowerCase()}. Please contact support.`,
      });
    }

    // Update last_login_at
    await UserRepository.update(user.user_id, {
      last_login_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    const token = generateToken(user);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token, user: user.toSafeResponse() },
    });
  } catch (error) {
    logger.error("Login error", { error: error.message });
    return res.status(500).json({ success: false, message: error.message || "Login failed" });
  }
};


// ─── SEND OTP ─────────────────────────────────────────────────────────────────

exports.sendOtp = async (req, res) => {
  try {
    const { mobile, purpose } = req.body;

    if (!mobile) {
      return res.status(400).json({ success: false, message: "mobile is required" });
    }

    const phone = normalizePhone(mobile);
    if (!phone) {
      return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number" });
    }

    const allowedPurposes = ["login", "register", "forgot_password"];
    const otpPurpose = allowedPurposes.includes(purpose) ? purpose : "login";

    // For forgot_password — avoid user enumeration, return 200 regardless
    if (otpPurpose === "forgot_password") {
      const user = await UserRepository.findByPhone(phone);
      if (!user) {
        return res.status(200).json({ success: true, message: "If this number is registered, an OTP has been sent." });
      }
    }

    await otpService.generateAndSend(phone, otpPurpose);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      ...(process.env.TEST_MODE === "true" && { _dev_note: "Check server console for OTP (TEST_MODE=true)" }),
    });
  } catch (error) {
    logger.error("Send OTP error", { error: error.message });
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to send OTP" });
  }
};

// ─── VERIFY OTP ───────────────────────────────────────────────────────────────

exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, otp, purpose } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: "mobile and otp are required" });
    }

    const phone = normalizePhone(mobile);
    if (!phone) {
      return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number" });
    }

    const allowedPurposes = ["login", "register", "forgot_password"];
    const otpPurpose = allowedPurposes.includes(purpose) ? purpose : "login";

    const result = await otpService.verifyOtp(phone, otp, otpPurpose);
    logger.debug("OTP verify result", { phone, purpose: otpPurpose, valid: result.valid });

    if (!result.valid) {
      return res.status(400).json({ success: false, verified: false, message: result.reason || "Invalid OTP" });
    }

    // If verifying for login — issue token directly
    if (otpPurpose === "login") {
      const user = await UserRepository.findByPhone(phone);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        verified: true,
        message: "OTP verified successfully",
        data: { token, user: user.toSafeResponse() },
      });
    }

    return res.status(200).json({ success: true, verified: true, message: "OTP verified successfully" });
  } catch (error) {
    logger.error("Verify OTP error", { error: error.message });
    return res.status(500).json({ success: false, message: error.message || "OTP verification failed" });
  }
};

// ─── CHECK MOBILE ─────────────────────────────────────────────────────────────

exports.checkMobile = async (req, res) => {
  try {
    const { mobile } = req.params;
    if (!mobile) {
      return res.status(400).json({ success: false, message: "Mobile number is required" });
    }
    const user = await UserRepository.findByPhone(mobile);
    return res.status(200).json({
      success: true,
      exists: !!user,
      message: user ? "Mobile number already registered" : "Mobile number is available",
    });
  } catch (error) {
    logger.error("Check mobile error", { error: error.message });
    return res.status(500).json({ success: false, message: error.message || "Failed to check mobile number" });
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

exports.forgotPassword = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ success: false, message: "mobile is required" });
    }

    const phone = normalizePhone(mobile);
    if (!phone) {
      return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number" });
    }

    // Always return 200 to prevent user enumeration
    const user = await UserRepository.findByPhone(phone);
    if (!user) {
      return res.status(200).json({ success: true, message: "If this number is registered, an OTP has been sent." });
    }

    await otpService.generateAndSend(phone, "forgot_password");

    return res.status(200).json({
      success: true,
      message: "OTP sent to your registered mobile number",
      ...(process.env.TEST_MODE === "true" && { _dev_note: "Check server console for OTP (TEST_MODE=true)" }),
    });
  } catch (error) {
    logger.error("Forgot password error", { error: error.message });
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to initiate password reset" });
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

exports.resetPassword = async (req, res) => {
  try {
    const { mobile, otp, new_password } = req.body;

    if (!mobile || !otp || !new_password) {
      return res.status(400).json({ success: false, message: "mobile, otp, and new_password are required" });
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const phone = normalizePhone(mobile);
    if (!phone) {
      return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number" });
    }

    const result = await otpService.verifyOtp(phone, otp, "forgot_password");
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason || "Invalid or expired OTP" });
    }

    const user = await UserRepository.findByPhone(phone);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // await required — hashPassword is async (bcrypt)
    const hashedNewPassword = await hashPassword(new_password);
    await UserRepository.update(user.user_id, { password: hashedNewPassword });

    await deleteCache(`user_profile:${user.user_id}`);

    return res.status(200).json({ success: true, message: "Password reset successfully. Please log in with your new password." });
  } catch (error) {
    logger.error("Reset password error", { error: error.message });
    return res.status(500).json({ success: false, message: error.message || "Failed to reset password" });
  }
};

// ─── CHANGE PASSWORD (authenticated) ─────────────────────────────────────────

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "currentPassword and newPassword are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const user = await UserRepository.findById(userId);

    const isCurrentValid = await verifyPassword(
      currentPassword,
      user ? (user.hashed_password || user.password || user.password_hash || '') : ""
    );
    if (!user || !isCurrentValid) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    // await required — hashPassword is async (bcrypt)
    const hashedNewPwd = await hashPassword(newPassword);
    await UserRepository.update(userId, { password: hashedNewPwd });

    await deleteCache(`user_profile:${userId}`);

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    logger.error("Change password error", { error: error.message });
    return res.status(500).json({ success: false, message: error.message || "Failed to change password" });
  }
};

// ─── LOGOUT (stateless — client drops token) ─────────────────────────────────

exports.logout = async (req, res) => {
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
// POST /api/auth/refresh-token
// Body: { token } — existing valid JWT; returns a new token with refreshed expiry.
// Useful for clients that want to extend their session before expiry.

exports.refreshToken = async (req, res) => {
  try {
    const oldToken = req.body.token || (req.headers.authorization || '').replace('Bearer ', '').trim();

    if (!oldToken) {
      return res.status(400).json({ success: false, message: 'token is required' });
    }

    // Verify existing token — allow slightly expired tokens (grace period: 1 day)
    let decoded;
    try {
      decoded = jwt.verify(oldToken, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        // Grace: decode without verify to get user id even if expired
        decoded = jwt.decode(oldToken);
        if (!decoded || !decoded.id) {
          return res.status(401).json({ success: false, message: 'Token is invalid or too old to refresh' });
        }
        // Check token was expired no more than 24 hours ago
        const expiredAt = decoded.exp * 1000;
        const gracePeriod = 24 * 60 * 60 * 1000; // 24h
        if (Date.now() - expiredAt > gracePeriod) {
          return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
        }
      } else {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
    }

    const user = await UserRepository.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.status === 'BLOCKED' || user.status === 'DELETED' || user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Account is not active' });
    }

    const newToken = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token: newToken },
    });
  } catch (err) {
    logger.error('[authController.refreshToken]', err);
    return res.status(500).json({ success: false, message: 'Failed to refresh token' });
  }
};
