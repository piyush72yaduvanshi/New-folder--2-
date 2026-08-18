const DashboardRepository = require('../repositories/DashboardRepository');
const { formatMySQLDate } = require('../../../src/utils/helpers');

class DashboardService {
  // ==================== STATS SERVICE ====================
  
  async getStats() {
    // Use Promise.all for parallel queries
    const [
      totalUsers,
      totalRiders,
      totalBookings,
      activeVehicles,
      totalRevenue,
      pendingKYC,
      activeBranches,
      totalPayouts
    ] = await Promise.all([
      DashboardRepository.getTotalUsers(),
      DashboardRepository.getTotalRiders(),
      DashboardRepository.getTotalBookings(),
      DashboardRepository.getActiveVehicles(),
      DashboardRepository.getTotalRevenue(),
      DashboardRepository.getPendingKYC(),
      DashboardRepository.getActiveBranches(),
      DashboardRepository.getTotalPayouts()
    ]);

    return {
      totalUsers,
      totalRiders,
      totalBookings,
      activeVehicles,
      totalRevenue,
      pendingKYC,
      activeBranches,
      totalPayouts,
      openSupportTickets: 0,
      activeSOS: 0,
      pendingInspections: 0
    };
  }

  // ==================== REVENUE SERVICE ====================

  async getRevenue() {
    const today = formatMySQLDate(new Date()).slice(0, 10);
    const now = formatMySQLDate(new Date());
    
    // Calculate date ranges
    const todayStart = `${today} 00:00:00`;
    const todayEnd = `${today} 23:59:59`;
    
    const weekStart = formatMySQLDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).slice(0, 10) + ' 00:00:00';
    const monthStart = formatMySQLDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).slice(0, 10) + ' 00:00:00';
    const yearStart = `${new Date().getFullYear()}-01-01 00:00:00`;

    // Parallel queries
    const [
      todayRevenue,
      weeklyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      revenueChart,
      revenueByMethod
    ] = await Promise.all([
      DashboardRepository.getRevenueByPeriod(todayStart, todayEnd),
      DashboardRepository.getRevenueByPeriod(weekStart, now),
      DashboardRepository.getRevenueByPeriod(monthStart, now),
      DashboardRepository.getRevenueByPeriod(yearStart, now),
      DashboardRepository.getRevenueChart(30),
      DashboardRepository.getRevenueByPaymentMethod()
    ]);

    // Calculate growth (compare current month with previous month)
    const prevMonthStart = formatMySQLDate(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)).slice(0, 10) + ' 00:00:00';
    const prevMonthEnd = formatMySQLDate(new Date(new Date().getFullYear(), new Date().getMonth(), 0)).slice(0, 10) + ' 23:59:59';
    const prevMonthRevenue = await DashboardRepository.getRevenueByPeriod(prevMonthStart, prevMonthEnd);
    
    const growth = prevMonthRevenue.revenue > 0 
      ? ((monthlyRevenue.revenue - prevMonthRevenue.revenue) / prevMonthRevenue.revenue * 100) 
      : 0;

    return {
      today: todayRevenue.revenue,
      weekly: weeklyRevenue.revenue,
      monthly: monthlyRevenue.revenue,
      yearly: yearlyRevenue.revenue,
      growth: parseFloat(growth.toFixed(2)),
      chart: revenueChart,
      byPaymentMethod: revenueByMethod,
      byCity: [], // Will be populated from bookings with location
      byVehicleType: [] // Will be populated when vehicle types are available
    };
  }

  // ==================== BOOKINGS SERVICE ====================

  async getBookings() {
    const today = formatMySQLDate(new Date()).slice(0, 10);
    const now = formatMySQLDate(new Date());
    
    const todayStart = `${today} 00:00:00`;
    const todayEnd = `${today} 23:59:59`;
    const weekStart = formatMySQLDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).slice(0, 10) + ' 00:00:00';
    const monthStart = formatMySQLDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).slice(0, 10) + ' 00:00:00';

    // Parallel queries
    const [
      todayBookings,
      weeklyBookings,
      monthlyBookings,
      peakHour,
      growth
    ] = await Promise.all([
      DashboardRepository.getBookingsByPeriod(todayStart, todayEnd),
      DashboardRepository.getBookingsByPeriod(weekStart, now),
      DashboardRepository.getBookingsByPeriod(monthStart, now),
      DashboardRepository.getPeakBookingHour(),
      DashboardRepository.getBookingGrowth()
    ]);

    return {
      today: todayBookings.total,
      weekly: weeklyBookings.total,
      monthly: monthlyBookings.total,
      completed: monthlyBookings.completed,
      cancelled: monthlyBookings.cancelled,
      ongoing: monthlyBookings.ongoing,
      upcoming: monthlyBookings.upcoming,
      avgAmount: monthlyBookings.avgAmount,
      growth: growth,
      peakHour: peakHour.hour,
      avgRideDuration: 0 // Will calculate when duration field exists
    };
  }

  // ==================== VEHICLES SERVICE ====================

  async getVehicles() {
    const stats = await DashboardRepository.getVehicleStats();
    return stats;
  }

  // ==================== SUPPORT SERVICE ====================

  async getSupport() {
    const [stats, recentTickets] = await Promise.all([
      DashboardRepository.getSupportStats(),
      DashboardRepository.getRecentTickets(5)
    ]);

    return {
      ...stats,
      recentTickets
    };
  }

  // ==================== SYSTEM ALERTS SERVICE ====================

  async getSystemAlerts() {
    const [alerts, recentAlerts] = await Promise.all([
      DashboardRepository.getSystemAlerts(),
      DashboardRepository.getRecentAlerts(10)
    ]);

    return {
      ...alerts,
      recentAlerts
    };
  }

  // ==================== CHARTS SERVICE ====================

  async getCharts(period = 30) {
    const days = parseInt(period) || 30;

    const [
      revenueChart,
      bookingChart,
      userGrowth,
      riderGrowth
    ] = await Promise.all([
      DashboardRepository.getRevenueChart(days),
      DashboardRepository.getUserGrowthChart(days), // Reuse for bookings trend
      DashboardRepository.getUserGrowthChart(days),
      DashboardRepository.getRiderGrowthChart(days)
    ]);

    return {
      revenue: revenueChart,
      bookings: bookingChart,
      userGrowth: userGrowth,
      riderGrowth: riderGrowth,
      vehicleGrowth: [] // Will populate when vehicle growth tracking exists
    };
  }

  // ==================== ANALYTICS SERVICE ====================

  async getAnalytics() {
    const [
      topCities,
      topRiders,
      topVehicles
    ] = await Promise.all([
      DashboardRepository.getTopCities(5),
      DashboardRepository.getTopRiders(10),
      DashboardRepository.getTopVehicles(10)
    ]);

    return {
      topCities,
      topRiders,
      topVehicles,
      cancellationRate: 0, // Calculate from bookings
      acceptanceRate: 0,
      successRate: 0
    };
  }

  // ==================== RECENT ACTIVITIES SERVICE ====================

  async getRecentActivities(limit = 10) {
    const activities = await DashboardRepository.getRecentActivities(limit);
    return activities;
  }
}

module.exports = new DashboardService();

