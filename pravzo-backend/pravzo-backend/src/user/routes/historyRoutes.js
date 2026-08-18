const express = require("express");
const router = express.Router();

const walletController = require("../controllers/walletController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/me", authMiddleware, walletController.getMyWalletTransactions);

module.exports = router;
