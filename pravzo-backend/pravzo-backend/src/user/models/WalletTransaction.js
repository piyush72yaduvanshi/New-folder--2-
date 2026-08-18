'use strict';
// WalletTransaction model — aligned with final_database_v4
// Handles both old column names (opening_balance/closing_balance/type/source)
// and new column names (balance_before/balance_after/transaction_type/source_type)

class WalletTransaction {
  constructor(data) {
    this.transaction_id   = data.transaction_id   || null;
    this.wallet_id        = data.wallet_id        || null;
    this.user_id          = data.user_id          || null;
    // Support both old and new column names
    this.type             = data.transaction_type || data.type || null;
    this.transaction_type = this.type;
    this.source           = data.source_type      || data.source || null;
    this.source_type      = this.source;
    this.amount           = data.amount !== undefined && data.amount !== null
                              ? Number(data.amount) : 0;
    this.opening_balance  = data.balance_before !== undefined ? Number(data.balance_before)
                              : (data.opening_balance !== undefined ? Number(data.opening_balance) : 0);
    this.balance_before   = this.opening_balance;
    this.closing_balance  = data.balance_after !== undefined ? Number(data.balance_after)
                              : (data.closing_balance !== undefined ? Number(data.closing_balance) : 0);
    this.balance_after    = this.closing_balance;
    this.payment_id       = data.payment_id  || null;
    this.booking_id       = data.booking_id  || null;
    this.reference_id     = data.reference_id || null;
    this.note             = data.description  || data.note || null;
    this.description      = this.note;
    this.created_at       = data.created_at   || null;
  }

  toResponse() {
    return {
      transaction_id:  this.transaction_id,
      wallet_id:       this.wallet_id,
      user_id:         this.user_id,
      type:            this.type,
      source:          this.source,
      amount:          this.amount,
      opening_balance: this.opening_balance,
      closing_balance: this.closing_balance,
      payment_id:      this.payment_id,
      booking_id:      this.booking_id,
      reference_id:    this.reference_id,
      note:            this.note,
      created_at:      this.created_at,
    };
  }
}

module.exports = WalletTransaction;
