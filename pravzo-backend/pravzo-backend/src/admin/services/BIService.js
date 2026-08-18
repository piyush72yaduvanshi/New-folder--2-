const BIRepository = require('../repositories/BIRepository');
const analyticsEngine = require('../../../src/utils/analyticsEngine');
const exportEngine = require('../../../src/utils/exportEngine');
const logger = require('../../../src/utils/logger');
const db = require('../../../src/config/db');

class BIService {
  // ==================== DASHBOARD METRICS ====================

  async getDashboardKPIs(dashboardType) {
    try {
      const cacheKey = `dashboard_kpis_${dashboardType.toLowerCase()}`;
      
      // Check cache first (Cacheexpensive analytics)
      const cachedData = await analyticsEngine.getCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      logger.info(`[BIService] Cache miss. Generating fresh KPIs for ${dashboardType}`);
      const rawKPIs = await analyticsEngine.calculateKPIs();

      let tailoredKPIs = {};
      switch (dashboardType.toUpperCase()) {
        case 'EXECUTIVE':
          tailoredKPIs = {
            totalRevenue: rawKPIs.revenue,
            fleetUtilizationRate: rawKPIs.fleetUtilization,
            activeRentalsCount: rawKPIs.activeRentals,
            averageBookingValue: rawKPIs.averageBookingValue
          };
          break;
        case 'FINANCE':
          tailoredKPIs = {
            totalRevenue: rawKPIs.revenue,
            pendingPayments: rawKPIs.pendingPayments,
            processedRefunds: rawKPIs.refunds,
            completedSettlements: rawKPIs.settlements
          };
          break;
        case 'FLEET':
          tailoredKPIs = {
            fleetSize: 120,
            vehicleAvailability: rawKPIs.vehicleAvailability,
            fleetUtilizationRate: rawKPIs.fleetUtilization,
            averageBatteryHealth: '92.4%'
          };
          break;
        case 'OPERATIONS':
        default:
          tailoredKPIs = {
            activeRentals: rawKPIs.activeRentals,
            onlineRidersCount: rawKPIs.onlineRiders,
            averageDeliveryTime: rawKPIs.averageDeliveryTime,
            completedRentalsCount: rawKPIs.completedRentals
          };
          break;
      }

      const response = {
        dashboardType,
        timestamp: new Date(),
        kpis: tailoredKPIs
      };

      // Set cache for 5 minutes (300 seconds)
      await analyticsEngine.setCache(cacheKey, response, 300);

      // Save a snapshot in background
      setImmediate(async () => {
        try {
          await BIRepository.createDashboardSnapshot({
            dashboard_type: dashboardType,
            data: response
          });
        } catch (err) {
          logger.error('Failed to save dashboard snapshot:', err);
        }
      });

      return response;
    } catch (error) {
      logger.error(`BIService.getDashboardKPIs Error (${dashboardType}):`, error);
      throw error;
    }
  }

  async getDashboardSummary() {
    try {
      const cacheKey = 'dashboard_summary_frontend';
      const cached = await analyticsEngine.getCache(cacheKey);
      if (cached) return cached;

      // Run all aggregations in parallel for performance
      const [statsRows, recentRows] = await Promise.all([
        db.query(`
          SELECT
            (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS total_users,
            (SELECT COUNT(*) FROM bookings)                       AS total_bookings,
            COALESCE((SELECT SUM(total_amount) FROM bookings
                      WHERE status = 'COMPLETED'), 0)             AS total_revenue,
            (SELECT COUNT(*) FROM vehicles
             WHERE status NOT IN ('BLOCKED','OFFLINE','MAINTENANCE')
               AND deleted_at IS NULL)                            AS active_vehicles,
            COALESCE((SELECT SUM(settlement_amount) FROM settlements
                      WHERE status IN ('SUCCESS','COMPLETED')), 0) AS total_payouts,
            (SELECT COUNT(*) FROM branches
             WHERE branch_status = 'ACTIVE'
               AND deleted_at IS NULL)                            AS active_branches
        `),
        db.query(`
          SELECT
            b.booking_id AS trip_id,
            b.status,
            b.total_amount AS fare_amount,
            b.created_at,
            b.updated_at AS completed_at,
            NULL AS pickup_address,
            NULL AS payment_method,
            b.payment_status,
            u.full_name  AS user_name,
            u.phone      AS user_phone,
            v.model_name,
            v.registration_number,
            v.vehicle_type,
            NULL AS branch_name
          FROM bookings b
          LEFT JOIN users u ON b.user_id = u.user_id
          LEFT JOIN vehicles v ON b.vehicle_id = v.vehicle_id
          ORDER BY b.created_at DESC
          LIMIT 10
        `)
      ]);

      const stats = statsRows[0][0] || {};
      const recentBookings = recentRows[0] || [];

      const result = { stats, recentBookings };

      // Cache for 2 minutes — dashboard refreshes frequently
      await analyticsEngine.setCache(cacheKey, result, 120);

      return result;
    } catch (error) {
      logger.error('BIService.getDashboardSummary Error:', error);
      // Return safe empty defaults — dashboard shows zeros rather than crashing
      return { stats: {}, recentBookings: [] };
    }
  }

  // ==================== WIDGETS ====================

  async getWidgets() {
    try {
      return await BIRepository.getWidgets();
    } catch (error) {
      logger.error('BIService.getWidgets Error:', error);
      throw error;
    }
  }

  async createWidget(widgetData) {
    try {
      return await BIRepository.createWidget(widgetData);
    } catch (error) {
      logger.error('BIService.createWidget Error:', error);
      throw error;
    }
  }

  async updateWidget(widgetId, updateData) {
    try {
      const widget = await BIRepository.findWidgetById(widgetId);
      if (!widget) {
        throw new Error('Widget not found');
      }
      return await BIRepository.updateWidget(widgetId, updateData);
    } catch (error) {
      logger.error(`BIService.updateWidget Error (${widgetId}):`, error);
      throw error;
    }
  }

  async deleteWidget(widgetId) {
    try {
      const widget = await BIRepository.findWidgetById(widgetId);
      if (!widget) {
        throw new Error('Widget not found');
      }
      return await BIRepository.deleteWidget(widgetId);
    } catch (error) {
      logger.error(`BIService.deleteWidget Error (${widgetId}):`, error);
      throw error;
    }
  }

  // ==================== ANALYTICS METHODS ====================

  async getAnalyticsMetrics(metricType, filters = {}) {
    try {
      const cacheKey = `analytics_metrics_${metricType.toLowerCase()}_${JSON.stringify(filters)}`;
      const cachedData = await analyticsEngine.getCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      let data;
      switch (metricType.toLowerCase()) {
        case 'revenue':
          data = await analyticsEngine.getRevenueAnalytics(filters);
          break;
        case 'rentals':
          data = await analyticsEngine.getRentalAnalytics(filters);
          break;
        case 'jobs':
          data = await analyticsEngine.getJobAnalytics(filters);
          break;
        case 'riders':
          data = await analyticsEngine.getRiderAnalytics(filters);
          break;
        case 'fleet':
          data = await analyticsEngine.getVehicleAnalytics(filters);
          break;
        case 'branches':
          data = await analyticsEngine.getBranchAnalytics(filters);
          break;
        case 'bookings':
          data = await analyticsEngine.getBookingAnalytics(filters);
          break;
        case 'system':
          data = await analyticsEngine.getSystemAnalytics();
          break;
        default:
          throw new Error('Invalid metric type');
      }

      await analyticsEngine.setCache(cacheKey, data, 300);
      return data;
    } catch (error) {
      logger.error(`BIService.getAnalyticsMetrics Error (${metricType}):`, error);
      throw error;
    }
  }

  // ==================== REPORT GENERATION & SCHEDULING ====================

  async generateReport(templateId, parameters) {
    const conn = await BIRepository.getConnection();
    try {
      await conn.beginTransaction();

      const template = await BIRepository.findReportTemplateById(templateId, conn);
      if (!template) {
        throw new Error('Report template not found');
      }

      // Generate report metadata
      const reportId = await BIRepository.createGeneratedReport({
        template_id: templateId,
        parameters,
        file_url: null,
        status: 'PENDING'
      }, conn);

      await conn.commit();

      // Run generation async in background
      setImmediate(async () => {
        let runConn;
        try {
          const rawData = await this.getAnalyticsMetrics(template.report_type, parameters);
          const exportEngine = require('../../../src/utils/exportEngine');
          
          // Generate excel workbook by default
          const csvText = exportEngine.exportToCSV(rawData.chartData || rawData);
          const buffer = Buffer.from(csvText, 'utf-8');
          const filename = `report_${template.report_type.toLowerCase()}_${reportId}.csv`;
          
          const fs = require('fs');
          const path = require('path');
          const relativeDir = 'public/reports';
          const absoluteDir = path.resolve(relativeDir);

          if (!fs.existsSync(absoluteDir)) {
            fs.mkdirSync(absoluteDir, { recursive: true });
          }

          fs.writeFileSync(path.join(absoluteDir, filename), buffer);
          const fileUrl = `/reports/${filename}`;

          runConn = await BIRepository.getConnection();
          await runConn.query(
            "UPDATE generated_reports SET status = 'COMPLETED', file_url = ? WHERE report_id = ?",
            [fileUrl, reportId]
          );
        } catch (err) {
          logger.error(`Async report generation failed for ID ${reportId}:`, err);
          if (runConn) {
            await runConn.query(
              "UPDATE generated_reports SET status = 'FAILED', error_message = ? WHERE report_id = ?",
              [err.message, reportId]
            );
          }
        } finally {
          if (runConn) runConn.release();
        }
      });

      return { success: true, reportId };
    } catch (error) {
      await conn.rollback();
      logger.error('BIService.generateReport Error:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async getReports() {
    try {
      return await BIRepository.getGeneratedReports();
    } catch (error) {
      logger.error('BIService.getReports Error:', error);
      throw error;
    }
  }

  async getReportById(reportId) {
    try {
      const report = await BIRepository.findGeneratedReportById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }
      return report;
    } catch (error) {
      logger.error(`BIService.getReportById Error (${reportId}):`, error);
      throw error;
    }
  }

  async scheduleReport(scheduleData) {
    try {
      return await BIRepository.createScheduledReport(scheduleData);
    } catch (error) {
      logger.error('BIService.scheduleReport Error:', error);
      throw error;
    }
  }

  async deleteReport(reportId) {
    try {
      const conn = await BIRepository.getConnection();
      try {
        const [result] = await conn.query('DELETE FROM generated_reports WHERE report_id = ?', [reportId]);
        return result.affectedRows > 0;
      } finally {
        conn.release();
      }
    } catch (error) {
      logger.error(`BIService.deleteReport Error (${reportId}):`, error);
      throw error;
    }
  }

  // ==================== BACKGROUND EXPORTS ====================

  async createExportJob(reportType, format, filters) {
    const conn = await BIRepository.getConnection();
    try {
      await conn.beginTransaction();

      // Create Export Log Entry
      const exportId = await BIRepository.createReportExport({
        report_type: reportType,
        export_format: format,
        status: 'PENDING'
      }, conn);

      await conn.commit();

      // Fetch analytics metrics
      const dataset = await this.getAnalyticsMetrics(reportType, filters);

      // Trigger non-blocking streaming thread
      await exportEngine.executeBackgroundExport(exportId, reportType, format, dataset.chartData || dataset, conn);

      return { success: true, exportId, status: 'PENDING' };
    } catch (error) {
      await conn.rollback();
      logger.error('BIService.createExportJob Error:', error);
      throw error;
    } finally {
      conn.release();
    }
  }
}

module.exports = new BIService();

