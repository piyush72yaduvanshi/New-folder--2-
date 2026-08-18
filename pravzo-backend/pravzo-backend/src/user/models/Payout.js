'use strict';

class Payout {
  constructor(data) {
    this.payout_id = data.payout_id || null;
    this.user_id = data.user_id || null;
    this.wallet_transaction_id = data.wallet_transaction_id || null;

    this.amount =
      data.amount !== undefined && data.amount !== null
        ? Number(data.amount)
        : 0;

    this.method = data.method || "bank_transfer";
    this.status = data.status || "pending";
    
    // Support both canonical and legacy aliases
    this.account_holder_name = data.account_holder_name || data.beneficiary_name || null;
    this.beneficiary_name = this.account_holder_name;
    
    this.bank_account_number = data.bank_account_number || data.account_number || null;
    this.account_number = this.bank_account_number;
    
    this.ifsc_code = data.ifsc_code || null;
    this.branch_name = data.branch_name || null;
    this.upi_id = data.upi_id || null;
    this.razorpayx_payout_id = data.razorpayx_payout_id || null;
    this.reference_id = data.reference_id || null;
    this.idempotency_key = data.idempotency_key || null;
    this.remarks = data.remarks || null;
    this.currency = data.currency || "INR";
    this.created_by = data.created_by || null;
    this.processed_at = data.processed_at || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  toResponse() {
    return {
      payout_id: this.payout_id,
      user_id: this.user_id,
      wallet_transaction_id: this.wallet_transaction_id,
      amount: this.amount,
      method: this.method,
      status: this.status,
      account_holder_name: this.account_holder_name,
      beneficiary_name: this.beneficiary_name,
      bank_account_number: this.bank_account_number,
      account_number: this.account_number,
      ifsc_code: this.ifsc_code,
      branch_name: this.branch_name,
      upi_id: this.upi_id,
      reference_id: this.reference_id,
      remarks: this.remarks,
      processed_at: this.processed_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  toSafeResponse() {
    return {
      payout_id: this.payout_id,
      user_id: this.user_id,
      wallet_transaction_id: this.wallet_transaction_id,
      amount: this.amount,
      method: this.method,
      status: this.status,
      account_holder_name: this.account_holder_name,
      beneficiary_name: this.beneficiary_name,
      bank_account_number: this.bank_account_number
        ? `****${String(this.bank_account_number).slice(-4)}`
        : null,
      account_number: this.account_number
        ? `****${String(this.account_number).slice(-4)}`
        : null,
      ifsc_code: this.ifsc_code || null,
      branch_name: this.branch_name || null,
      upi_id: this.upi_id || null,
      reference_id: this.reference_id,
      remarks: this.remarks,
      processed_at: this.processed_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Payout;