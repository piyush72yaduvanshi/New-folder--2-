const crypto = require("crypto");
const razorpayx = require("../../../src/config/razorpayx");

const ALLOWED_PAYOUT_MODES = ["UPI", "IMPS", "NEFT", "RTGS"];

function assertNonEmpty(value, fieldName) {
  if (!value || !String(value).trim()) {
    throw new Error(`${fieldName} is required`);
  }
}

function normalizeNotes(notes = {}) {
  return notes && typeof notes === "object" ? notes : {};
}

async function createContact({
  name,
  email,
  contact,
  reference_id,
  type = "vendor",
  notes = {},
}) {
  assertNonEmpty(name, "Contact name");
  assertNonEmpty(reference_id, "Contact reference_id");

  const payload = {
    name: String(name).trim(),
    type,
    reference_id: String(reference_id).trim(),
    notes: normalizeNotes(notes),
  };

  if (email) payload.email = String(email).trim();
  if (contact) payload.contact = String(contact).replace(/\D/g, "").slice(-10);

  const { data } = await razorpayx.post("/contacts", payload);
  return data;
}

async function createBankFundAccount({
  contact_id,
  account_holder_name,
  ifsc,
  account_number,
}) {
  assertNonEmpty(contact_id, "contact_id");
  assertNonEmpty(account_holder_name, "account_holder_name");
  assertNonEmpty(ifsc, "ifsc");
  assertNonEmpty(account_number, "account_number");

  const payload = {
    contact_id,
    account_type: "bank_account",
    bank_account: {
      name: String(account_holder_name).trim(),
      ifsc: String(ifsc).trim().toUpperCase(),
      account_number: String(account_number).trim(),
    },
  };

  const { data } = await razorpayx.post("/fund_accounts", payload);
  return data;
}

async function createVpaFundAccount({ contact_id, upi_id }) {
  assertNonEmpty(contact_id, "contact_id");
  assertNonEmpty(upi_id, "upi_id");

  const payload = {
    contact_id,
    account_type: "vpa",
    vpa: {
      address: String(upi_id).trim(),
    },
  };

  const { data } = await razorpayx.post("/fund_accounts", payload);
  return data;
}

async function createPayout({
  fund_account_id,
  amount,
  mode,
  purpose = "payout",
  queue_if_low_balance = true,
  reference_id,
  narration,
  notes = {},
  idempotency_key,
}) {
  assertNonEmpty(
    process.env.RAZORPAYX_SOURCE_ACCOUNT_NUMBER,
    "RAZORPAYX_SOURCE_ACCOUNT_NUMBER",
  );
  assertNonEmpty(fund_account_id, "fund_account_id");
  assertNonEmpty(reference_id, "reference_id");
  assertNonEmpty(idempotency_key, "idempotency_key");

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount must be a positive integer in paise");
  }

  if (!ALLOWED_PAYOUT_MODES.includes(mode)) {
    throw new Error(
      `Invalid payout mode. Allowed modes: ${ALLOWED_PAYOUT_MODES.join(", ")}`,
    );
  }

  const payload = {
    account_number: process.env.RAZORPAYX_SOURCE_ACCOUNT_NUMBER,
    fund_account_id,
    amount,
    currency: "INR",
    mode,
    purpose,
    queue_if_low_balance,
    reference_id: String(reference_id).trim(),
    narration: narration ? String(narration).trim().slice(0, 30) : undefined,
    notes: normalizeNotes(notes),
  };

  const { data } = await razorpayx.post("/payouts", payload, {
    headers: {
      "X-Payout-Idempotency": String(idempotency_key).trim(),
    },
  });

  return data;
}

async function fetchPayoutById(payoutId) {
  assertNonEmpty(payoutId, "payoutId");
  const { data } = await razorpayx.get(`/payouts/${payoutId}`);
  return data;
}

function generateIdempotencyKey(seed = "") {
  assertNonEmpty(seed, "seed");
  return crypto
    .createHash("sha256")
    .update(String(seed).trim())
    .digest("hex")
    .slice(0, 36);
}

module.exports = {
  createContact,
  createBankFundAccount,
  createVpaFundAccount,
  createPayout,
  fetchPayoutById,
  generateIdempotencyKey,
};
