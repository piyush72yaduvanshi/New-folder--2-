class Booking {
  constructor(data) {
    this.booking_id = data.booking_id || null;
    this.user_id = data.user_id || null;
    this.vehicle_id = data.vehicle_id || null;
    this.start_date = data.start_date || null;
    this.end_date = data.end_date || null;
    this.rental_rate_per_week =
      data.rental_rate_per_week !== undefined && data.rental_rate_per_week !== null
        ? Number(data.rental_rate_per_week)
        : 0;
    this.total_amount =
      data.total_amount !== undefined && data.total_amount !== null
        ? Number(data.total_amount)
        : 0;
    this.security_deposit =
      data.security_deposit !== undefined && data.security_deposit !== null
        ? Number(data.security_deposit)
        : 0;
    this.status = data.status || "PENDING";
    this.payment_status = data.payment_status || "PENDING";
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;

    if (data.model_name !== undefined) this.model_name = data.model_name;
    if (data.image_url !== undefined) this.image_url = data.image_url;
  }

  toResponse() {
    return {
      booking_id: this.booking_id,
      user_id: this.user_id,
      vehicle_id: this.vehicle_id,
      start_date: this.start_date,
      end_date: this.end_date,
      rental_rate_per_week: this.rental_rate_per_week,
      total_amount: this.total_amount,
      security_deposit: this.security_deposit,
      status: this.status,
      payment_status: this.payment_status,
      model_name: this.model_name,
      image_url: this.image_url,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Booking;