'use strict';

class Wallet {
  constructor(data) {
    Object.assign(this, data);
    const balance = data?.wallet_balance !== undefined && data?.wallet_balance !== null
      ? Number(data.wallet_balance)
      : (data?.wallet_amount !== undefined && data?.wallet_amount !== null ? Number(data.wallet_amount) : 0);
    this.wallet_balance = balance;
    this.wallet_amount  = balance;
  }

  toResponse() {
    return {
      wallet_id:      this.wallet_id,
      user_id:        this.user_id,
      wallet_balance: this.wallet_balance,
      wallet_amount:  this.wallet_amount,
      currency:       this.currency || 'INR',
      is_active:      this.is_active !== undefined ? Boolean(this.is_active) : true,
      created_at:     this.created_at,
      updated_at:     this.updated_at,
    };
  }

  toSummaryResponse() {
    return {
      wallet_id:      this.wallet_id,
      user_id:        this.user_id,
      wallet_balance: this.wallet_balance,
      wallet_amount:  this.wallet_amount,
      currency:       this.currency || 'INR',
      is_active:      this.is_active !== undefined ? Boolean(this.is_active) : true,
    };
  }
}

module.exports = Wallet;
