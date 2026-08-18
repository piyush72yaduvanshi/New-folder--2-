const db = require("../../../src/config/db");
const Booking = require("../models/Booking");

class BookingRepository {
  async findById(bookingId) {
    const [rows] = await db.query(
      "SELECT * FROM bookings WHERE booking_id = ? LIMIT 1",
      [bookingId],
    );

    if (rows.length === 0) return null;
    return new Booking(rows[0]);
  }

  async findByUserId(userId) {
    const [rows] = await db.query(
      `SELECT b.*, v.model_name, v.image_url
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.vehicle_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId],
    );

    return rows.map((row) => new Booking(row));
  }

  async create(bookingFields, executor = db) {
    const [result] = await executor.query(
      "INSERT INTO bookings SET ?",
      bookingFields,
    );
    return result.insertId;
  }

  async cancelById(bookingId, executor = db) {
    const [result] = await executor.query(
      `UPDATE bookings
       SET status = ?, updated_at = NOW()
       WHERE booking_id = ?`,
      ["CANCELLED", bookingId],
    );

    return result.affectedRows > 0;
  }

  async completeById(bookingId, executor = db) {
    const [result] = await executor.query(
      `UPDATE bookings
       SET status = ?, updated_at = NOW()
       WHERE booking_id = ?`,
      ["COMPLETED", bookingId],
    );

    return result.affectedRows > 0;
  }
  async assignRider(bookingId, riderId, executor = db) {
    // riderId can be either users.user_id or riders.rider_id
    // Resolve to riders.rider_id for consistency with admin system
    let resolvedRiderId = riderId;
    const [riderRow] = await db.query(
      'SELECT rider_id FROM riders WHERE user_id = ? LIMIT 1',
      [riderId]
    );
    if (riderRow.length > 0) {
      resolvedRiderId = riderRow[0].rider_id;
    }

    const [result] = await executor.query(
      `UPDATE bookings
       SET rider_id = ?, rider_user_id = ?, updated_at = NOW()
       WHERE booking_id = ?`,
      [resolvedRiderId, riderId, bookingId],
    );

    return result.affectedRows > 0;
  }
}

module.exports = new BookingRepository();
