const ReportRepository = require('../repositories/ReportRepository');

class ReportService {
  // ==================== DATE RANGE HELPERS ====================

  getDateRange(period, startDate, endDate) {
    const now = new Date();
    let start, end;

    if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'today':
          start = new Date(now.setHours(0, 0, 0, 0));
          end = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'yesterday':
          start = new Date(now.setDate(now.getDate() - 1));
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setHours(23, 59, 59, 999);
          break;
        case 'last7days':
          end = new Date();
          start = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'last30days':
          end = new Date();
          start = new Date(now.setDate(now.getDate() - 30));
          break;
        case 'last90days':
          end = new Date();
          start = new Date(now.setDate(now.getDate() - 90));
          break;
        case 'currentMonth':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'previousMonth':
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
        case 'currentYear':
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        default:
          // Default to last 30 days
          end = new Date();
          start = new Date(now.setDate(now.getDate() - 30));
      }
    }

    return {
      startDate: start.toISOString().slice(0, 19).replace('T', ' '),
      endDate: end.toISOString().slice(0, 19).replace('T', ' ')
    };
  }

  calculateGrowth(current, previous) {
    if (previous === 0) return 100;
    return ((current - previous) / previous * 100).toFixed(2);
  }

  // ==================== REVENUE REPORTS ====================

  async getRevenueReport(filters) {
    const { period, startDate: customStart, endDate: customEnd, city, vehicleType, paymentMethod, groupBy } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    // Get main report
    const report = await ReportRepository.getRevenueReport(startDate, endDate, {
      city,
      vehicleType,
      paymentMethod
    });

    // Get trend data
    const trend = await ReportRepository.getRevenueTrend(startDate, endDate, groupBy || 'day');

    // Get breakdown by city
    const byCity = await ReportRepository.getRevenueByCity(startDate, endDate);

    // Get breakdown by vehicle type
    const byVehicleType = await ReportRepository.getRevenueByVehicleType(startDate, endDate);

    // Calculate growth (compare with previous period)
    const periodDiff = new Date(endDate) - new Date(startDate);
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(prevEndDate.getTime() - periodDiff);

    const previousReport = await ReportRepository.getRevenueReport(
      prevStartDate.toISOString().slice(0, 19).replace('T', ' '),
      prevEndDate.toISOString().slice(0, 19).replace('T', ' '),
      { city, vehicleType, paymentMethod }
    );

    const revenueGrowth = this.calculateGrowth(
      parseFloat(report.total_revenue || 0),
      parseFloat(previousReport.total_revenue || 0)
    );

    return {
      summary: {
        ...report,
        revenue_growth: revenueGrowth,
        period: { startDate, endDate }
      },
      trend,
      byCity,
      byVehicleType
    };
  }

  // ==================== BOOKING REPORTS ====================

  async getBookingReport(filters) {
    const { period, startDate: customStart, endDate: customEnd, city, status, vehicleType, groupBy } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    // Get main report
    const report = await ReportRepository.getBookingReport(startDate, endDate, {
      city,
      status,
      vehicleType
    });

    // Get trend data
    const trend = await ReportRepository.getBookingTrend(startDate, endDate, groupBy || 'day');

    // Get peak hours
    const peakHours = await ReportRepository.getPeakBookingHours(startDate, endDate);

    // Calculate growth
    const periodDiff = new Date(endDate) - new Date(startDate);
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(prevEndDate.getTime() - periodDiff);

    const previousReport = await ReportRepository.getBookingReport(
      prevStartDate.toISOString().slice(0, 19).replace('T', ' '),
      prevEndDate.toISOString().slice(0, 19).replace('T', ' '),
      { city, status, vehicleType }
    );

    const bookingGrowth = this.calculateGrowth(
      parseInt(report.total_bookings || 0),
      parseInt(previousReport.total_bookings || 0)
    );

    return {
      summary: {
        ...report,
        booking_growth: bookingGrowth,
        period: { startDate, endDate }
      },
      trend,
      peakHours
    };
  }

  // ==================== USER REPORTS ====================

  async getUserReport(filters) {
    const { period, startDate: customStart, endDate: customEnd, city, status } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    // Get main report
    const report = await ReportRepository.getUserReport(startDate, endDate, { city, status });

    // Get growth trend
    const growthTrend = await ReportRepository.getUserGrowthTrend(startDate, endDate, 'day');

    // Get top cities
    const topCities = await ReportRepository.getUsersByCity(startDate, endDate);

    // Calculate growth
    const periodDiff = new Date(endDate) - new Date(startDate);
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(prevEndDate.getTime() - periodDiff);

    const previousReport = await ReportRepository.getUserReport(
      prevStartDate.toISOString().slice(0, 19).replace('T', ' '),
      prevEndDate.toISOString().slice(0, 19).replace('T', ' '),
      { city, status }
    );

    const userGrowth = this.calculateGrowth(
      parseInt(report.total_users || 0),
      parseInt(previousReport.total_users || 0)
    );

    return {
      summary: {
        ...report,
        user_growth: userGrowth,
        period: { startDate, endDate }
      },
      growthTrend,
      topCities
    };
  }

  // ==================== RIDER REPORTS ====================

  async getRiderReport(filters) {
    const { period, startDate: customStart, endDate: customEnd, city, status } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    // Get main report
    const report = await ReportRepository.getRiderReport(startDate, endDate, { city, status });

    // Get rider performance
    const topPerformers = await ReportRepository.getRiderPerformance(startDate, endDate, 10);

    return {
      summary: {
        ...report,
        period: { startDate, endDate }
      },
      topPerformers
    };
  }

  // ==================== VEHICLE REPORTS ====================

  async getVehicleReport(filters) {
    const { period, startDate: customStart, endDate: customEnd, city, vehicleType, status } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    // Get main report
    const report = await ReportRepository.getVehicleReport(startDate, endDate, {
      city,
      vehicleType,
      status
    });

    // Get utilization data
    const utilization = await ReportRepository.getVehicleUtilization(startDate, endDate, 10);

    return {
      summary: {
        ...report,
        period: { startDate, endDate }
      },
      utilization
    };
  }

  // ==================== PAYMENT REPORTS ====================

  async getPaymentReport(filters) {
    const { period, startDate: customStart, endDate: customEnd, paymentMethod, paymentStatus } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    // Get main report
    const report = await ReportRepository.getPaymentReport(startDate, endDate, {
      paymentMethod,
      paymentStatus
    });

    // Get payment method distribution
    const methodDistribution = await ReportRepository.getPaymentMethodDistribution(startDate, endDate);

    return {
      summary: {
        ...report,
        period: { startDate, endDate }
      },
      methodDistribution
    };
  }

  // ==================== SUPPORT REPORTS ====================

  async getSupportReport(filters) {
    const { period, startDate: customStart, endDate: customEnd, status } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    // Get main report
    const report = await ReportRepository.getSupportReport(startDate, endDate, { status });

    // Get category breakdown
    const categoryBreakdown = await ReportRepository.getSupportCategoryBreakdown(startDate, endDate);

    return {
      summary: {
        ...report,
        period: { startDate, endDate }
      },
      categoryBreakdown
    };
  }

  // ==================== KYC REPORTS ====================

  async getKYCReport(filters) {
    const { period, startDate: customStart, endDate: customEnd, status } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    // Get main report
    const report = await ReportRepository.getKYCReport(startDate, endDate, { status });

    return {
      summary: {
        ...report,
        period: { startDate, endDate }
      }
    };
  }

  // ==================== DASHBOARD ANALYTICS ====================

  async getDashboardAnalytics(filters) {
    const { period, startDate: customStart, endDate: customEnd } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    const analytics = await ReportRepository.getDashboardAnalytics(startDate, endDate);

    return {
      ...analytics,
      period: { startDate, endDate }
    };
  }

  // ==================== TOP LISTS ====================

  async getTopUsers(filters) {
    const { period, startDate: customStart, endDate: customEnd, limit } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    const topUsers = await ReportRepository.getTopUsers(startDate, endDate, limit || 10);

    return {
      topUsers,
      period: { startDate, endDate }
    };
  }

  async getTopRiders(filters) {
    const { period, startDate: customStart, endDate: customEnd, limit } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    const topRiders = await ReportRepository.getTopRiders(startDate, endDate, limit || 10);

    return {
      topRiders,
      period: { startDate, endDate }
    };
  }

  async getTopCities(filters) {
    const { period, startDate: customStart, endDate: customEnd, limit } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    const topCities = await ReportRepository.getTopCities(startDate, endDate, limit || 10);

    return {
      topCities,
      period: { startDate, endDate }
    };
  }

  async getTopVehicles(filters) {
    const { period, startDate: customStart, endDate: customEnd, limit } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    const topVehicles = await ReportRepository.getTopVehicles(startDate, endDate, limit || 10);

    return {
      topVehicles,
      period: { startDate, endDate }
    };
  }

  // ==================== CHART DATA ====================

  async getRevenueChartData(filters) {
    const { period, startDate: customStart, endDate: customEnd, interval } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    const chartData = await ReportRepository.getRevenueTrend(startDate, endDate, interval || 'day');

    return {
      labels: chartData.map(d => d.period),
      datasets: [
        {
          label: 'Revenue',
          data: chartData.map(d => parseFloat(d.revenue || 0))
        },
        {
          label: 'Transactions',
          data: chartData.map(d => parseInt(d.transactions || 0))
        }
      ],
      period: { startDate, endDate }
    };
  }

  async getBookingChartData(filters) {
    const { period, startDate: customStart, endDate: customEnd, interval } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    const chartData = await ReportRepository.getBookingTrend(startDate, endDate, interval || 'day');

    return {
      labels: chartData.map(d => d.period),
      datasets: [
        {
          label: 'Total Bookings',
          data: chartData.map(d => parseInt(d.total_bookings || 0))
        },
        {
          label: 'Completed',
          data: chartData.map(d => parseInt(d.completed || 0))
        },
        {
          label: 'Cancelled',
          data: chartData.map(d => parseInt(d.cancelled || 0))
        }
      ],
      period: { startDate, endDate }
    };
  }

  async getUserChartData(filters) {
    const { period, startDate: customStart, endDate: customEnd, interval } = filters;
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    const chartData = await ReportRepository.getUserGrowthTrend(startDate, endDate, interval || 'day');

    return {
      labels: chartData.map(d => d.period),
      datasets: [
        {
          label: 'New Users',
          data: chartData.map(d => parseInt(d.new_users || 0))
        },
        {
          label: 'Cumulative Users',
          data: chartData.map(d => parseInt(d.cumulative_users || 0))
        }
      ],
      period: { startDate, endDate }
    };
  }
}

module.exports = new ReportService();

