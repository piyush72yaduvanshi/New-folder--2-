const express = require("express");
const {
  handleRazorpayWebhook,
} = require("../controllers/razorpayWebhookController");

const router = express.Router();

router.post(
  "/razorpayx/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    if (Buffer.isBuffer(req.body)) {
      req.rawBody = req.body.toString("utf8");

      try {
        req.body = JSON.parse(req.rawBody);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON payload",
        });
      }
    } else {
      req.rawBody = JSON.stringify(req.body);
    }

    next();
  },
  handleRazorpayWebhook,
);

module.exports = router;
