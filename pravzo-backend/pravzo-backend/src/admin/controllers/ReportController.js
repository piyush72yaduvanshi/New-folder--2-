const { validationResult } = require('express-validator');
const ReportService = require('../services/ReportService');
const { successResponse, errorResponse } = require('../../../src/utils/response');
const logger = require('../../../src/utils/logger');

// ==================== REVENUE REPORTS ====================

const getRevenueReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      city: req.query.city,
      vehicleType: req.query.vehicleType,
      paymentMethod: req.query.paymentMethod,
      groupBy: req.query.groupBy
    };

    const report = await ReportService.getRevenueReport(filters);
    return successResponse(res, 200, 'Revenue report retrieved successfully', report);
  } catch (error) {
    logger.error('Get Revenue Report Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve revenue report', error.message);
  }
};

// ==================== BOOKING REPORTS ====================

const getBookingReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      city: req.query.city,
      status: req.query.status,
      vehicleType: req.query.vehicleType,
      groupBy: req.query.groupBy
    };

    const report = await ReportService.getBookingReport(filters);
    return successResponse(res, 200, 'Booking report retrieved successfully', report);
  } catch (error) {
    logger.error('Get Booking Report Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve booking report', error.message);
  }
};

// ==================== USER REPORTS ====================

const getUserReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      city: req.query.city,
      status: req.query.status
    };

    const report = await ReportService.getUserReport(filters);
    return successResponse(res, 200, 'User report retrieved successfully', report);
  } catch (error) {
    logger.error('Get User Report Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve user report', error.message);
  }
};

// ==================== RIDER REPORTS ====================

const getRiderReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      city: req.query.city,
      status: req.query.status
    };

    const report = await ReportService.getRiderReport(filters);
    return successResponse(res, 200, 'Rider report retrieved successfully', report);
  } catch (error) {
    logger.error('Get Rider Report Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve rider report', error.message);
  }
};

// ==================== VEHICLE REPORTS ====================

const getVehicleReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      city: req.query.city,
      vehicleType: req.query.vehicleType,
      status: req.query.status
    };

    const report = await ReportService.getVehicleReport(filters);
    return successResponse(res, 200, 'Vehicle report retrieved successfully', report);
  } catch (error) {
    logger.error('Get Vehicle Report Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve vehicle report', error.message);
  }
};

// ==================== PAYMENT REPORTS ====================

const getPaymentReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      paymentMethod: req.query.paymentMethod,
      paymentStatus: req.query.paymentStatus
    };

    const report = await ReportService.getPaymentReport(filters);
    return successResponse(res, 200, 'Payment report retrieved successfully', report);
  } catch (error) {
    logger.error('Get Payment Report Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve payment report', error.message);
  }
};

// ==================== SUPPORT REPORTS ====================

const getSupportReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status
    };

    const report = await ReportService.getSupportReport(filters);
    return successResponse(res, 200, 'Support report retrieved successfully', report);
  } catch (error) {
    logger.error('Get Support Report Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve support report', error.message);
  }
};

// ==================== KYC REPORTS ====================

const getKYCReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status
    };

    const report = await ReportService.getKYCReport(filters);
    return successResponse(res, 200, 'KYC report retrieved successfully', report);
  } catch (error) {
    logger.error('Get KYC Report Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve KYC report', error.message);
  }
};

// ==================== DASHBOARD ANALYTICS ====================

const getDashboardAnalytics = async (req, res) => {
  try {
    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const analytics = await ReportService.getDashboardAnalytics(filters);
    return successResponse(res, 200, 'Dashboard analytics retrieved successfully', analytics);
  } catch (error) {
    logger.error('Get Dashboard Analytics Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve dashboard analytics', error.message);
  }
};

// ==================== TOP LISTS ====================

const getTopUsers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit || 10
    };

    const result = await ReportService.getTopUsers(filters);
    return successResponse(res, 200, 'Top users retrieved successfully', result);
  } catch (error) {
    logger.error('Get Top Users Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve top users', error.message);
  }
};

const getTopRiders = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit || 10
    };

    const result = await ReportService.getTopRiders(filters);
    return successResponse(res, 200, 'Top riders retrieved successfully', result);
  } catch (error) {
    logger.error('Get Top Riders Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve top riders', error.message);
  }
};

const getTopCities = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit || 10
    };

    const result = await ReportService.getTopCities(filters);
    return successResponse(res, 200, 'Top cities retrieved successfully', result);
  } catch (error) {
    logger.error('Get Top Cities Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve top cities', error.message);
  }
};

const getTopVehicles = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit || 10
    };

    const result = await ReportService.getTopVehicles(filters);
    return successResponse(res, 200, 'Top vehicles retrieved successfully', result);
  } catch (error) {
    logger.error('Get Top Vehicles Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve top vehicles', error.message);
  }
};

// ==================== CHART DATA ====================

const getRevenueChartData = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      interval: req.query.interval || 'day'
    };

    const chartData = await ReportService.getRevenueChartData(filters);
    return successResponse(res, 200, 'Revenue chart data retrieved successfully', chartData);
  } catch (error) {
    logger.error('Get Revenue Chart Data Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve revenue chart data', error.message);
  }
};

const getBookingChartData = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      interval: req.query.interval || 'day'
    };

    const chartData = await ReportService.getBookingChartData(filters);
    return successResponse(res, 200, 'Booking chart data retrieved successfully', chartData);
  } catch (error) {
    logger.error('Get Booking Chart Data Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve booking chart data', error.message);
  }
};

const getUserChartData = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const filters = {
      period: req.query.period || 'last30days',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      interval: req.query.interval || 'day'
    };

    const chartData = await ReportService.getUserChartData(filters);
    return successResponse(res, 200, 'User chart data retrieved successfully', chartData);
  } catch (error) {
    logger.error('Get User Chart Data Controller Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve user chart data', error.message);
  }
};

// ==================== DOWNLOAD REPORTS ====================

const downloadReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { type, format } = req.query;

    // For now, return a message that export will be handled by frontend
    // In production, you would generate CSV/Excel/PDF here
    return successResponse(res, 200, `${type} report export in ${format} format`, {
      message: 'Export functionality to be implemented',
      type,
      format,
      note: 'Frontend should handle CSV/Excel generation from API data'
    });
  } catch (error) {
    logger.error('Download Report Controller Error:', error);
    return errorResponse(res, 500, 'Failed to download report', error.message);
  }
};

module.exports = {
  getRevenueReport,
  getBookingReport,
  getUserReport,
  getRiderReport,
  getVehicleReport,
  getPaymentReport,
  getSupportReport,
  getKYCReport,
  getDashboardAnalytics,
  getTopUsers,
  getTopRiders,
  getTopCities,
  getTopVehicles,
  getRevenueChartData,
  getBookingChartData,
  getUserChartData,
  downloadReport
};

