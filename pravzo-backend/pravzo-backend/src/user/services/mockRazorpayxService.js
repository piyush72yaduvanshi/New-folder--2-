const triggerMockWebhook = require("../../../src/utils/mockWebhook");
const crypto = require("crypto");

const ALLOWED_PAYOUT_MODES = ["UPI", "IMPS", "NEFT", "RTGS"];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertNonEmpty(value, fieldName) {
  if (!value || !String(value).trim()) {
    throw new Error(`${fieldName} is required`);
  }
}

async function createContact({
  name,
  email,
  contact,
  reference_id,
  type = "vendor",
}) {
  assertNonEmpty(name, "Contact name");
  assertNonEmpty(reference_id, "reference_id");

  await delay(400);

  return {
    id: "cont_mock_" + Date.now(),
    entity: "contact",
    name,
    email,
    contact,
    type,
    active: true,
    reference_id,
  };
}

async function createBankFundAccount({
  contact_id,
  account_holder_name,
  ifsc,
  account_number,
}) {
  assertNonEmpty(contact_id, "contact_id");

  await delay(400);

  return {
    id: "fa_mock_bank_" + Date.now(),
    entity: "fund_account",
    contact_id,
    account_type: "bank_account",
    active: true,
    bank_account: {
      name: account_holder_name,
      ifsc,
      account_number,
    },
  };
}

async function createVpaFundAccount({ contact_id, upi_id }) {
  assertNonEmpty(contact_id, "contact_id");

  await delay(400);

  return {
    id: "fa_mock_upi_" + Date.now(),
    entity: "fund_account",
    contact_id,
    account_type: "vpa",
    active: true,
    vpa: {
      address: upi_id,
    },
  };
}

async function createPayout({
  fund_account_id,
  amount,
  mode,
  reference_id,
  narration,
}) {
  assertNonEmpty(fund_account_id, "fund_account_id");
  assertNonEmpty(reference_id, "reference_id");

  if (!ALLOWED_PAYOUT_MODES.includes(mode)) {
    throw new Error("Invalid payout mode");
  }

  await delay(1000);
  let webhookStatus = "processed";

  // amount paise me aa raha hai
  if (amount === 20000) {
    webhookStatus = "failed";
  } else if (amount === 30000) {
    webhookStatus = "pending";
  } else if (amount === 40000) {
    webhookStatus = "reversed";
  }
  const payout = {
    id: "pout_mock_" + Date.now(),
    entity: "payout",
    fund_account_id,
    amount,
    currency: "INR",
    mode,
    purpose: "payout",
    status: "processing",
    reference_id,
    narration,
    created_at: Math.floor(Date.now() / 1000),
  };

  console.log("=================================");
  console.log("Mock Webhook Scheduled");
  console.log({
    payoutId: payout.id,
    referenceId: reference_id,
    status: webhookStatus,
  });
  console.log("=================================");
  triggerMockWebhook({
    payoutId: payout.id,
    referenceId: reference_id,
    amount,
    status: webhookStatus,
  }).catch(console.error);
  return payout;
}

async function fetchPayoutById(id) {
  await delay(500);

  return {
    id,

    entity: "payout",

    status: "processed",

    utr: "UTR" + Date.now(),

    processed_at: Math.floor(Date.now() / 1000),
  };
}

function generateIdempotencyKey(seed) {
  assertNonEmpty(seed, "seed");

  return crypto.createHash("sha256").update(seed).digest("hex").slice(0, 36);
}

module.exports = {
  createContact,

  createBankFundAccount,

  createVpaFundAccount,

  createPayout,

  fetchPayoutById,

  generateIdempotencyKey,
};
