const express = require("express");
const router = express.Router();
const { body, validationResult } = require('express-validator');

const paymentController = require("../controllers/paymentController");
const walletController = require("../controllers/walletController");
const authMiddleware = require("../middleware/authMiddleware");
const ownerMiddleware = require("../middleware/ownerMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

const validateTopup = [
  body('amount').isFloat({ min: 1 }).withMessage('amount must be at least 1'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors.array().map(e => ({ field: e.path, message: e.msg })) });
    }
    next();
  }
];

const validateCashout = [
  body('amount').isFloat({ min: 1 }).withMessage('amount must be at least 1'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors.array().map(e => ({ field: e.path, message: e.msg })) });
    }
    next();
  }
];

router.post(
  "/topup-order",
  authMiddleware,
  validateTopup,
  paymentController.createWalletTopupOrder,
);

router.post(
  "/verify-topup",
  authMiddleware,
  paymentController.verifyWalletTopup,
);

router.post(
  "/add-money",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  walletController.addMoney,
);

 
router.post(
  "/cashout",
  authMiddleware,
  authorizeRoles("VEHICLE_WITH_JOB", "ADMIN", "SUPER_ADMIN"),
  validateCashout,
  walletController.instantCashout,
);

router.get(
  "/transactions/:userId",
  authMiddleware,
  ownerMiddleware("userId"),
  walletController.getMyWalletTransactions,
);

router.get(
  "/:userId",
  authMiddleware,
  ownerMiddleware("userId"),
  walletController.getMyWallet,
);

module.exports = router;
