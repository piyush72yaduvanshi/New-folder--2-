const { body } = require("express-validator");

// ─── Register ─────────────────────────────────────────────────
exports.registerValidator = [
  body("phone_number")
    .optional()
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid 10-digit Indian mobile number"),
  body("mobile_number")
    .optional()
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid 10-digit Indian mobile number"),
  body("email")
    .isEmail()
    .withMessage("Enter a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .custom((val) => {
      const allowed = ['CUSTOMER', 'USER', 'RENT_A_VEHICLE', 'VEHICLE', 'RIDER', 'VEHICLE_WITH_JOB', 'VEHICLEWITHJOB'];
      if (val && !allowed.includes(String(val).trim().toUpperCase())) {
        throw new Error("Invalid role. Allowed roles: CUSTOMER | USER | RENT_A_VEHICLE | RIDER | VEHICLE_WITH_JOB");
      }
      return true;
    }),
];

// ─── Login ────────────────────────────────────────────────────
exports.loginValidator = [
  body("phone_number")
    .optional()
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid 10-digit Indian mobile number"),
  body("mobile_number")
    .optional()
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid 10-digit Indian mobile number"),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

// ─── Send OTP ─────────────────────────────────────────────────
exports.sendOtpValidator = [
  body("mobile")
    .notEmpty()
    .withMessage("mobile is required")
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid 10-digit Indian mobile number"),
  body("purpose")
    .optional()
    .isIn(["login", "register", "forgot_password"])
    .withMessage("purpose must be one of: login | register | forgot_password"),
];

// ─── Verify OTP ───────────────────────────────────────────────
exports.verifyOtpValidator = [
  body("mobile")
    .notEmpty()
    .withMessage("mobile is required")
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid 10-digit Indian mobile number"),
  body("otp")
    .notEmpty()
    .withMessage("otp is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only digits"),
  body("purpose")
    .optional()
    .isIn(["login", "register", "forgot_password"])
    .withMessage("purpose must be one of: login | register | forgot_password"),
];

// ─── Forgot Password ──────────────────────────────────────────
exports.forgotPasswordValidator = [
  body("mobile")
    .notEmpty()
    .withMessage("mobile is required")
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid 10-digit Indian mobile number"),
];

// ─── Reset Password ───────────────────────────────────────────
exports.resetPasswordValidator = [
  body("mobile")
    .notEmpty()
    .withMessage("mobile is required")
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid 10-digit Indian mobile number"),
  body("otp")
    .notEmpty()
    .withMessage("otp is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only digits"),
  body("new_password")
    .notEmpty()
    .withMessage("new_password is required")
    .isLength({ min: 6 })
    .withMessage("new_password must be at least 6 characters"),
];

// ─── Change Password (authenticated) ─────────────────────────
exports.changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("currentPassword is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("newPassword is required")
    .isLength({ min: 6 })
    .withMessage("newPassword must be at least 6 characters"),
];
