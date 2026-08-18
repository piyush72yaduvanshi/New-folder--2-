'use strict';

class Job {
  constructor(data) {
    this.job_id = data.job_id || null;
    this.job_title = data.job_title || data.partner_name || '';
    this.partner_name = this.job_title;
    this.client_name = data.client_name || null;
    this.pickup_address = data.pickup_address || '';
    this.dropoff_address = data.dropoff_address || data.delivery_address || '';
    this.delivery_address = this.dropoff_address;
    this.distance_km = data.distance_km !== undefined && data.distance_km !== null ? parseFloat(data.distance_km) : null;
    this.status = data.status || 'PENDING';
    this.assigned_rider_id = data.assigned_rider_id || data.assigned_user_id || null;
    this.assigned_user_id = this.assigned_rider_id;
    this.assigned_vehicle_id = data.assigned_vehicle_id || null;
    this.estimated_earnings = data.estimated_earnings !== undefined && data.estimated_earnings !== null
      ? parseFloat(data.estimated_earnings)
      : (this.distance_km ? parseFloat((this.distance_km * 15).toFixed(2)) : 100.0);
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }
}

module.exports = Job;
