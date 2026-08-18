const { validationResult } = require('express-validator');
const BIService = require('../services/BIService');
const { sendSuccess, sendError, sendValidationError } = require('../../../src/utils/responseWrapper');
const DTO = require('../../../src/utils/dtoMapper');
const logger = require('../../../src/utils/logger');

class BIController {
  // ==================== DASHBOARD ====================

  async getDashboardKPIs(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const dashboardType = req.query.dashboardType || 'OPERATIONS';

      // Run both in parallel: BI-level KPIs + Frontend summary KPIs
      const [kpis, summary] = await Promise.all([
        BIService.getDashboardKPIs(dashboardType),
        BIService.getDashboardSummary()
      ]);

      // Merge: frontend-required 6 KPIs come from summary; BI-level KPIs preserved
      const frontendKPIs = DTO.toDashboard(summary.stats || {}, summary.recentBookings || []);

      return sendSuccess(res, 200, 'Dashboard KPIs compiled successfully', {
        ...frontendKPIs,
        // Preserve original BI-level KPI data for advanced dashboard usage
        dashboardType: kpis.dashboardType,
        kpis: kpis.kpis
      }, { req });
    } catch (error) {
      logger.error('BIController.getDashboardKPIs Error:', error);
      return sendError(res, 500, error.message, 'DASHBOARD_FETCH_FAILED', null, req);
    }
  }

  async getWidgets(req, res) {
    try {
      const widgets = await BIService.getWidgets();
      return sendSuccess(res, 200, 'Dashboard widgets list retrieved', widgets);
    } catch (error) {
      logger.error('BIController.getWidgets Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  async createWidget(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const widgetId = await BIService.createWidget(req.body);
      return sendSuccess(res, 201, 'Widget created successfully', { widgetId });
    } catch (error) {
      logger.error('BIController.createWidget Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  async updateWidget(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const widgetId = parseInt(req.params.id);
      await BIService.updateWidget(widgetId, req.body);
      return sendSuccess(res, 200, 'Widget updated successfully');
    } catch (error) {
      logger.error('BIController.updateWidget Error:', error);
      return sendError(res, error.message === 'Widget not found' ? 404 : 500, error.message);
    }
  }

  async deleteWidget(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const widgetId = parseInt(req.params.id);
      await BIService.deleteWidget(widgetId);
      return sendSuccess(res, 200, 'Widget deleted successfully');
    } catch (error) {
      logger.error('BIController.deleteWidget Error:', error);
      return sendError(res, error.message === 'Widget not found' ? 404 : 500, error.message);
    }
  }

  // ==================== ANALYTICS ====================

  async getAnalytics(req, res) {
    try {
      const metrics = await BIService.getAnalyticsMetrics('system');
      return sendSuccess(res, 200, 'Central system diagnostics compiled', metrics);
    } catch (error) {
      logger.error('BIController.getAnalytics Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  async getRevenueAnalytics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const data = await BIService.getAnalyticsMetrics('revenue', filters);
      return sendSuccess(res, 200, 'Revenue analytics data compiled', data);
    } catch (error) {
      logger.error('BIController.getRevenueAnalytics Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  async getRentalAnalytics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const data = await BIService.getAnalyticsMetrics('rentals', filters);
      return sendSuccess(res, 200, 'Rental analytics data compiled', data);
    } catch (error) {
      logger.error('BIController.getRentalAnalytics Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  async getBookingAnalytics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        status: req.query.status,
        riderId: req.query.riderId || req.query.rider_id,
        branchId: req.query.branchId || req.query.branch_id
      };
      const data = await BIService.getAnalyticsMetrics('bookings', filters);
      return sendSuccess(res, 200, 'Booking analytics data compiled', data);
    } catch (error) {
      logger.error('BIController.getBookingAnalytics Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  async getJobAnalytics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const data = await BIService.getAnalyticsMetrics('jobs', filters);
      return sendSuccess(res, 200, 'Job performance metrics compiled', data);
    } catch (error) {
      logger.error('BIController.getJobAnalytics Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  async getRiderAnalytics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const data = await BIService.getAnalyticsMetrics('riders', filters);
      return sendSuccess(res, 200, 'Riders diagnostics metrics compiled', data);
    } catch (error) {
      logger.error('BIController.getRiderAnalytics Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  async getVehicleAnalytics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const data = await BIService.getAnalyticsMetrics('fleet', filters);
      return sendSuccess(res, 200, 'Vehicle diagnostics metrics compiled', data);
    } catch (error) {
      logger.error('BIController.getVehicleAnalytics Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  async getSystemAnalytics(req, res) {
    try {
      const data = await BIService.getAnalyticsMetrics('system');
      return sendSuccess(res, 200, 'System statistics analytics metrics compiled', data);
    } catch (error) {
      logger.error('BIController.getSystemAnalytics Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  async getBranchAnalytics(req, res) {
    try {
      const data = await BIService.getAnalyticsMetrics('branches');
      return sendSuccess(res, 200, 'Branch performance metrics compiled', data);
    } catch (error) {
      logger.error('BIController.getBranchAnalytics Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  // ==================== REPORTS ====================

  async generateReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const { templateId, parameters } = req.body;
      const result = await BIService.generateReport(templateId, parameters);
      return sendSuccess(res, 201, 'Report generation job created', result);
    } catch (error) {
      logger.error('BIController.generateReport Error:', error);
      const status = error.message === 'Report template not found' ? 404 : 500;
      return sendError(res, status, error.message);
    }
  }

  async getReports(req, res) {
    try {
      const reports = await BIService.getReports();
      return sendSuccess(res, 200, 'Generated reports list retrieved', reports);
    } catch (error) {
      logger.error('BIController.getReports Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  async getReportById(req, res) {
    try {
      const reportId = parseInt(req.params.id);
      const report = await BIService.getReportById(reportId);
      return sendSuccess(res, 200, 'Report details retrieved', report);
    } catch (error) {
      logger.error('BIController.getReportById Error:', error);
      return sendError(res, error.message === 'Report not found' ? 404 : 500, error.message);
    }
  }

  async scheduleReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      // Map camelCase body fields to snake_case for the repository
      const scheduleData = {
        template_id: req.body.templateId,
        frequency: req.body.frequency,
        recipient_email: req.body.recipientEmail,
        is_active: 1
      };

      const scheduleId = await BIService.scheduleReport(scheduleData);
      return sendSuccess(res, 201, 'Report schedule registered successfully', { scheduleId });
    } catch (error) {
      logger.error('BIController.scheduleReport Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  async deleteReport(req, res) {
    try {
      const reportId = parseInt(req.params.id);
      const deleted = await BIService.deleteReport(reportId);
      
      if (!deleted) {
        return sendError(res, 404, 'Report not found');
      }

      return sendSuccess(res, 200, 'Report deleted successfully');
    } catch (error) {
      logger.error('BIController.deleteReport Error:', error);
      return sendError(res, 404, 'Report not found');
    }
  }

  // ==================== EXPORTS ====================

  async exportCSV(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const { reportType, filters } = req.body;
      const result = await BIService.createExportJob(reportType, 'CSV', filters);
      return sendSuccess(res, 202, 'CSV background export job generated', result);
    } catch (error) {
      logger.error('BIController.exportCSV Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  async exportExcel(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const { reportType, filters } = req.body;
      const result = await BIService.createExportJob(reportType, 'EXCEL', filters);
      return sendSuccess(res, 202, 'Excel workbook background export job generated', result);
    } catch (error) {
      logger.error('BIController.exportExcel Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  async exportPDF(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const { reportType, filters } = req.body;
      const result = await BIService.createExportJob(reportType, 'PDF', filters);
      return sendSuccess(res, 202, 'PDF background export job generated', result);
    } catch (error) {
      logger.error('BIController.exportPDF Error:', error);
      return sendError(res, 500, error.message);
    }
  }
}

module.exports = new BIController();

