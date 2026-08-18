const { body } = require("express-validator");

// ─── Update Mobile — Step 1 (send OTP to new number) ─────────
exports.updateMobileValidator = [
  body("new_mobile")
    .notEmpty()
    .withMessage("new_mobile is required")
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid 10-digit Indian mobile number"),
];

// ─── Update Mobile — Step 2 (verify OTP + commit) ─────────────
exports.verifyMobileValidator = [
  body("new_mobile")
    .notEmpty()
    .withMessage("new_mobile is required")
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid 10-digit Indian mobile number"),
  body("otp")
    .notEmpty()
    .withMessage("otp is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only digits"),
];

// ─── Update Email — Step 1 (send OTP to new email) ────────────
exports.updateEmailValidator = [
  body("new_email")
    .notEmpty()
    .withMessage("new_email is required")
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),
];

// ─── Update Email — Step 2 (verify OTP + commit) ─────────────
exports.verifyEmailValidator = [
  body("new_email")
    .notEmpty()
    .withMessage("new_email is required")
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),
  body("otp")
    .notEmpty()
    .withMessage("otp is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only digits"),
];
