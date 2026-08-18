class Vehicle {
  constructor(data) {
    this.vehicle_id = data.vehicle_id || null;
    this.model_name = data.model_name || "";
    this.registration_number = data.registration_number || "";
    this.price_per_week =
      data.price_per_week !== undefined && data.price_per_week !== null
        ? Number(data.price_per_week)
        : 0;
    this.status = data.status || "AVAILABLE";
    this.image_url = data.image_url || null;

    this.battery_percentage =
      data.battery_percentage !== undefined && data.battery_percentage !== null
        ? Number(data.battery_percentage)
        : 100;

    this.range_remaining_km =
      data.range_remaining_km !== undefined && data.range_remaining_km !== null
        ? Number(data.range_remaining_km)
        : 100;

    this.estimated_range_km =
      data.estimated_range_km !== undefined && data.estimated_range_km !== null
        ? Number(data.estimated_range_km)
        : 100;

    this.top_speed_kmh =
      data.top_speed_kmh !== undefined && data.top_speed_kmh !== null
        ? Number(data.top_speed_kmh)
        : 60;

    this.battery_type = data.battery_type || "EXCHANGEABLE";
    this.assigned_hub = data.assigned_hub || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  toResponse() {
    return {
      vehicle_id: this.vehicle_id,
      model_name: this.model_name,
      registration_number: this.registration_number,
      price_per_week: this.price_per_week,
      status: this.status,
      image_url: this.image_url,
      battery_percentage: this.battery_percentage,
      range_remaining_km: this.range_remaining_km,
      estimated_range_km: this.estimated_range_km,
      top_speed_kmh: this.top_speed_kmh,
      battery_type: this.battery_type,
      assigned_hub: this.assigned_hub,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Vehicle;