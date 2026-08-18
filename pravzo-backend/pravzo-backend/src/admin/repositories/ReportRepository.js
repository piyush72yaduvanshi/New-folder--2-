'use strict';

const db = require('../../../src/config/db');

class ReportRepository {
  // ==================== REVENUE REPORTS ====================

  async getRevenueReport(startDate, endDate, filters = {}) {
    const { paymentMethod } = filters;
    const conditions = ['p.status = "paid"'];
    const params = [];

    if (startDate && endDate) {
      conditions.push('p.created_at BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    if (paymentMethod) {
      conditions.push('p.method = ?');
      params.push(paymentMethod);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(p.amount) as total_revenue,
        AVG(p.amount) as average_revenue,
        NULL as total_commission,
        NULL as total_rider_earnings,
        NULL as total_taxes,
        NULL as total_gateway_charges,
        SUM(CASE WHEN p.method = 'cash' THEN p.amount ELSE 0 END) as cash_revenue,
        SUM(CASE WHEN p.method = 'card' THEN p.amount ELSE 0 END) as card_revenue,
        SUM(CASE WHEN p.method = 'upi' THEN p.amount ELSE 0 END) as upi_revenue,
        SUM(CASE WHEN p.method = 'wallet' THEN p.amount ELSE 0 END) as wallet_revenue,
        SUM(CASE WHEN p.method = 'netbanking' THEN p.amount ELSE 0 END) as net_banking_revenue
      FROM payments p
      ${whereClause}`,
      params
    );

    return rows[0] || {};
  }

  async getRevenueTrend(startDate, endDate, groupBy = 'day') {
    let dateFormat;
    switch (groupBy) {
      case 'hour':  dateFormat = '%Y-%m-%d %H:00:00'; break;
      case 'day':   dateFormat = '%Y-%m-%d'; break;
      case 'week':  dateFormat = '%Y-%u'; break;
      case 'month': dateFormat = '%Y-%m'; break;
      case 'year':  dateFormat = '%Y'; break;
      default:      dateFormat = '%Y-%m-%d';
    }

    const [rows] = await db.query(
      `SELECT 
        DATE_FORMAT(created_at, ?) as period,
        COUNT(*) as transactions,
        SUM(amount) as revenue,
        AVG(amount) as avg_revenue,
        NULL as commission
      FROM payments
      WHERE status = 'paid'
      AND created_at BETWEEN ? AND ?
      GROUP BY period
      ORDER BY period ASC`,
      [dateFormat, startDate, endDate]
    );

    return rows;
  }

  async getRevenueByCity(startDate, endDate, limit = 10) {
    const [rows] = await db.query(
      `SELECT 
        up.city,
        COUNT(*) as bookings,
        SUM(p.amount) as revenue,
        AVG(p.amount) as avg_revenue,
        NULL as commission
      FROM payments p
      INNER JOIN users u ON p.user_id = u.user_id
      INNER JOIN user_profiles up ON u.user_id = up.user_id
      WHERE p.status = 'paid'
      AND up.city IS NOT NULL
      AND p.created_at BETWEEN ? AND ?
      GROUP BY up.city
      ORDER BY revenue DESC
      LIMIT ?`,
      [startDate, endDate, parseInt(limit)]
    );

    return rows;
  }

  async getRevenueByVehicleType(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT 
        v.vehicle_type,
        COUNT(DISTINCT p.payment_id) as bookings,
        SUM(p.amount) as revenue,
        AVG(p.amount) as avg_revenue
      FROM payments p
      INNER JOIN bookings b ON p.booking_id = b.booking_id
      INNER JOIN vehicles v ON b.vehicle_id = v.vehicle_id
      WHERE p.status = 'paid'
      AND p.created_at BETWEEN ? AND ?
      GROUP BY v.vehicle_type
      ORDER BY revenue DESC`,
      [startDate, endDate]
    );

    return rows;
  }

  // ==================== BOOKING REPORTS ====================

  async getBookingReport(startDate, endDate, filters = {}) {
    const { status } = filters;
    const conditions = [];
    const params = [];

    if (startDate && endDate) {
      conditions.push('b.created_at BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    if (status) {
      conditions.push('b.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN b.status = 'ACTIVE'    THEN 1 ELSE 0 END) as active_bookings,
        SUM(CASE WHEN b.status = 'PENDING'   THEN 1 ELSE 0 END) as pending_bookings,
        SUM(b.total_amount) as total_booking_value,
        AVG(b.total_amount) as average_booking_value
      FROM bookings b
      ${whereClause}`,
      params
    );

    return rows[0] || {};
  }

  async getBookingStatusBreakdown(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM bookings WHERE created_at BETWEEN ? AND ?)) * 100, 2) as percentage
      FROM bookings
      WHERE created_at BETWEEN ? AND ?
      GROUP BY status`,
      [startDate, endDate, startDate, endDate]
    );

    return rows;
  }

  async getBookingHourlyTrend(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as count
      FROM bookings
      WHERE created_at BETWEEN ? AND ?
      GROUP BY hour
      ORDER BY hour ASC`,
      [startDate, endDate]
    );

    return rows;
  }

  async getBookingTrend(startDate, endDate, groupBy = 'day') {
    let dateFormat;
    switch (groupBy) {
      case 'hour':  dateFormat = '%Y-%m-%d %H:00:00'; break;
      case 'day':   dateFormat = '%Y-%m-%d'; break;
      case 'week':  dateFormat = '%Y-%u'; break;
      case 'month': dateFormat = '%Y-%m'; break;
      case 'year':  dateFormat = '%Y'; break;
      default:      dateFormat = '%Y-%m-%d';
    }

    const [rows] = await db.query(
      `SELECT 
        DATE_FORMAT(created_at, ?) as period,
        COUNT(*) as bookings,
        SUM(total_amount) as total_amount
      FROM bookings
      WHERE created_at BETWEEN ? AND ?
      GROUP BY period
      ORDER BY period ASC`,
      [dateFormat, startDate, endDate]
    );

    return rows;
  }

  async getPeakBookingHours(startDate, endDate) {
    return this.getBookingHourlyTrend(startDate, endDate);
  }

  // ==================== USER REPORTS ====================

  async getUserReport(startDate, endDate, filters = {}) {
    const { status } = filters;
    const conditions = ['u.deleted_at IS NULL'];
    const params = [];

    if (startDate && endDate) {
      conditions.push('u.created_at BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    if (status) {
      conditions.push('u.status = ?');
      params.push(status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN u.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN u.status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive_users,
        SUM(CASE WHEN u.status = 'BLOCKED' THEN 1 ELSE 0 END) as blocked_users
      FROM users u
      ${whereClause}`,
      params
    );

    return rows[0] || {};
  }

  async getUserGrowth(startDate, endDate, groupBy = 'day') {
    let dateFormat;
    switch (groupBy) {
      case 'day':   dateFormat = '%Y-%m-%d'; break;
      case 'week':  dateFormat = '%Y-%u'; break;
      case 'month': dateFormat = '%Y-%m'; break;
      case 'year':  dateFormat = '%Y'; break;
      default:      dateFormat = '%Y-%m-%d';
    }

    const [rows] = await db.query(
      `SELECT 
        DATE_FORMAT(created_at, ?) as period,
        COUNT(*) as new_users
      FROM users
      WHERE deleted_at IS NULL
      AND created_at BETWEEN ? AND ?
      GROUP BY period
      ORDER BY period ASC`,
      [dateFormat, startDate, endDate]
    );

    return rows;
  }

  async getUserGrowthTrend(startDate, endDate, groupBy = 'day') {
    return this.getUserGrowth(startDate, endDate, groupBy);
  }

  async getUserCityDistribution() {
    const [rows] = await db.query(
      `SELECT 
        COALESCE(up.city, 'Unknown') as city,
        COUNT(*) as user_count
      FROM users u
      LEFT JOIN user_profiles up ON u.user_id = up.user_id
      WHERE u.deleted_at IS NULL
      GROUP BY up.city
      ORDER BY user_count DESC`
    );

    return rows;
  }

  async getUsersByCity(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT 
        COALESCE(up.city, 'Unknown') as city,
        COUNT(*) as user_count
      FROM users u
      LEFT JOIN user_profiles up ON u.user_id = up.user_id
      WHERE u.deleted_at IS NULL
      AND u.created_at BETWEEN ? AND ?
      GROUP BY up.city
      ORDER BY user_count DESC`,
      [startDate, endDate]
    );

    return rows;
  }

  // ==================== RIDER REPORTS ====================

  async getRiderReport(startDate, endDate, filters = {}) {
    const { status, city } = filters;
    const conditions = ['r.deleted_at IS NULL'];
    const params = [];

    if (startDate && endDate) {
      conditions.push('r.created_at BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }

    if (city) {
      conditions.push('r.assigned_city = ?');
      params.push(city);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_riders,
        SUM(CASE WHEN r.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_riders,
        SUM(CASE WHEN r.status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive_riders,
        SUM(CASE WHEN r.status = 'SUSPENDED' THEN 1 ELSE 0 END) as blocked_riders,
        AVG(r.completed_trips) as avg_completed_trips,
        AVG(r.rating) as avg_rating
      FROM riders r
      ${whereClause}`,
      params
    );

    return rows[0] || {};
  }

  async getRiderPerformance(startDate, endDate, limit = 20) {
    const [rows] = await db.query(
      `SELECT 
        r.rider_id,
        u.full_name as rider_name,
        u.phone as phone_number,
        r.rider_code,
        r.completed_trips as total_trips,
        r.cancelled_trips,
        r.total_earnings,
        r.rating as average_rating
      FROM riders r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.deleted_at IS NULL
      ORDER BY r.completed_trips DESC
      LIMIT ?`,
      [parseInt(limit)]
    );

    return rows;
  }

  async getRiderEarnings(startDate, endDate, groupBy = 'day') {
    let dateFormat;
    switch (groupBy) {
      case 'day':   dateFormat = '%Y-%m-%d'; break;
      case 'week':  dateFormat = '%Y-%u'; break;
      case 'month': dateFormat = '%Y-%m'; break;
      case 'year':  dateFormat = '%Y'; break;
      default:      dateFormat = '%Y-%m-%d';
    }

    const [rows] = await db.query(
      `SELECT 
        DATE_FORMAT(created_at, ?) as period,
        COUNT(trip_id) as total_trips,
        SUM(fare_amount) as total_earnings,
        AVG(fare_amount) as avg_earning
      FROM rider_trips
      WHERE status = 'COMPLETED'
      AND created_at BETWEEN ? AND ?
      GROUP BY period
      ORDER BY period ASC`,
      [dateFormat, startDate, endDate]
    );

    return rows;
  }

  // ==================== VEHICLE REPORTS ====================

  async getVehicleReport(startDate, endDate, filters = {}) {
    const { status, vehicleType } = filters;
    const conditions = ['v.deleted_at IS NULL'];
    const params = [];

    if (status) {
      conditions.push('v.status = ?');
      params.push(status);
    }

    if (vehicleType) {
      conditions.push('v.vehicle_type = ?');
      params.push(vehicleType);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN v.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN v.status = 'RENTED' THEN 1 ELSE 0 END) as in_ride,
        SUM(CASE WHEN v.status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance,
        SUM(CASE WHEN v.status = 'CHARGING' THEN 1 ELSE 0 END) as charging,
        SUM(CASE WHEN v.status = 'OFFLINE' THEN 1 ELSE 0 END) as offline,
        SUM(CASE WHEN v.status = 'BLOCKED' THEN 1 ELSE 0 END) as blocked,
        AVG(v.battery_level) as average_battery_level
      FROM vehicles v
      ${whereClause}`,
      params
    );

    return rows[0] || {};
  }

  async getVehicleUtilization(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT 
        v.vehicle_id,
        v.registration_number,
        v.model_name as vehicle_model,
        COUNT(b.booking_id) as trip_count,
        SUM(b.total_amount) as total_revenue
      FROM vehicles v
      LEFT JOIN bookings b ON v.vehicle_id = b.vehicle_id AND b.status = 'COMPLETED' AND b.created_at BETWEEN ? AND ?
      WHERE v.deleted_at IS NULL
      GROUP BY v.vehicle_id
      ORDER BY trip_count DESC
      LIMIT 20`,
      [startDate, endDate]
    );

    return rows;
  }

  async getVehicleStatusDistribution() {
    const [rows] = await db.query(
      `SELECT 
        status,
        COUNT(*) as count
      FROM vehicles
      WHERE deleted_at IS NULL
      GROUP BY status`
    );

    return rows;
  }

  // ==================== PAYMENT REPORTS ====================

  async getPaymentReport(startDate, endDate, filters = {}) {
    const { status, paymentMethod } = filters;
    const conditions = [];
    const params = [];

    if (startDate && endDate) {
      conditions.push('p.created_at BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status.toLowerCase());
    }

    if (paymentMethod) {
      conditions.push('p.method = ?');
      params.push(paymentMethod);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN p.status = 'paid' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN p.status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN p.status = 'created' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN p.status = 'refunded' THEN 1 ELSE 0 END) as refunded,
        SUM(p.amount) as fare_amount,
        NULL as total_refunds,
        NULL as wallet_usage,
        NULL as total_commission,
        AVG(p.amount) as avg_transaction,
        ROUND((SUM(CASE WHEN p.status = 'paid' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as success_rate
      FROM payments p
      ${whereClause}`,
      params
    );

    return rows[0] || {};
  }

  async getPaymentMethodDistribution(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT 
        COALESCE(method, 'other') as payment_method,
        COUNT(*) as transaction_count,
        SUM(amount) as fare_amount,
        AVG(amount) as avg_amount,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM payments WHERE created_at BETWEEN ? AND ?)) * 100, 2) as percentage
      FROM payments
      WHERE created_at BETWEEN ? AND ?
      GROUP BY method
      ORDER BY fare_amount DESC`,
      [startDate, endDate, startDate, endDate]
    );

    return rows;
  }

  // ==================== SUPPORT REPORTS ====================

  async getSupportReport(startDate, endDate, filters = {}) {
    return {
      total_tickets: 0,
      open_tickets: 0,
      in_progress_tickets: 0,
      resolved_tickets: 0,
      closed_tickets: 0,
      pending_tickets: 0,
      avg_resolution_time_hours: 0
    };
  }

  async getSupportCategoryBreakdown(startDate, endDate) {
    return [];
  }

  // ==================== KYC REPORTS ====================

  async getKYCReport(startDate, endDate, filters = {}) {
    const { status } = filters;
    const conditions = [];
    const params = [];

    if (startDate && endDate) {
      conditions.push('k.created_at BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    if (status) {
      conditions.push('k.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_applications,
        SUM(CASE WHEN k.status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN k.status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN k.status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN k.status = 'UNDER_REVIEW' THEN 1 ELSE 0 END) as under_review,
        NULL as avg_verification_time_hours,
        ROUND((SUM(CASE WHEN k.status = 'APPROVED' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as approval_rate
      FROM kyc k
      ${whereClause}`,
      params
    );

    return rows[0] || {};
  }

  // ==================== DASHBOARD ANALYTICS ====================

  async getDashboardAnalytics(startDate, endDate) {
    const [revenue] = await db.query(
      `SELECT 
        COUNT(*) as transactions,
        SUM(amount) as total_revenue,
        NULL as commission
      FROM payments
      WHERE status = 'paid'
      AND created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    const [bookings] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
      FROM bookings
      WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    const [users] = await db.query(
      `SELECT 
        COUNT(*) as new_users,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active
      FROM users
      WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    const [riders] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN availability = 'AVAILABLE' THEN 1 ELSE 0 END) as online
      FROM riders
      WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    return {
      revenue: revenue[0] || { transactions: 0, total_revenue: 0 },
      bookings: bookings[0] || { total: 0, completed: 0, cancelled: 0 },
      users: users[0] || { new_users: 0, active: 0 },
      riders: riders[0] || { total: 0, online: 0 }
    };
  }

  // ==================== TOP LISTS ====================

  async getTopUsers(startDate, endDate, limit = 10) {
    const [rows] = await db.query(
      `SELECT 
        u.user_id,
        u.full_name,
        u.phone as phone_number,
        u.email,
        COUNT(b.booking_id) as total_bookings,
        SUM(p.amount) as total_spent,
        AVG(p.amount) as avg_spent
      FROM users u
      INNER JOIN payments p ON u.user_id = p.user_id
      LEFT JOIN bookings b ON p.booking_id = b.booking_id
      WHERE p.status = 'paid'
      AND p.created_at BETWEEN ? AND ?
      GROUP BY u.user_id, u.full_name, u.phone, u.email
      ORDER BY total_spent DESC
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
        r.rider_code,
        u.phone as phone_number,
        r.completed_trips as total_trips,
        r.completed_trips,
        r.total_earnings,
        r.rating as average_rating
      FROM riders r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.deleted_at IS NULL
      ORDER BY r.total_earnings DESC
      LIMIT ?`,
      [parseInt(limit)]
    );

    return rows;
  }

  async getTopCities(startDate, endDate, limit = 10) {
    const [rows] = await db.query(
      `SELECT 
        up.city,
        COUNT(p.payment_id) as bookings,
        SUM(p.amount) as revenue,
        AVG(p.amount) as avg_revenue,
        NULL as commission
      FROM payments p
      INNER JOIN users u ON p.user_id = u.user_id
      INNER JOIN user_profiles up ON u.user_id = up.user_id
      WHERE p.status = 'paid'
      AND up.city IS NOT NULL
      AND p.created_at BETWEEN ? AND ?
      GROUP BY up.city
      ORDER BY revenue DESC
      LIMIT ?`,
      [startDate, endDate, parseInt(limit)]
    );

    return rows;
  }

  async getTopVehicles(startDate, endDate, limit = 10) {
    const [rows] = await db.query(
      `SELECT 
        v.vehicle_id,
        v.registration_number,
        v.vehicle_type,
        v.model_name as vehicle_model,
        COUNT(b.booking_id) as trip_count,
        SUM(b.total_amount) as total_revenue
      FROM vehicles v
      LEFT JOIN bookings b ON v.vehicle_id = b.vehicle_id AND b.status = 'COMPLETED' AND b.created_at BETWEEN ? AND ?
      WHERE v.deleted_at IS NULL
      GROUP BY v.vehicle_id
      ORDER BY total_revenue DESC
      LIMIT ?`,
      [startDate, endDate, parseInt(limit)]
    );

    return rows;
  }
}

module.exports = new ReportRepository();
