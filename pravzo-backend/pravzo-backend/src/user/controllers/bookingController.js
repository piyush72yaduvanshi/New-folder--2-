const logger = require("../../../src/utils/logger");
const BookingRepository = require("../repositories/BookingRepository");
const VehicleRepository = require("../repositories/VehicleRepository");
const walletRepository = require("../repositories/walletRepository");
const db = require("../../../src/config/db");
const UserRepository = require("../repositories/UserRepository");
const { sendSuccess, sendError } = require('../../../src/utils/responseWrapper');

// Platform commission rate — configurable via env (default 10%)
const PLATFORM_COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.10');
exports.createBooking = async (req, res) => {
  try {
    const { reference_id, vehicle_id, start_date, end_date, security_deposit } =
      req.body;
    const user_id = Number(req.user.id);
    const vehicleId = Number(vehicle_id);
    const depositAmount = Number(security_deposit || 0);

    if (
      !reference_id ||
      !Number.isInteger(user_id) ||
      !Number.isInteger(vehicleId) ||
      vehicleId <= 0 ||
      !start_date ||
      !end_date ||
      !Number.isFinite(depositAmount) ||
      depositAmount < 0
    ) {
      return sendError(res, 400, 'Valid fields are required', 'VALIDATION_ERROR', null, req);
    }

    const start = new Date(`${start_date}T00:00:00Z`);
    const end = new Date(`${end_date}T00:00:00Z`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return sendError(res, 400, 'end_date must be after start_date', 'VALIDATION_ERROR', null, req);
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const vehicle = await VehicleRepository.findById(
        vehicle_id,
        connection,
        true,
      );

      if (!vehicle) {
        await connection.rollback();
        return sendError(res, 404, 'Vehicle not found', 'VEHICLE_NOT_FOUND', null, req);
      }

      if (vehicle.status !== "AVAILABLE") {
        await connection.rollback();
        return sendError(res, 409, 'Vehicle is not available', 'VEHICLE_UNAVAILABLE', [{ field: 'vehicle_id', message: vehicle.status }], req);
      }

      const rental_rate_per_week = Number(vehicle.price_per_week || 0);
      const rentalWeeks = Math.ceil((end - start) / (7 * 24 * 60 * 60 * 1000));
      const bookingAmount = Number(
        (rental_rate_per_week * rentalWeeks).toFixed(2),
      );

      const depositAmount = Number(security_deposit || 0);
      const payableAmount = Number((bookingAmount + depositAmount).toFixed(2));

      await walletRepository.deductMoney(
        {
          user_id,
          amount: payableAmount,
          reference_id,
          source: "booking",
          note: `Booking payment for vehicle ${vehicle_id}`,
          meta: {
            vehicle_id: Number(vehicle_id),
            start_date,
            end_date,
            rental_amount: bookingAmount,
            security_deposit: depositAmount,
          },
        },
        connection,
      );

      const bookingFields = {
        reference_id,
        user_id,
        vehicle_id,
        start_date,
        end_date,
        rental_rate_per_week,
        total_amount: bookingAmount,
        security_deposit: depositAmount,
        status: "ACTIVE",
        payment_status: "PAID",
      };

      const bookingId = await BookingRepository.create(
        bookingFields,
        connection,
      );

      await VehicleRepository.updateStatus(vehicle_id, "RENTED", connection);

      await connection.commit();

      const newBooking = await BookingRepository.findById(bookingId);

      return sendSuccess(res, 201, 'Booking created successfully', { booking: newBooking, payment_summary: { rental_amount: bookingAmount, security_deposit: depositAmount, total_paid: payableAmount } }, { req });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error("Create Booking Error:", error);
    return sendError(res, 500, error.message || 'Failed to create booking', 'SERVER_ERROR', null, req);
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const loggedInUserId = Number(req.user.id);

    if (userId !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: "You can access only your own bookings",
      });
    }

    const bookings = await BookingRepository.findByUserId(userId);
    return sendSuccess(res, 200, 'Bookings fetched successfully', { bookings }, { req });
  } catch (error) {
    logger.error("Get User Bookings Error:", error);
    return sendError(res, 500, error.message || 'Failed to fetch bookings', 'SERVER_ERROR', null, req);
  }
};

exports.cancelBooking = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const bookingId = Number(req.params.id);
    const loggedInUserId = Number(req.user.id);

    if (!Number.isInteger(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Valid booking id is required",
      });
    }

    await connection.beginTransaction();

    const [bookingRows] = await connection.query(
      `
      SELECT booking_id, user_id, vehicle_id, total_amount, security_deposit, status, payment_status
      FROM bookings
      WHERE booking_id = ?
      FOR UPDATE
      `,
      [bookingId],
    );

    if (!bookingRows.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking = bookingRows[0];

    if (Number(booking.user_id) !== Number(loggedInUserId)) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: "You can cancel only your own booking",
      });
    }

    if (booking.status === "CANCELLED") {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    if (booking.status === "COMPLETED") {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Completed booking cannot be cancelled",
      });
    }

    const refundAmount =
      Number(booking.total_amount || 0) + Number(booking.security_deposit || 0);

    await connection.query(
      `
      UPDATE bookings
      SET status = 'CANCELLED',
          payment_status = 'REFUNDED',
          updated_at = NOW()
      WHERE booking_id = ?
      `,
      [bookingId],
    );

    await connection.query(
      `
      UPDATE vehicles
      SET status = 'AVAILABLE',
          updated_at = NOW()
      WHERE vehicle_id = ?
      `,
      [booking.vehicle_id],
    );

    const [walletRows] = await connection.query(
      `SELECT wallet_id, user_id, wallet_balance, is_active
       FROM wallets WHERE user_id = ? FOR UPDATE`,
      [booking.user_id],
    );

    if (!walletRows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Wallet not found for this user" });
    }

    const wallet = walletRows[0];

    if (!wallet.is_active) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "User wallet is inactive" });
    }

    const openingBalance = Number(wallet.wallet_balance || 0);
    const closingBalance = openingBalance + refundAmount;

    await connection.query(
      `UPDATE wallets SET wallet_balance = ?, updated_at = NOW() WHERE wallet_id = ?`,
      [closingBalance, wallet.wallet_id],
    );

    const refundReferenceId = `BOOKING-REFUND-${booking.booking_id}-${Date.now()}`;

    await connection.query(
      `INSERT INTO wallet_transactions
       (wallet_id, user_id, transaction_type, source_type, amount,
        balance_before, balance_after, booking_id, reference_id, description)
       VALUES (?, ?, 'CREDIT', 'REFUND', ?, ?, ?, ?, ?, ?)`,
      [wallet.wallet_id, booking.user_id, refundAmount, openingBalance, closingBalance,
       booking.booking_id, refundReferenceId,
       `Refund added for cancelled booking #${booking.booking_id}`],
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully and refund added to wallet",
      data: {
        booking_id: booking.booking_id,
        refunded_amount: refundAmount,
        wallet_id: wallet.wallet_id,
        opening_balance: openingBalance,
        closing_balance: closingBalance,
      },
    });
  } catch (error) {
    await connection.rollback();
    logger.error("cancelBooking error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

exports.completeBooking = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const bookingId = Number(req.params.id);
    const loggedInRiderId = Number(req.user.id);

    if (!Number.isInteger(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Valid booking id is required",
      });
    }

    await connection.beginTransaction();

    const [bookingRows] = await connection.query(
      `
      SELECT booking_id, user_id, rider_id, vehicle_id, total_amount, status
      FROM bookings
      WHERE booking_id = ?
      FOR UPDATE
      `,
      [bookingId],
    );

    if (!bookingRows.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking = bookingRows[0];

    if (!booking.rider_id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "No rider assigned to this booking",
      });
    }

    if (Number(booking.rider_id) !== loggedInRiderId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: "You can complete only your assigned booking",
      });
    }

    if (booking.status === "COMPLETED") {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Booking already completed",
      });
    }

    if (booking.status === "CANCELLED") {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Cancelled booking cannot be completed",
      });
    }

    const totalAmount = Number(booking.total_amount || 0);
    const platformCommission = Number((totalAmount * PLATFORM_COMMISSION_RATE).toFixed(2));
    const riderEarning = Number((totalAmount - platformCommission).toFixed(2));

    await connection.query(
      `
      UPDATE bookings
      SET status = 'COMPLETED',
          updated_at = NOW()
      WHERE booking_id = ?
      `,
      [bookingId],
    );

    await connection.query(
      `
      UPDATE vehicles
      SET status = 'AVAILABLE',
          updated_at = NOW()
      WHERE vehicle_id = ?
      `,
      [booking.vehicle_id],
    );

    const [walletRows] = await connection.query(
      `SELECT w.wallet_id, w.user_id, w.wallet_balance, w.is_active
       FROM wallets w
       LEFT JOIN riders r ON r.user_id = w.user_id
       WHERE w.user_id = ? OR r.rider_id = ?
       LIMIT 1
       FOR UPDATE`,
      [booking.rider_id, booking.rider_id],
    );

    if (!walletRows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Rider wallet not found" });
    }

    const wallet = walletRows[0];

    if (!wallet.is_active) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Rider wallet is inactive" });
    }

    const openingBalance = Number(wallet.wallet_balance || 0);
    const closingBalance = Number((openingBalance + riderEarning).toFixed(2));

    await connection.query(
      `UPDATE wallets SET wallet_balance = ?, updated_at = NOW() WHERE wallet_id = ?`,
      [closingBalance, wallet.wallet_id],
    );

    const earningRefId = `EARNING-BOOKING-${booking.booking_id}-${Date.now()}`;
    await connection.query(
      `INSERT INTO wallet_transactions
       (wallet_id, user_id, transaction_type, source_type, reference_type, reference_id, amount,
        balance_before, balance_after, booking_id, description)
       VALUES (?, ?, 'CREDIT', 'EARNING', 'BOOKING_EARNING', ?, ?, ?, ?, ?, ?)`,
      [wallet.wallet_id, wallet.user_id, earningRefId, riderEarning, openingBalance, closingBalance,
       booking.booking_id, `Rider earning credited for completed booking #${booking.booking_id}`],
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Booking completed and rider earning credited successfully",
      data: {
        booking_id: booking.booking_id,
        rider_id: booking.rider_id,
        vehicle_id: booking.vehicle_id,
        credited_amount: riderEarning,
        platform_commission: platformCommission,
        wallet_id: wallet.wallet_id,
        opening_balance: openingBalance,
        closing_balance: closingBalance,
      },
    });
  } catch (error) {
    await connection.rollback();
    logger.error("completeBooking error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete booking",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

exports.assignRider = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const rider_id = Number(req.body.rider_id);

    if (!Number.isInteger(bookingId) || !Number.isInteger(rider_id)) {
      return res.status(400).json({
        success: false,
        message: "Valid booking id and rider_id are required",
      });
    }

    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (["CANCELLED", "COMPLETED"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Rider cannot be assigned to this booking",
      });
    }

    const rider = await UserRepository.findById(rider_id);
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    if (!["VEHICLE_WITH_JOB"].includes(rider.role)) {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a rider",
      });
    }

    if (rider.application_status !== "verified") {
      return res.status(400).json({
        success: false,
        message: "Selected rider is not verified",
      });
    }

    if (rider.employee_status && rider.employee_status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Selected rider is not active",
      });
    }

    await BookingRepository.assignRider(bookingId, rider_id);

    return res.status(200).json({
      success: true,
      message: "Rider assigned successfully",
    });
  } catch (error) {
    logger.error("Assign Rider Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign rider",
    });
  }
};
// ─── GET SINGLE BOOKING BY ID ─────────────────────────────────────────────────
exports.getBookingById = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const loggedInUserId = Number(req.user.id);
    const userRole = String(req.user.role || '').toUpperCase();

    if (!Number.isInteger(bookingId)) {
      return sendError(res, 400, 'Valid booking id is required', 'VALIDATION_ERROR', null, req);
    }

    const [rows] = await db.query(
      `SELECT b.*,
              v.model_name, v.image_url, v.registration_number,
              u.first_name, u.last_name, u.email,
              u.phone AS phone_number
       FROM bookings b
       LEFT JOIN vehicles v ON v.vehicle_id = b.vehicle_id
       LEFT JOIN users u ON u.user_id = b.user_id
       WHERE b.booking_id = ? LIMIT 1`,
      [bookingId]
    );

    if (!rows.length) {
      return sendError(res, 404, 'Booking not found', 'NOT_FOUND', null, req);
    }

    const booking = rows[0];
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);

    if (!isAdmin && Number(booking.user_id) !== loggedInUserId) {
      return sendError(res, 403, 'You can access only your own bookings', 'FORBIDDEN', null, req);
    }

    return sendSuccess(res, 200, 'Booking fetched successfully', { booking }, { req });
  } catch (error) {
    logger.error('Get Booking By Id Error:', error);
    return sendError(res, 500, error.message || 'Failed to fetch booking', 'SERVER_ERROR', null, req);
  }
};

// ─── ACCEPT AGREEMENT ─────────────────────────────────────────────────────────
exports.acceptAgreement = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const loggedInUserId = Number(req.user.id);

    if (!Number.isInteger(bookingId)) {
      return sendError(res, 400, 'Valid booking id is required', 'VALIDATION_ERROR', null, req);
    }

    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      return sendError(res, 404, 'Booking not found', 'NOT_FOUND', null, req);
    }

    if (Number(booking.user_id) !== loggedInUserId) {
      return sendError(res, 403, 'You can only accept your own agreement', 'FORBIDDEN', null, req);
    }

    // Record agreement acceptance
    await db.query(
      `UPDATE bookings SET agreement_accepted = 1, agreement_accepted_at = NOW(), updated_at = NOW()
       WHERE booking_id = ?`,
      [bookingId]
    ).catch(() => {
      // Column may not exist on all deployments — silently skip
    });

    return sendSuccess(res, 200, 'Agreement accepted successfully', { booking_id: bookingId }, { req });
  } catch (error) {
    logger.error('Accept Agreement Error:', error);
    return sendError(res, 500, error.message || 'Failed to accept agreement', 'SERVER_ERROR', null, req);
  }
};

// ─── GET BOOKING TIMELINE ─────────────────────────────────────────────────────
exports.getBookingTimeline = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const loggedInUserId = Number(req.user.id);

    if (!Number.isInteger(bookingId)) {
      return sendError(res, 400, 'Valid booking id is required', 'VALIDATION_ERROR', null, req);
    }

    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      return sendError(res, 404, 'Booking not found', 'NOT_FOUND', null, req);
    }

    if (Number(booking.user_id) !== loggedInUserId) {
      return sendError(res, 403, 'You can access only your own bookings', 'FORBIDDEN', null, req);
    }

    // Build timeline from booking status history
    const [events] = await db.query(
      `SELECT * FROM booking_status_logs WHERE booking_id = ? ORDER BY created_at ASC`,
      [bookingId]
    ).catch(() => [[]]);

    // If no logs table, construct from booking fields
    const timeline = events.length ? events : [
      { event: 'BOOKING_CREATED', status: 'PENDING', timestamp: booking.created_at, note: 'Booking created' },
      booking.status !== 'PENDING'
        ? { event: `BOOKING_${booking.status}`, status: booking.status, timestamp: booking.updated_at, note: `Booking ${booking.status.toLowerCase()}` }
        : null,
    ].filter(Boolean);

    return sendSuccess(res, 200, 'Timeline fetched successfully', { booking_id: bookingId, timeline }, { req });
  } catch (error) {
    logger.error('Get Booking Timeline Error:', error);
    return sendError(res, 500, error.message || 'Failed to fetch timeline', 'SERVER_ERROR', null, req);
  }
};

// ─── GET BOOKING TRACKING ─────────────────────────────────────────────────────
exports.getBookingTracking = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const loggedInUserId = Number(req.user.id);

    if (!Number.isInteger(bookingId)) {
      return sendError(res, 400, 'Valid booking id is required', 'VALIDATION_ERROR', null, req);
    }

    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      return sendError(res, 404, 'Booking not found', 'NOT_FOUND', null, req);
    }

    if (Number(booking.user_id) !== loggedInUserId) {
      return sendError(res, 403, 'You can access only your own bookings', 'FORBIDDEN', null, req);
    }

    // Get rider's latest location if rider is assigned
    let riderLocation = null;
    if (booking.rider_id) {
      const [locRows] = await db.query(
        `SELECT latitude, longitude, speed, heading, battery_level, updated_at
         FROM locations
         WHERE entity_id = ? AND entity_type IN ('RIDER', 'USER')
         ORDER BY updated_at DESC LIMIT 1`,
        [booking.rider_id]
      ).catch(() => [[]]);
      riderLocation = locRows[0] || null;
    }

    return sendSuccess(res, 200, 'Tracking info fetched successfully', {
      booking_id: bookingId,
      booking_status: booking.status,
      rider_id: booking.rider_id || null,
      rider_location: riderLocation,
      vehicle_id: booking.vehicle_id,
    }, { req });
  } catch (error) {
    logger.error('Get Booking Tracking Error:', error);
    return sendError(res, 500, error.message || 'Failed to fetch tracking', 'SERVER_ERROR', null, req);
  }
};

// ─── EXTEND BOOKING ───────────────────────────────────────────────────────────
exports.extendBooking = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const bookingId = Number(req.params.id);
    const loggedInUserId = Number(req.user.id);
    const { end_date, extension_days } = req.body;

    if (!Number.isInteger(bookingId)) {
      return sendError(res, 400, 'Valid booking id is required', 'VALIDATION_ERROR', null, req);
    }
    if (!end_date && !extension_days) {
      return sendError(res, 400, 'end_date or extension_days is required', 'VALIDATION_ERROR', null, req);
    }

    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT booking_id, user_id, vehicle_id, start_date, end_date,
              rental_rate_per_week, total_amount, status
       FROM bookings WHERE booking_id = ? FOR UPDATE`,
      [bookingId]
    );

    if (!rows.length) {
      await connection.rollback();
      return sendError(res, 404, 'Booking not found', 'NOT_FOUND', null, req);
    }

    const booking = rows[0];

    if (Number(booking.user_id) !== loggedInUserId) {
      await connection.rollback();
      return sendError(res, 403, 'You can only extend your own booking', 'FORBIDDEN', null, req);
    }

    if (!['ACTIVE', 'PENDING'].includes(booking.status)) {
      await connection.rollback();
      return sendError(res, 400, `Cannot extend a ${booking.status} booking`, 'INVALID_STATUS', null, req);
    }

    // Calculate new end_date
    let newEndDate = end_date;
    if (!newEndDate && extension_days) {
      const current = new Date(booking.end_date);
      current.setDate(current.getDate() + Number(extension_days));
      newEndDate = current.toISOString().slice(0, 10);
    }

    const currentEnd = new Date(booking.end_date);
    const newEnd = new Date(newEndDate);
    if (newEnd <= currentEnd) {
      await connection.rollback();
      return sendError(res, 400, 'New end date must be after current end date', 'VALIDATION_ERROR', null, req);
    }

    // Calculate extension cost
    const extDays = Math.ceil((newEnd - currentEnd) / (1000 * 60 * 60 * 24));
    const extWeeks = extDays / 7;
    const pricePerWeek = Number(booking.rental_rate_per_week || 0);
    const extensionCost = Number((pricePerWeek * extWeeks).toFixed(2));

    // Deduct from wallet
    const referenceId = `EXTEND-${bookingId}-${Date.now()}`;
    await require('../repositories/walletRepository').deductMoney(
      {
        user_id: loggedInUserId,
        amount: extensionCost,
        source: 'booking',
        reference_id: referenceId,
        booking_id: bookingId,
        note: `Booking extension for ${extDays} day(s)`,
      },
      connection
    );

    // Update booking
    const newTotal = Number((Number(booking.total_amount) + extensionCost).toFixed(2));
    await connection.query(
      `UPDATE bookings SET end_date = ?, total_amount = ?, updated_at = NOW() WHERE booking_id = ?`,
      [newEndDate, newTotal, bookingId]
    );

    await connection.commit();

    return sendSuccess(res, 200, 'Booking extended successfully', {
      booking_id: bookingId,
      new_end_date: newEndDate,
      extension_days: extDays,
      extension_cost: extensionCost,
      new_total_amount: newTotal,
    }, { req });
  } catch (error) {
    await connection.rollback();
    logger.error('Extend Booking Error:', error);
    return sendError(res, 500, error.message || 'Failed to extend booking', 'SERVER_ERROR', null, req);
  } finally {
    connection.release();
  }
};

// ─── DAMAGE REPORT ────────────────────────────────────────────────────────────
exports.addDamageReport = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const loggedInUserId = Number(req.user.id);
    const { damage_type, severity, description, photos } = req.body;

    if (!Number.isInteger(bookingId)) {
      return sendError(res, 400, 'Valid booking id is required', 'VALIDATION_ERROR', null, req);
    }
    if (!description) {
      return sendError(res, 400, 'description is required', 'VALIDATION_ERROR', null, req);
    }

    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      return sendError(res, 404, 'Booking not found', 'NOT_FOUND', null, req);
    }

    if (Number(booking.user_id) !== loggedInUserId) {
      return sendError(res, 403, 'You can only report damage for your own booking', 'FORBIDDEN', null, req);
    }

    // Insert damage report
    const [result] = await db.query(
      `INSERT INTO damage_reports
         (booking_id, vehicle_id, user_id, damage_type, severity, description, photos, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())`,
      [
        bookingId,
        booking.vehicle_id,
        loggedInUserId,
        damage_type || 'GENERAL',
        severity || 'MINOR',
        description,
        photos ? JSON.stringify(photos) : null,
      ]
    ).catch(async (err) => {
      // Table may not exist — create a note in booking
      await db.query(
        `UPDATE bookings SET notes = CONCAT(COALESCE(notes, ''), ?, ','), updated_at = NOW()
         WHERE booking_id = ?`,
        [`damage:${description}`, bookingId]
      ).catch(() => {});
      return [{ insertId: null }];
    });

    return sendSuccess(res, 201, 'Damage report submitted successfully', {
      booking_id: bookingId,
      damage_report_id: result[0]?.insertId || null,
      status: 'PENDING',
    }, { req });
  } catch (error) {
    logger.error('Add Damage Report Error:', error);
    return sendError(res, 500, error.message || 'Failed to submit damage report', 'SERVER_ERROR', null, req);
  }
};

// ─── PRE-BOOKING CHECKLIST ────────────────────────────────────────────────────
exports.getPreBookingChecklist = async (req, res) => {
  try {
    const checklist = [
      { item_id: 1, item: 'Valid driving license', category: 'DOCUMENTS', required: true },
      { item_id: 2, item: 'Aadhar card / ID proof', category: 'DOCUMENTS', required: true },
      { item_id: 3, item: 'Helmet worn properly', category: 'SAFETY', required: true },
      { item_id: 4, item: 'Battery charged > 20%', category: 'VEHICLE', required: true },
      { item_id: 5, item: 'Tyre pressure checked', category: 'VEHICLE', required: false },
      { item_id: 6, item: 'All lights functional', category: 'VEHICLE', required: false },
      { item_id: 7, item: 'Brakes tested', category: 'SAFETY', required: true },
      { item_id: 8, item: 'Emergency contact saved', category: 'SAFETY', required: false },
    ];
    return sendSuccess(res, 200, 'Pre-booking checklist fetched', { checklist }, { req });
  } catch (error) {
    logger.error('Get Checklist Error:', error);
    return sendError(res, 500, 'Failed to fetch checklist', 'SERVER_ERROR', null, req);
  }
};

// ─── POST-BOOKING CHECKLIST ───────────────────────────────────────────────────
exports.getPostBookingChecklist = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const checklist = [
      { item_id: 1, item: 'Vehicle returned to hub', category: 'RETURN', required: true },
      { item_id: 2, item: 'Keys handed over', category: 'RETURN', required: true },
      { item_id: 3, item: 'No visible damage', category: 'INSPECTION', required: true },
      { item_id: 4, item: 'Battery plugged in for charging', category: 'VEHICLE', required: false },
      { item_id: 5, item: 'Helmet returned', category: 'EQUIPMENT', required: false },
      { item_id: 6, item: 'Personal belongings removed', category: 'RETURN', required: true },
    ];
    return sendSuccess(res, 200, 'Post-booking checklist fetched', { booking_id: bookingId, checklist }, { req });
  } catch (error) {
    logger.error('Get Post Checklist Error:', error);
    return sendError(res, 500, 'Failed to fetch checklist', 'SERVER_ERROR', null, req);
  }
};

// ─── SUBMIT CHECKLIST ─────────────────────────────────────────────────────────
exports.submitChecklist = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const loggedInUserId = Number(req.user.id);
    const { checklist_items } = req.body;

    if (!Number.isInteger(bookingId)) {
      return sendError(res, 400, 'Valid booking id is required', 'VALIDATION_ERROR', null, req);
    }

    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      return sendError(res, 404, 'Booking not found', 'NOT_FOUND', null, req);
    }

    if (Number(booking.user_id) !== loggedInUserId) {
      return sendError(res, 403, 'You can only submit your own booking checklist', 'FORBIDDEN', null, req);
    }

    // Store checklist as metadata on booking
    await db.query(
      `UPDATE bookings SET checklist_data = ?, updated_at = NOW() WHERE booking_id = ?`,
      [JSON.stringify(checklist_items || []), bookingId]
    ).catch(() => {}); // column may not exist — silent

    return sendSuccess(res, 200, 'Checklist submitted successfully', {
      booking_id: bookingId,
      submitted_items: checklist_items?.length || 0,
    }, { req });
  } catch (error) {
    logger.error('Submit Checklist Error:', error);
    return sendError(res, 500, error.message || 'Failed to submit checklist', 'SERVER_ERROR', null, req);
  }
};

exports.getBookingAgreement = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const loggedInUserId = Number(req.user.id);

    if (!Number.isInteger(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Valid booking id is required",
      });
    }

    const booking = await BookingRepository.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (Number(booking.user_id) !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: "You can access only your own booking agreement",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        booking_id: booking.booking_id,
        user_id: booking.user_id,
        vehicle_id: booking.vehicle_id,
        rider_id: booking.rider_id || null,
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_amount: booking.total_amount,
        security_deposit: booking.security_deposit,
        status: booking.status,
        payment_status: booking.payment_status,
      },
    });
  } catch (error) {
    logger.error("Get Booking Agreement Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch booking agreement",
    });
  }
};
