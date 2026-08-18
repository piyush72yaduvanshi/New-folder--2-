const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const validateRequest = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const {
  userLoginLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  passwordResetLimiter
} = require("../../middleware/rateLimiters");
const {
  registerValidator,
  loginValidator,
  sendOtpValidator,
  verifyOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} = require("../validators/authValidator");

// ── Public ─────────────────────────────────────────────────────────────────

router.post(
  "/register",
  userLoginLimiter,
  registerValidator,
  validateRequest,
  authController.register
);

router.post(
  "/login",
  userLoginLimiter,
  loginValidator,
  validateRequest,
  authController.login
);

router.post(
  "/send-otp",
  otpSendLimiter,
  sendOtpValidator,
  validateRequest,
  authController.sendOtp
);

router.post(
  "/verify-otp",
  otpVerifyLimiter,
  verifyOtpValidator,
  validateRequest,
  authController.verifyOtp
);

router.get(
  "/check-mobile/:mobile",
  authController.checkMobile
);

router.post(
  "/forgot-password",
  passwordResetLimiter,
  forgotPasswordValidator,
  validateRequest,
  authController.forgotPassword
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  resetPasswordValidator,
  validateRequest,
  authController.resetPassword
);

// ── Authenticated ──────────────────────────────────────────────────────────

router.post(
  "/refresh-token",
  authController.refreshToken
);

router.put(
  "/change-password",
  authMiddleware,
  changePasswordValidator,
  validateRequest,
  authController.changePassword
);

router.post(
  "/logout",
  authMiddleware,
  authController.logout
);

module.exports = router;
