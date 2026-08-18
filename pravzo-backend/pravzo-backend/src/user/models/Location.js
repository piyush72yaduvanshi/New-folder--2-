class Location {
  constructor(data) {
    this.rider_id = data.rider_id || data.riderId || null;
    this.latitude = data.latitude !== undefined ? parseFloat(data.latitude) : 0.0;
    this.longitude = data.longitude !== undefined ? parseFloat(data.longitude) : 0.0;
    this.timestamp = data.timestamp || new Date();
  }
}

module.exports = Location;
