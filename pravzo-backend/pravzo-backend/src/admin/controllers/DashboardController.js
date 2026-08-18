const DashboardService = require('../services/DashboardService');
const { successResponse, errorResponse } = require('../../../src/utils/response');
const logger = require('../../../src/utils/logger');

class DashboardController {
  // GET /dashboard/stats
  async getStats(req, res) {
    try {
      const stats = await DashboardService.getStats();
      return successResponse(res, 200, 'Dashboard stats retrieved successfully', { stats });
    } catch (error) {
      logger.error('Dashboard Stats Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // GET /dashboard/revenue
  async getRevenue(req, res) {
    try {
      const revenue = await DashboardService.getRevenue();
      return successResponse(res, 200, 'Revenue data retrieved successfully', { revenue });
    } catch (error) {
      logger.error('Dashboard Revenue Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // GET /dashboard/bookings
  async getBookings(req, res) {
    try {
      const bookings = await DashboardService.getBookings();
      return successResponse(res, 200, 'Booking stats retrieved successfully', { bookings });
    } catch (error) {
      logger.error('Dashboard Bookings Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // GET /dashboard/vehicles
  async getVehicles(req, res) {
    try {
      const vehicles = await DashboardService.getVehicles();
      return successResponse(res, 200, 'Vehicle stats retrieved successfully', { vehicles });
    } catch (error) {
      logger.error('Dashboard Vehicles Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // GET /dashboard/support
  async getSupport(req, res) {
    try {
      const support = await DashboardService.getSupport();
      return successResponse(res, 200, 'Support stats retrieved successfully', { support });
    } catch (error) {
      logger.error('Dashboard Support Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // GET /dashboard/system-alerts
  async getSystemAlerts(req, res) {
    try {
      const alerts = await DashboardService.getSystemAlerts();
      return successResponse(res, 200, 'System alerts retrieved successfully', { alerts });
    } catch (error) {
      logger.error('Dashboard System Alerts Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // GET /dashboard/charts
  async getCharts(req, res) {
    try {
      const { period } = req.query;
      const charts = await DashboardService.getCharts(period);
      return successResponse(res, 200, 'Chart data retrieved successfully', { charts });
    } catch (error) {
      logger.error('Dashboard Charts Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // GET /dashboard/analytics
  async getAnalytics(req, res) {
    try {
      const analytics = await DashboardService.getAnalytics();
      return successResponse(res, 200, 'Analytics retrieved successfully', { analytics });
    } catch (error) {
      logger.error('Dashboard Analytics Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // GET /dashboard/recent-activities
  async getRecentActivities(req, res) {
    try {
      const { limit } = req.query;
      const activities = await DashboardService.getRecentActivities(limit);
      return successResponse(res, 200, 'Recent activities retrieved successfully', { activities });
    } catch (error) {
      logger.error('Dashboard Recent Activities Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // GET /dashboard/overview
  async getOverview(req, res) {
    try {
      // Get all dashboard data in one call
      const [stats, revenue, bookings, vehicles, alerts, activities] = await Promise.all([
        DashboardService.getStats(),
        DashboardService.getRevenue(),
        DashboardService.getBookings(),
        DashboardService.getVehicles(),
        DashboardService.getSystemAlerts(),
        DashboardService.getRecentActivities(5)
      ]);

      return successResponse(res, 200, 'Dashboard overview retrieved successfully', {
        // ─── Flat fields expected by SuperAdminDashboard.jsx ───────────────
        total_users:     stats.totalUsers     || 0,
        total_bookings:  stats.totalBookings  || 0,
        total_revenue:   stats.totalRevenue   || 0,
        active_vehicles: stats.activeVehicles || 0,
        total_payouts:   stats.totalPayouts   || 0,
        active_branches: stats.activeBranches || 0,
        // ─── Full nested data for advanced dashboard usage ─────────────────
        stats,
        revenue,
        bookings,
        vehicles,
        alerts,
        recentActivities: activities
      });
    } catch (error) {
      logger.error('Dashboard Overview Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }
}

module.exports = new DashboardController();

