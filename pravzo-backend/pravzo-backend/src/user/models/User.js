class User {
  constructor(data) {
    Object.assign(this, data);
  }

  toSafeResponse() {
    return {
      user_id: this.user_id,
      full_name: this.full_name,
      phone_number: this.phone_number,
      email: this.email,
      date_of_birth: this.date_of_birth,
      gender: this.gender,
      address: this.address,
      role: this.role,
      profile_photo: this.profile_photo,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  toSelfProfileResponse() {
    return {
      user_id: this.user_id,
      full_name: this.full_name,
      phone_number: this.phone_number,
      email: this.email,
      date_of_birth: this.date_of_birth,
      gender: this.gender,
      address: this.address,
      role: this.role,

      employee_id: this.employee_id,
      job_type: this.job_type,
      joining_date: this.joining_date,
      salary: this.salary,
      assigned_hub: this.assigned_hub,
      assigned_company: this.assigned_company,
      selected_partner: this.selected_partner,
      rider_code: this.rider_code,

      employee_status: this.employee_status,
      application_status: this.application_status,
      status: this.status,

      driving_license_number: this.driving_license_number,
      driving_license_photo: this.driving_license_photo,
      driving_license_back_photo: this.driving_license_back_photo,

      aadhar_number: this.aadhar_number
        ? `********${String(this.aadhar_number).slice(-4)}`
        : null,
      aadhar_card_photo: this.aadhar_card_photo,
      aadhar_card_back_photo: this.aadhar_card_back_photo,

      profile_photo: this.profile_photo,

      bank_account_number: this.bank_account_number
        ? `****${String(this.bank_account_number).slice(-4)}`
        : null,
      ifsc_code: this.ifsc_code,
      branch_name: this.branch_name,
      account_holder_name: this.account_holder_name,
      upi_id: this.upi_id,
      payout_schedule: this.payout_schedule,

      emergency_contact_name: this.emergency_contact_name,
      emergency_contact_number: this.emergency_contact_number,

      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  toMaskedBankResponse() {
    return {
      bank_account_number: this.bank_account_number
        ? `****${String(this.bank_account_number).slice(-4)}`
        : null,
      ifsc_code: this.ifsc_code || null,
      branch_name: this.branch_name || null,
      account_holder_name: this.account_holder_name || null,
      upi_id: this.upi_id || null,
      payout_schedule: this.payout_schedule || null,
    };
  }
  toKycResponse() {
  return {
    driving_license_number: this.driving_license_number,
    driving_license_photo: this.driving_license_photo,
    driving_license_back_photo: this.driving_license_back_photo,

    aadhar_number: this.aadhar_number
      ? `********${String(this.aadhar_number).slice(-4)}`
      : null,
    aadhar_card_photo: this.aadhar_card_photo,
    aadhar_card_back_photo: this.aadhar_card_back_photo,

    application_status: this.application_status,
    employee_status: this.employee_status,
    selected_partner: this.selected_partner,
    rider_code: this.rider_code,
    updated_at: this.updated_at,
  };
}
}

module.exports = User;
