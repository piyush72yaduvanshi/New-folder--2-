const express = require("express");
const router = express.Router();

const invoiceController = require("../controllers/invoiceController");
const authMiddleware = require("../middleware/authMiddleware");

// Mounted under /bookings — so full path: GET /api/bookings/:id/invoice
router.get("/:id/invoice", authMiddleware, invoiceController.downloadInvoice);

module.exports = router;
