'use strict';

const db = require('../../../src/config/db');

class BookingRepository {
  // ==================== BOOKING QUERIES ====================

  async findById(bookingId) {
    const [rentalRows] = await db.query(
      `SELECT 
         b.booking_id as trip_id, b.booking_id, b.booking_number, b.reference_id,
         b.user_id, b.vehicle_id, b.rider_id, b.rider_user_id, b.assigned_at,
         b.coupon_code, b.status, b.payment_status,
         b.total_amount as fare_amount, b.total_amount, b.security_deposit,
         b.start_date, b.end_date, b.rental_rate_per_week,
         b.created_at, b.updated_at 
       FROM bookings b 
       WHERE b.booking_id = ?`,
      [bookingId]
    );
    if (rentalRows.length > 0) return rentalRows[0];

    const [tripRows] = await db.query(
      'SELECT * FROM rider_trips WHERE trip_id = ?',
      [bookingId]
    );
    return tripRows.length > 0 ? tripRows[0] : null;
  }

  async getBookings(filters = {}, pagination = {}) {
    const {
      search = '',
      bookingStatus = null,
      vehicleType = null,
      paymentStatus = null,
      riderId = null,
      userId = null,
      startDate = null,
      endDate = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    // SECURITY: Whitelist sortBy/sortOrder
    const ALLOWED_SORT_FIELDS = new Set([
      'created_at', 'updated_at', 'total_amount', 'status', 'payment_status'
    ]);
    const ALLOWED_SORT_ORDERS = new Set(['ASC', 'DESC']);
    const safeSortBy    = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = ALLOWED_SORT_ORDERS.has(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    // Search
    if (search) {
      conditions.push('(b.booking_id LIKE ? OR b.booking_number LIKE ? OR u.full_name LIKE ? OR u.phone LIKE ? OR ru.full_name LIKE ? OR ru.phone LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (bookingStatus) {
      conditions.push('b.status = ?');
      params.push(bookingStatus);
    }

    if (vehicleType) {
      conditions.push('v.vehicle_type = ?');
      params.push(vehicleType);
    }

    if (paymentStatus) {
      conditions.push('b.payment_status = ?');
      params.push(paymentStatus);
    }

    if (riderId) {
      conditions.push('(b.rider_id = ? OR b.rider_user_id = ?)');
      params.push(riderId, riderId);
    }

    if (userId) {
      conditions.push('b.user_id = ?');
      params.push(userId);
    }

    if (startDate) {
      conditions.push('b.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('b.created_at <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(DISTINCT b.booking_id) as total 
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.user_id
      LEFT JOIN riders r ON b.rider_id = r.rider_id
      LEFT JOIN users ru ON (r.user_id = ru.user_id OR b.rider_user_id = ru.user_id)
      LEFT JOIN vehicles v ON b.vehicle_id = v.vehicle_id
      ${whereClause}
    `;
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    const dataQuery = `
      SELECT 
        b.booking_id as trip_id, b.booking_id, b.booking_number,
        b.rider_id, b.rider_user_id, b.user_id, b.vehicle_id,
        b.start_date, b.end_date, b.rental_rate_per_week,
        b.total_amount as fare_amount, b.total_amount,
        b.security_deposit,
        b.payment_status, b.status,
        b.created_at, b.updated_at,
        u.full_name as user_name, u.phone as user_phone, u.profile_image as user_photo,
        ru.full_name as rider_name, ru.phone as rider_phone,
        v.vehicle_type, v.model_name, v.registration_number
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.user_id
      LEFT JOIN riders r ON b.rider_id = r.rider_id
      LEFT JOIN users ru ON (r.user_id = ru.user_id OR b.rider_user_id = ru.user_id)
      LEFT JOIN vehicles v ON b.vehicle_id = v.vehicle_id
      ${whereClause}
      ORDER BY b.${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await db.query(dataQuery, [...params, parseInt(limit), parseInt(offset)]);

    return {
      bookings: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  async getBookingDetails(bookingId) {
    const [rows] = await db.query(
      `SELECT 
        b.booking_id as trip_id, b.booking_id, b.booking_number, b.reference_id,
        b.user_id, b.vehicle_id, b.rider_id, b.rider_user_id, b.assigned_at,
        b.status, b.payment_status, b.total_amount as fare_amount, b.total_amount,
        b.security_deposit, b.rental_rate_per_week,
        b.start_date, b.end_date, b.created_at, b.updated_at,
        u.full_name as user_name, u.phone as user_phone, u.email as user_email,
        u.profile_image as user_photo,
        ru.full_name as rider_name, ru.phone as rider_phone, ru.email as rider_email,
        r.rider_code, r.rating as rider_rating, ru.profile_image as rider_photo,
        v.vehicle_id, v.vehicle_type, v.model_name,
        v.registration_number, v.color, v.year_of_manufacture,
        0 as distance_km, 0 as duration_minutes,
        b.assigned_at as accepted_at, b.updated_at as completed_at
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.user_id
       LEFT JOIN riders r ON b.rider_id = r.rider_id
       LEFT JOIN users ru ON (r.user_id = ru.user_id OR b.rider_user_id = ru.user_id)
       LEFT JOIN vehicles v ON b.vehicle_id = v.vehicle_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getBookingStatistics() {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_bookings,
        SUM(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 ELSE 0 END) as weekly_bookings,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) as monthly_bookings,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as accepted_bookings,
        0 as rejected_bookings,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as ongoing_bookings,
        COALESCE(AVG(CASE WHEN status = 'COMPLETED' THEN total_amount END), 0) as avg_fare,
        0 as avg_distance,
        0 as avg_ride_time
       FROM bookings`
    );

    const stats = rows[0] || {};
    const totalTrips = (stats.completed_bookings || 0) + (stats.cancelled_bookings || 0);
    const cancellationRate = totalTrips > 0 
      ? (((stats.cancelled_bookings || 0) / totalTrips) * 100).toFixed(2)
      : 0;

    const successRate = (stats.total_bookings || 0) > 0
      ? (((stats.completed_bookings || 0) / stats.total_bookings) * 100).toFixed(2)
      : 0;

    const [prevMonthResult] = await db.query(
      `SELECT COUNT(*) as prev_month_bookings
       FROM bookings
       WHERE MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
       AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`
    );

    const prevMonthCount = prevMonthResult[0]?.prev_month_bookings || 0;
    const currentMonthCount = stats.monthly_bookings || 0;
    const growthPercentage = prevMonthCount > 0 
      ? (((currentMonthCount - prevMonthCount) / prevMonthCount) * 100).toFixed(2)
      : 0;

    return {
      ...stats,
      cancellation_rate: parseFloat(cancellationRate),
      success_rate: parseFloat(successRate),
      growth_percentage: parseFloat(growthPercentage)
    };
  }

  async getBookingsForExport(filters = {}) {
    const {
      bookingStatus = null,
      startDate = null,
      endDate = null,
      riderId = null,
      userId = null
    } = filters;

    const conditions = [];
    const params = [];

    if (bookingStatus) { conditions.push('b.status = ?'); params.push(bookingStatus); }
    if (riderId) { conditions.push('b.rider_id = ?'); params.push(riderId); }
    if (userId) { conditions.push('b.user_id = ?'); params.push(userId); }
    if (startDate) { conditions.push('b.created_at >= ?'); params.push(startDate); }
    if (endDate) { conditions.push('b.created_at <= ?'); params.push(endDate); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        b.booking_id,
        b.booking_number,
        b.status as booking_status,
        u.full_name as customer_name,
        u.phone as customer_phone,
        ru.full_name as rider_name,
        ru.phone as rider_phone,
        v.vehicle_type,
        v.registration_number,
        b.start_date,
        b.end_date,
        b.total_amount as fare_amount,
        b.security_deposit,
        b.payment_status,
        b.created_at
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.user_id
      LEFT JOIN riders r ON b.rider_id = r.rider_id
      LEFT JOIN users ru ON (r.user_id = ru.user_id OR b.rider_user_id = ru.user_id)
      LEFT JOIN vehicles v ON b.vehicle_id = v.vehicle_id
      ${whereClause}
      ORDER BY b.created_at DESC
    `;

    const [rows] = await db.query(query, params);
    return rows;
  }

  async getBookingTimeline(bookingId) {
    const [rows] = await db.query(
      `SELECT 
        b.booking_id as trip_id, b.booking_id,
        b.booking_number, b.status,
        b.created_at as booking_created,
        b.start_date, b.end_date,
        b.updated_at,
        ru.full_name as rider_name,
        u.full_name as user_name
       FROM bookings b
       LEFT JOIN riders r ON b.rider_id = r.rider_id
       LEFT JOIN users ru ON (r.user_id = ru.user_id OR b.rider_user_id = ru.user_id)
       LEFT JOIN users u ON b.user_id = u.user_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getLiveBookingStatus(bookingId) {
    const [rows] = await db.query(
      `SELECT 
        b.booking_id as trip_id, b.status, b.rider_id,
        b.vehicle_id,
        vl.latitude as current_latitude, vl.longitude as current_longitude,
        vl.updated_at as location_updated_at,
        ru.full_name as rider_name,
        ru.phone as rider_phone,
        r.online_status,
        r.availability,
        v.vehicle_type,
        v.registration_number
       FROM bookings b
       LEFT JOIN riders r ON b.rider_id = r.rider_id
       LEFT JOIN users ru ON (r.user_id = ru.user_id OR b.rider_user_id = ru.user_id)
       LEFT JOIN vehicles v ON b.vehicle_id = v.vehicle_id
       LEFT JOIN vehicle_locations vl ON v.vehicle_id = vl.vehicle_id
       WHERE b.booking_id = ?
       AND b.status = 'ACTIVE'`,
      [bookingId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // ==================== OPERATIONAL METHODS ====================

  async cancelBooking(bookingId, reason, cancelledBy, adminId, cancelledAt) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE bookings
         SET status = 'CANCELLED',
             updated_at = ?
         WHERE booking_id = ?`,
        [cancelledAt, bookingId]
      );

      await connection.query(
        `INSERT INTO booking_audit_logs
         (booking_id, action, performed_by, actor_id, old_status, new_status, notes, created_at)
         VALUES (?, 'CANCELLED', 'ADMIN', ?, 'ACTIVE', 'CANCELLED', ?, ?)`,
        [bookingId, adminId, `Cancelled by ${cancelledBy}: ${reason}`, cancelledAt]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async refundBooking(bookingId, refundAmount, refundReason, adminId, refundedAt) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [rentalCheck] = await connection.query(
        'SELECT booking_id, user_id, total_amount, security_deposit FROM bookings WHERE booking_id = ? LIMIT 1',
        [bookingId]
      );

      if (rentalCheck.length > 0) {
        const rental = rentalCheck[0];

        await connection.query(
          `UPDATE bookings
           SET payment_status = 'REFUNDED',
               updated_at = ?
           WHERE booking_id = ?`,
          [refundedAt, bookingId]
        );

        if (rental.user_id && refundAmount > 0) {
          const [walletRows] = await connection.query(
            'SELECT wallet_id, wallet_balance, is_active FROM wallets WHERE user_id = ? LIMIT 1 FOR UPDATE',
            [rental.user_id]
          );

          if (walletRows.length > 0 && walletRows[0].is_active) {
            const wallet       = walletRows[0];
            const openingBal   = Number(wallet.wallet_balance);
            const closingBal   = Number((openingBal + refundAmount).toFixed(2));
            const refundRef    = `ADMIN-REFUND-${bookingId}-${Date.now()}`;

            await connection.query(
              'UPDATE wallets SET wallet_balance = ?, updated_at = NOW() WHERE wallet_id = ?',
              [closingBal, wallet.wallet_id]
            );

            await connection.query(
              `INSERT INTO wallet_transactions
               (wallet_id, user_id, transaction_type, source_type, reference_type, amount,
                balance_before, balance_after, booking_id, reference_id, description, created_at)
               VALUES (?, ?, 'CREDIT', 'REFUND', 'BOOKING_REFUND', ?, ?, ?, ?, ?, ?, NOW())`,
              [wallet.wallet_id, rental.user_id, refundAmount,
               openingBal, closingBal, bookingId, refundRef,
               refundReason || `Admin refund for booking #${bookingId}`]
            );
          }
        }
      }

      await connection.query(
        `INSERT INTO booking_audit_logs
         (booking_id, action, performed_by, actor_id, old_status, new_status, notes, created_at)
         VALUES (?, 'REFUNDED', 'ADMIN', ?, 'PAID', 'REFUNDED', ?, ?)`,
        [bookingId, adminId, `Refund of ₹${refundAmount}: ${refundReason}`, refundedAt]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async reassignRider(bookingId, oldRiderId, newRiderId, reason, adminId, reassignedAt) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE bookings 
         SET rider_id = ?,
             assigned_at = NOW(),
             updated_at = ?
         WHERE booking_id = ?`,
        [newRiderId, reassignedAt, bookingId]
      );

      await connection.query(
        `INSERT INTO booking_audit_logs 
         (booking_id, action, performed_by, actor_id, notes, created_at)
         VALUES (?, 'RIDER_REASSIGNED', 'ADMIN', ?, ?, ?)`,
        [bookingId, adminId, `Rider changed from ${oldRiderId} to ${newRiderId}: ${reason}`, reassignedAt]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async manualCompleteBooking(bookingId, finalFare, completionNotes, adminId, completedAt) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const updateFields = ['status = ?', 'updated_at = ?'];
      const params = ['COMPLETED', completedAt];

      if (finalFare !== null && finalFare !== undefined) {
        updateFields.push('total_amount = ?');
        params.push(finalFare);
      }

      params.push(bookingId);

      await connection.query(
        `UPDATE bookings 
         SET ${updateFields.join(', ')}
         WHERE booking_id = ?`,
        params
      );

      const notes = completionNotes || 'Manually completed by admin';
      await connection.query(
        `INSERT INTO booking_audit_logs 
         (booking_id, action, performed_by, actor_id, notes, created_at)
         VALUES (?, 'MANUAL_COMPLETE', 'ADMIN', ?, ?, ?)`,
        [bookingId, adminId, notes, completedAt]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async manualStartBooking(bookingId, adminId, startedAt) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE bookings 
         SET status = 'ACTIVE',
             updated_at = ?
         WHERE booking_id = ?`,
        [startedAt, bookingId]
      );

      await connection.query(
        `INSERT INTO booking_audit_logs 
         (booking_id, action, performed_by, actor_id, notes, created_at)
         VALUES (?, 'MANUAL_START', 'ADMIN', ?, ?, ?)`,
        [bookingId, adminId, 'Booking activated manually by admin', startedAt]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updatePaymentStatus(bookingId, paymentStatus, paymentMethod, transactionId, adminId, updatedAt) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE bookings 
         SET payment_status = ?, updated_at = ?
         WHERE booking_id = ?`,
        [paymentStatus, updatedAt, bookingId]
      );

      const details = transactionId ? `Transaction ID: ${transactionId}` : '';
      await connection.query(
        `INSERT INTO booking_audit_logs 
         (booking_id, action, performed_by, actor_id, notes, created_at)
         VALUES (?, 'PAYMENT_UPDATED', 'ADMIN', ?, ?, ?)`,
        [bookingId, adminId, `Payment status changed to ${paymentStatus}. ${details}`, updatedAt]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateFare(bookingId, oldFare, newFare, reason, adminId, updatedAt) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE bookings 
         SET total_amount = ?,
             updated_at = ?
         WHERE booking_id = ?`,
        [newFare, updatedAt, bookingId]
      );

      await connection.query(
        `INSERT INTO booking_audit_logs 
         (booking_id, action, performed_by, actor_id, notes, created_at)
         VALUES (?, 'FARE_UPDATED', 'ADMIN', ?, ?, ?)`,
        [bookingId, adminId, `Fare changed from ₹${oldFare} to ₹${newFare}: ${reason}`, updatedAt]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateBookingStatus(bookingId, oldStatus, newStatus, reason, adminId, updatedAt) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE bookings 
         SET status = ?,
             updated_at = ?
         WHERE booking_id = ?`,
        [newStatus, updatedAt, bookingId]
      );

      const notes = reason || `Status changed from ${oldStatus} to ${newStatus}`;
      await connection.query(
        `INSERT INTO booking_audit_logs 
         (booking_id, action, performed_by, actor_id, notes, created_at)
         VALUES (?, 'STATUS_UPDATED', 'ADMIN', ?, ?, ?)`,
        [bookingId, adminId, notes, updatedAt]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getRiderStatus(riderId) {
    const [rows] = await db.query(
      'SELECT status, online_status, availability FROM riders WHERE rider_id = ?',
      [riderId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // ==================== ANALYTICS METHODS ====================

  async getRevenueAnalytics(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status = 'COMPLETED' AND DATE(updated_at) = CURDATE() THEN total_amount ELSE 0 END) as today_revenue,
        SUM(CASE WHEN status = 'COMPLETED' AND YEARWEEK(updated_at, 1) = YEARWEEK(CURDATE(), 1) THEN total_amount ELSE 0 END) as week_revenue,
        SUM(CASE WHEN status = 'COMPLETED' AND MONTH(updated_at) = MONTH(CURDATE()) AND YEAR(updated_at) = YEAR(CURDATE()) THEN total_amount ELSE 0 END) as month_revenue,
        SUM(CASE WHEN status = 'COMPLETED' AND YEAR(updated_at) = YEAR(CURDATE()) THEN total_amount ELSE 0 END) as year_revenue,
        AVG(CASE WHEN status = 'COMPLETED' THEN total_amount END) as avg_booking_value,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_bookings,
        COUNT(*) as total_transactions
       FROM bookings
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    return rows[0] || {};
  }

  async getTopCities(startDate, endDate, limit = 10) {
    const [rows] = await db.query(
      `SELECT 
        COALESCE(up.city, 'Unknown') as city,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN b.status = 'COMPLETED' THEN b.total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN b.status = 'COMPLETED' THEN b.total_amount END) as avg_fare,
        0 as avg_distance
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.user_id
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       WHERE b.created_at BETWEEN ? AND ?
       GROUP BY COALESCE(up.city, 'Unknown')
       ORDER BY total_revenue DESC
       LIMIT ?`,
      [startDate, endDate, parseInt(limit)]
    );
    return rows;
  }

  async getTopRiders(startDate, endDate, limit = 10) {
    const [rows] = await db.query(
      `SELECT 
        r.rider_id,
        u.full_name,
        u.phone as phone_number,
        COUNT(b.booking_id) as total_bookings,
        SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN b.status = 'COMPLETED' THEN b.total_amount ELSE 0 END) as total_earnings,
        AVG(CASE WHEN b.status = 'COMPLETED' THEN b.total_amount END) as avg_fare,
        0 as avg_distance,
        SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_trips,
        ROUND((SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END) / NULLIF(COUNT(b.booking_id), 0) * 100), 2) as completion_rate
       FROM riders r
       INNER JOIN bookings b ON r.rider_id = b.rider_id
       LEFT JOIN users u ON r.user_id = u.user_id
       WHERE b.created_at BETWEEN ? AND ?
       GROUP BY r.rider_id, u.full_name, u.phone
       ORDER BY total_earnings DESC
       LIMIT ?`,
      [startDate, endDate, parseInt(limit)]
    );
    return rows;
  }

  async getTopUsers(startDate, endDate, limit = 10) {
    const [rows] = await db.query(
      `SELECT 
        u.user_id,
        u.full_name,
        u.phone as phone_number,
        u.email,
        COUNT(b.booking_id) as total_bookings,
        SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN b.status = 'COMPLETED' THEN b.total_amount ELSE 0 END) as total_spent,
        AVG(CASE WHEN b.status = 'COMPLETED' THEN b.total_amount END) as avg_booking_value,
        SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
        MAX(b.created_at) as last_booking_date
       FROM users u
       INNER JOIN bookings b ON u.user_id = b.user_id
       WHERE b.created_at BETWEEN ? AND ?
       GROUP BY u.user_id, u.full_name, u.phone, u.email
       ORDER BY total_spent DESC
       LIMIT ?`,
      [startDate, endDate, parseInt(limit)]
    );
    return rows;
  }

  async getPeakHours(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END) as revenue,
        AVG(CASE WHEN status = 'COMPLETED' THEN total_amount END) as avg_fare
       FROM bookings
       WHERE created_at BETWEEN ? AND ?
       GROUP BY HOUR(created_at)
       ORDER BY hour ASC`,
      [startDate, endDate]
    );
    return rows;
  }

  async getCancellationReport(startDate, endDate) {
    const [summary] = await db.query(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as total_cancelled,
        ROUND((SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0) * 100), 2) as cancellation_rate
       FROM bookings
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    const [byStatus] = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_count
       FROM bookings
       WHERE created_at BETWEEN ? AND ? AND status = 'CANCELLED'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [startDate, endDate]
    );

    return {
      summary: summary[0] || {},
      daily_cancellations: byStatus
    };
  }

  async getPaymentReport(startDate, endDate) {
    const [summary] = await db.query(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END) as successful_payments,
        0 as failed_payments,
        SUM(CASE WHEN payment_status = 'PENDING' THEN 1 ELSE 0 END) as pending_payments,
        SUM(CASE WHEN payment_status = 'REFUNDED' THEN 1 ELSE 0 END) as refunded_payments,
        SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END) as total_collected,
        SUM(CASE WHEN payment_status = 'REFUNDED' THEN total_amount ELSE 0 END) as total_refunded
       FROM bookings
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    return {
      summary: summary[0] || {},
      by_payment_method: []
    };
  }

  async getDailyReport(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END) as revenue,
        AVG(CASE WHEN status = 'COMPLETED' THEN total_amount END) as avg_fare,
        0 as total_distance,
        0 as avg_distance,
        COUNT(DISTINCT rider_id) as unique_riders,
        COUNT(DISTINCT user_id) as unique_customers
       FROM bookings
       WHERE created_at BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [startDate, endDate]
    );
    return rows;
  }

  async getMonthlyReport(year) {
    const [rows] = await db.query(
      `SELECT 
        MONTH(created_at) as month,
        MONTHNAME(created_at) as month_name,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END) as revenue,
        AVG(CASE WHEN status = 'COMPLETED' THEN total_amount END) as avg_fare,
        0 as total_distance,
        COUNT(DISTINCT rider_id) as unique_riders,
        COUNT(DISTINCT user_id) as unique_customers
       FROM bookings
       WHERE YEAR(created_at) = ?
       GROUP BY MONTH(created_at), MONTHNAME(created_at)
       ORDER BY month ASC`,
      [year]
    );
    return rows;
  }

  async getYearlyReport() {
    const [rows] = await db.query(
      `SELECT 
        YEAR(created_at) as year,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END) as revenue,
        AVG(CASE WHEN status = 'COMPLETED' THEN total_amount END) as avg_fare,
        0 as total_distance,
        COUNT(DISTINCT rider_id) as unique_riders,
        COUNT(DISTINCT user_id) as unique_customers
       FROM bookings
       GROUP BY YEAR(created_at)
       ORDER BY year DESC`
    );
    return rows;
  }

  // ==================== RENTAL BOOKINGS ====================

  async getRentalBookings(filters = {}, pagination = {}) {
    const {
      userId = null,
      vehicleId = null,
      status = null,
      riderId = null,
      startDate = null,
      endDate = null
    } = filters;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (userId)    { conditions.push('b.user_id = ?');    params.push(userId); }
    if (vehicleId) { conditions.push('b.vehicle_id = ?'); params.push(vehicleId); }
    if (riderId)   { conditions.push('(b.rider_id = ? OR b.rider_user_id = ?)'); params.push(riderId, riderId); }
    if (status)    { conditions.push('b.status = ?');     params.push(status); }
    if (startDate) { conditions.push('b.created_at >= ?');params.push(startDate); }
    if (endDate)   { conditions.push('b.created_at <= ?');params.push(endDate); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM bookings b ${whereClause}`, params
    );
    const total = countResult[0].total;

    const [rows] = await db.query(
      `SELECT b.*,
              v.model_name, v.registration_number, v.vehicle_type, v.image_url,
              u.full_name as user_name, u.phone as user_phone, u.email as user_email
       FROM bookings b
       LEFT JOIN vehicles v ON b.vehicle_id = v.vehicle_id
       LEFT JOIN users u ON b.user_id = u.user_id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      bookings: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  async getRentalBookingById(bookingId) {
    const [rows] = await db.query(
      `SELECT b.*,
              v.model_name, v.registration_number, v.vehicle_type, v.image_url,
              u.full_name as user_name, u.phone as user_phone, u.email as user_email
       FROM bookings b
       LEFT JOIN vehicles v ON b.vehicle_id = v.vehicle_id
       LEFT JOIN users u ON b.user_id = u.user_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getRentalBookingStatistics() {
    const [rows] = await db.query(
      `SELECT
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'ACTIVE'    THEN 1 ELSE 0 END) as active_bookings,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN status = 'PENDING'   THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN status = 'COMPLETED' THEN total_amount END) as avg_booking_value,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_bookings
       FROM bookings`
    );
    return rows[0] || {};
  }
}

module.exports = new BookingRepository();
