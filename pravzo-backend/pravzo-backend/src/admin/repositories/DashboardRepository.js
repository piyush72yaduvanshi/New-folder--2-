'use strict';

const db = require('../../../src/config/db');

class DashboardRepository {

  // ==================== STATS QUERIES ====================

  async getTotalUsers() {
    try {
      const [rows] = await db.query(
        "SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL AND status != 'DELETED'"
      );
      return rows[0].total;
    } catch { return 0; }
  }

  async getTotalRiders() {
    try {
      const [rows] = await db.query('SELECT COUNT(*) as total FROM riders WHERE deleted_at IS NULL');
      return rows[0].total;
    } catch { return 0; }
  }

  async getTotalBookings() {
    try {
      const [rows] = await db.query('SELECT COUNT(*) as total FROM bookings');
      return rows[0].total;
    } catch { return 0; }
  }

  async getActiveVehicles() {
    try {
      const [rows] = await db.query("SELECT COUNT(*) as total FROM vehicles WHERE status = 'AVAILABLE' AND deleted_at IS NULL");
      return rows[0].total;
    } catch { return 0; }
  }

  async getTotalRevenue() {
    try {
      const [paymentRows] = await db.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid'"
      );
      const [bookingRows] = await db.query(
        "SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE payment_status = 'PAID' AND booking_id NOT IN (SELECT COALESCE(booking_id, 0) FROM payments WHERE status = 'paid')"
      );
      return parseFloat(paymentRows[0].total) + parseFloat(bookingRows[0].total);
    } catch { return 0; }
  }

  async getPendingKYC() {
    try {
      const [rows] = await db.query("SELECT COUNT(*) as total FROM kyc WHERE status IN ('PENDING','UNDER_REVIEW','REVERIFY_REQUIRED')");
      return rows[0].total;
    } catch { return 0; }
  }

  // ==================== REVENUE QUERIES ====================

  async getRevenueByPeriod(startDate, endDate) {
    try {
      const [rows] = await db.query(
        `SELECT
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(*) as bookings
         FROM bookings
         WHERE payment_status = 'PAID'
         AND created_at BETWEEN ? AND ?`,
        [startDate, endDate]
      );
      return {
        revenue: parseFloat(rows[0].revenue),
        bookings: parseInt(rows[0].bookings)
      };
    } catch { return { revenue: 0, bookings: 0 }; }
  }

  async getRevenueByPaymentMethod() {
    try {
      const [rows] = await db.query(
        `SELECT
          method as payment_method,
          COALESCE(SUM(amount), 0) as revenue,
          COUNT(*) as count
         FROM payments
         WHERE status = 'paid'
         GROUP BY method`
      );
      return rows.map(r => ({
        method: r.payment_method || 'CASH',
        revenue: parseFloat(r.revenue),
        count: r.count
      }));
    } catch { return []; }
  }

  async getRevenueChart(days = 7) {
    try {
      const [rows] = await db.query(
        `SELECT
          DATE(created_at) as date,
          COALESCE(SUM(total_amount), 0) as revenue
         FROM bookings
         WHERE payment_status = 'PAID'
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [days]
      );
      return rows.map(r => ({ date: r.date, revenue: parseFloat(r.revenue) }));
    } catch { return []; }
  }

  // ==================== BOOKING QUERIES ====================

  async getBookingsByPeriod(startDate, endDate) {
    try {
      const [rows] = await db.query(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'COMPLETED'  THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'CANCELLED'  THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN status = 'ACTIVE'     THEN 1 ELSE 0 END) as ongoing,
          SUM(CASE WHEN status = 'PENDING'    THEN 1 ELSE 0 END) as upcoming,
          COALESCE(AVG(total_amount), 0) as avg_amount
         FROM bookings
         WHERE created_at BETWEEN ? AND ?`,
        [startDate, endDate]
      );
      return {
        total:     parseInt(rows[0].total),
        completed: parseInt(rows[0].completed),
        cancelled: parseInt(rows[0].cancelled),
        ongoing:   parseInt(rows[0].ongoing),
        upcoming:  parseInt(rows[0].upcoming),
        avgAmount: parseFloat(rows[0].avg_amount)
      };
    } catch { return { total:0, completed:0, cancelled:0, ongoing:0, upcoming:0, avgAmount:0 }; }
  }

  async getPeakBookingHour() {
    try {
      const [rows] = await db.query(
        `SELECT HOUR(created_at) as hour, COUNT(*) as count
         FROM bookings
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY HOUR(created_at)
         ORDER BY count DESC LIMIT 1`
      );
      return rows[0] ? { hour: rows[0].hour, count: rows[0].count } : { hour: 0, count: 0 };
    } catch { return { hour: 0, count: 0 }; }
  }

  async getBookingGrowth() {
    try {
      const [rows] = await db.query(
        `SELECT
          COUNT(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as current_week,
          COUNT(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
                      AND created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as previous_week
         FROM bookings`
      );
      const curr = rows[0].current_week;
      const prev = rows[0].previous_week;
      return parseFloat(prev > 0 ? ((curr - prev) / prev * 100).toFixed(2) : 0);
    } catch { return 0; }
  }

  // ==================== VEHICLE QUERIES ====================

  async getVehicleStats() {
    try {
      const [rows] = await db.query(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'AVAILABLE'   THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status = 'RENTED'      THEN 1 ELSE 0 END) as in_ride,
          SUM(CASE WHEN status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance,
          SUM(CASE WHEN status = 'CHARGING'    THEN 1 ELSE 0 END) as charging,
          SUM(CASE WHEN status = 'OFFLINE'     THEN 1 ELSE 0 END) as offline,
          SUM(CASE WHEN status = 'BLOCKED'     THEN 1 ELSE 0 END) as blocked
         FROM vehicles WHERE deleted_at IS NULL`
      );
      const t = rows[0].total || 0;
      return {
        total:             t,
        available:         parseInt(rows[0].available),
        inRide:            parseInt(rows[0].in_ride),
        maintenance:       parseInt(rows[0].maintenance),
        charging:          parseInt(rows[0].charging),
        offline:           parseInt(rows[0].offline),
        blocked:           parseInt(rows[0].blocked),
        availabilityPercent: t > 0 ? parseFloat(((rows[0].available / t)*100).toFixed(2)) : 0
      };
    } catch { return { total:0, available:0, inRide:0, maintenance:0, charging:0, offline:0, blocked:0, availabilityPercent:0 }; }
  }

  // ==================== SUPPORT QUERIES ====================

  async getSupportStats() {
    return { open:0, closed:0, pending:0, highPriority:0, critical:0, avgResolutionTime:0 };
  }

  async getRecentTickets(limit = 5) { return []; }

  // ==================== SYSTEM ALERTS ====================

  async getSystemAlerts() {
    try {
      const [[kycR]]    = await db.query("SELECT COUNT(*) as c FROM kyc WHERE status IN ('PENDING','UNDER_REVIEW','REVERIFY_REQUIRED')");
      const [[blockedR]]= await db.query("SELECT COUNT(*) as c FROM riders WHERE status = 'SUSPENDED' AND deleted_at IS NULL");
      const [[lowBatR]] = await db.query("SELECT COUNT(*) as c FROM vehicles WHERE battery_level < 20 AND battery_level IS NOT NULL AND deleted_at IS NULL");
      return {
        pendingKYC:          kycR.c,
        lowBatteryVehicles:  lowBatR.c,
        sosRequests:         0,
        pendingInspections:  0,
        blockedRiders:       blockedR.c,
        fraudAlerts:         0
      };
    } catch { return { pendingKYC:0, lowBatteryVehicles:0, sosRequests:0, pendingInspections:0, blockedRiders:0, fraudAlerts:0 }; }
  }

  async getRecentAlerts(limit = 10) {
    try {
      const [rows] = await db.query(
        `(SELECT 'KYC_PENDING' as type, k.user_id as ref_id,
            CONCAT('KYC pending: ', u.full_name) as description, k.created_at
          FROM kyc k
          JOIN users u ON k.user_id = u.user_id
          WHERE k.status IN ('PENDING','UNDER_REVIEW','REVERIFY_REQUIRED') AND u.deleted_at IS NULL
          ORDER BY k.created_at DESC LIMIT ?)
         UNION ALL
         (SELECT 'USER_BLOCKED', user_id, CONCAT('User blocked: ', full_name), updated_at
          FROM users WHERE status = 'BLOCKED' AND deleted_at IS NULL
          ORDER BY updated_at DESC LIMIT ?)
         ORDER BY created_at DESC LIMIT ?`,
        [limit, limit, limit]
      );
      return rows;
    } catch { return []; }
  }

  // ==================== ANALYTICS QUERIES ====================

  async getUserGrowthChart(days = 30) {
    try {
      const [rows] = await db.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND deleted_at IS NULL
         GROUP BY DATE(created_at) ORDER BY date ASC`,
        [days]
      );
      return rows;
    } catch { return []; }
  }

  async getRiderGrowthChart(days = 30) {
    try {
      const [rows] = await db.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM riders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND deleted_at IS NULL
         GROUP BY DATE(created_at) ORDER BY date ASC`,
        [days]
      );
      return rows;
    } catch { return []; }
  }

  async getTopCities(limit = 5) {
    try {
      const [rows] = await db.query(
        `SELECT assigned_city as city, COUNT(*) as count
         FROM riders WHERE assigned_city IS NOT NULL AND deleted_at IS NULL
         GROUP BY assigned_city ORDER BY count DESC LIMIT ?`,
        [limit]
      );
      return rows;
    } catch { return []; }
  }

  async getTopRiders(limit = 10) {
    try {
      const [rows] = await db.query(
        `SELECT r.rider_id, u.full_name, u.phone as phone_number,
            r.completed_trips as total_bookings,
            r.total_earnings as total_revenue
         FROM riders r
         JOIN users u ON r.user_id = u.user_id
         WHERE r.deleted_at IS NULL
         ORDER BY r.completed_trips DESC LIMIT ?`,
        [limit]
      );
      return rows.map(r => ({
        userId: r.rider_id,
        fullName: r.full_name,
        phoneNumber: r.phone_number,
        totalBookings: r.total_bookings,
        totalRevenue: parseFloat(r.total_revenue)
      }));
    } catch { return []; }
  }

  async getTopVehicles(limit = 10) {
    try {
      const [rows] = await db.query(
        `SELECT v.vehicle_id, v.model_name, v.registration_number,
            COUNT(b.booking_id) as total_bookings,
            COALESCE(SUM(b.total_amount), 0) as total_revenue
         FROM vehicles v
         LEFT JOIN bookings b ON v.vehicle_id = b.vehicle_id AND b.status = 'COMPLETED'
         WHERE v.deleted_at IS NULL
         GROUP BY v.vehicle_id, v.model_name, v.registration_number
         ORDER BY total_bookings DESC LIMIT ?`,
        [limit]
      );
      return rows.map(r => ({
        vehicleId: r.vehicle_id,
        modelName: r.model_name,
        registrationNumber: r.registration_number,
        totalBookings: r.total_bookings,
        totalRevenue: parseFloat(r.total_revenue)
      }));
    } catch { return []; }
  }

  // ==================== BRANCHES & SETTLEMENTS ====================

  async getActiveBranches() {
    try {
      const [rows] = await db.query(
        "SELECT COUNT(*) as total FROM branches WHERE branch_status = 'ACTIVE' AND deleted_at IS NULL"
      );
      return parseInt(rows[0].total) || 0;
    } catch { return 0; }
  }

  async getTotalPayouts() {
    try {
      const [rows] = await db.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM payouts WHERE status IN ('PAID','COMPLETED','SUCCESS')"
      );
      return parseFloat(rows[0].total) || 0;
    } catch { return 0; }
  }

  // ==================== RECENT ACTIVITIES ====================

  async getRecentActivities(limit = 10) {
    try {
      const lim = parseInt(limit);
      const [rows] = await db.query(
        `(SELECT 'USER_REGISTERED' as activity_type, user_id as ref_id,
            CONCAT('New user: ', full_name) as description, created_at
          FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ?)
         UNION ALL
         (SELECT 'RIDER_REGISTERED', r.rider_id, CONCAT('New rider: ', u.full_name), r.created_at
          FROM riders r JOIN users u ON r.user_id = u.user_id WHERE r.deleted_at IS NULL ORDER BY r.created_at DESC LIMIT ?)
         UNION ALL
         (SELECT 'BOOKING_COMPLETED', booking_id, CONCAT('Booking completed #', booking_number), updated_at
          FROM bookings WHERE status = 'COMPLETED' ORDER BY updated_at DESC LIMIT ?)
         UNION ALL
         (SELECT 'VEHICLE_ADDED', vehicle_id, CONCAT('Vehicle added: ', model_name), created_at
          FROM vehicles WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ?)
         ORDER BY created_at DESC LIMIT ?`,
        [lim, lim, lim, lim, lim]
      );
      return rows;
    } catch { return []; }
  }
}

module.exports = new DashboardRepository();
