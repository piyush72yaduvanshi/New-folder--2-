const db = require("../../../src/config/db");
const Vehicle = require("../models/Vehicle");

const ALLOWED_VEHICLE_STATUSES = [
  "AVAILABLE",
  "RENTED",
  "MAINTENANCE",
  "INACTIVE",
];

class VehicleRepository {
  async findAll() {
    const [rows] = await db.query(
      "SELECT * FROM vehicles ORDER BY price_per_week ASC"
    );
    return rows.map((row) => new Vehicle(row));
  }

  async findById(vehicleId, executor = db, lockForUpdate = false) {
    const [rows] = await executor.query(
      `SELECT * FROM vehicles WHERE vehicle_id = ? LIMIT 1${lockForUpdate ? " FOR UPDATE" : ""}`,
      [vehicleId]
    );

    if (rows.length === 0) return null;
    return new Vehicle(rows[0]);
  }

  async updateStatus(vehicleId, status, executor = db) {
    const safeStatus = ALLOWED_VEHICLE_STATUSES.includes(status)
      ? status
      : "AVAILABLE";

    const [result] = await executor.query(
      "UPDATE vehicles SET status = ?, updated_at = NOW() WHERE vehicle_id = ?",
      [safeStatus, vehicleId]
    );

    return result.affectedRows > 0;
  }
}

module.exports = new VehicleRepository();