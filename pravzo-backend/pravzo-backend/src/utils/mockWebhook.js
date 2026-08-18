const axios = require("axios");
const crypto = require("crypto");

const sentWebhooks = new Set();

async function triggerMockWebhook({
  payoutId,
  referenceId,
  amount,
  status = "processed",
}) {
  if (sentWebhooks.has(referenceId)) {
    console.log("Webhook already sent:", referenceId);
    return;
  }

  sentWebhooks.add(referenceId);

  setTimeout(async () => {
    try {
      const payload = {
        event: `payout.${status}`,
        payload: {
          payout: {
            entity: {
              id: payoutId,
              status,
              amount,
              reference_id: referenceId,
            },
          },
        },
      };

      console.log("===============");
      console.log("Sending Mock Webhook");
      console.log(payload);
      console.log("===============");

      const rawBody = JSON.stringify(payload);

      const secret = process.env.RAZORPAYX_WEBHOOK_SECRET || "mock_secret";

      const signature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      await axios.post(
        `${process.env.BASE_URL}/api/payments/razorpayx/webhook`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "x-razorpay-signature": signature,
            "x-razorpay-event-id": "mock_" + Date.now(),
          },
        },
      );

      console.log("✅ Mock webhook sent successfully");
    } catch (err) {
      console.error("❌ Mock webhook failed");

      if (err.response) {
        console.error(err.response.status);
        console.error(err.response.data);
      } else {
        console.error(err.message);
      }
    }
  }, 2000);
}

module.exports = triggerMockWebhook;
