const { validationResult } = require('express-validator');
const BranchService = require('../services/BranchService');
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../../../src/utils/responseWrapper');

// Aliases used throughout this controller
const successResponse = (res, status, message, data) => sendSuccess(res, status, message, data);
const errorResponse   = (res, status, message, details) => sendError(res, status, message, null, details);
const DTO = require('../../../src/utils/dtoMapper');
const logger = require('../../../src/utils/logger');

// ==================== CREATE BRANCH ====================

const createBranch = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const branchData = {
      branch_name: req.body.branch_name,
      branch_code: req.body.branch_code,
      branch_type: req.body.branch_type || 'SUB',
      branch_status: req.body.branch_status || 'ACTIVE',
      address_line1: req.body.address_line1,
      address_line2: req.body.address_line2,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country || 'India',
      pin_code: req.body.pin_code,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      email: req.body.email,
      phone_number: req.body.phone_number,
      alternate_phone: req.body.alternate_phone,
      gst_number: req.body.gst_number,
      pan_number: req.body.pan_number,
      business_license: req.body.business_license,
      opening_date: req.body.opening_date,
      admin_id: req.body.admin_id || req.body.manager_id || null,
      manager_id: req.body.admin_id || req.body.manager_id || null,
      employee_count: req.body.employee_count || 0,
      service_radius_km: req.body.service_radius_km || 10.00,
      settings: req.body.settings || {}
    };

    const requestInfo = {
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    const adminId = req.admin?.admin_id || req.admin?.id || req.user?.id || req.user?.user_id;
    const result = await BranchService.createBranch(
      branchData,
      adminId,
      requestInfo
    );

    return successResponse(res, 201, 'Branch created successfully', result);

  } catch (error) {
    logger.error('Create Branch Controller Error:', error);
    const status = (error.message.includes('already exists') || error.message.includes('Duplicate entry')) ? 409 : 500;
    return errorResponse(res, status, error.message || 'Failed to create branch');
  }
};

// ==================== GET ALL BRANCHES ====================

const getAllBranches = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array(), req);
    }

    const filters = {
      search: req.query.search,
      status: req.query.status,
      city: req.query.city,
      state: req.query.state,
      branchType: req.query.branchType,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'DESC'
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await BranchService.getBranches(filters, pagination);

    return sendSuccess(res, 200, 'Branches retrieved successfully',
      DTO.toBranchList(result),
      { req, pagination: result.pagination }
    );

  } catch (error) {
    logger.error('Get All Branches Controller Error:', error);
    return sendError(res, 500, error.message || 'Failed to retrieve branches', 'BRANCHES_FETCH_FAILED', null, req);
  }
};

// ==================== GET BRANCH BY ID ====================

const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await BranchService.getBranchById(id);

    return sendSuccess(res, 200, 'Branch details retrieved successfully', DTO.toBranch(result), { req });

  } catch (error) {
    logger.error('Get Branch By ID Controller Error:', error);
    if (error.message === 'Branch not found') return sendNotFound(res, 'Branch', req);
    return sendError(res, 500, error.message || 'Failed to retrieve branch details', 'BRANCH_FETCH_FAILED', null, req);
  }
};

// ==================== UPDATE BRANCH ====================

const updateBranch = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const updateData = {
      branch_name: req.body.branch_name,
      branch_type: req.body.branch_type,
      address_line1: req.body.address_line1,
      address_line2: req.body.address_line2,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      pin_code: req.body.pin_code,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      email: req.body.email,
      phone_number: req.body.phone_number,
      alternate_phone: req.body.alternate_phone,
      gst_number: req.body.gst_number,
      pan_number: req.body.pan_number,
      business_license: req.body.business_license,
      admin_id: req.body.admin_id || req.body.manager_id || null,
      manager_id: req.body.admin_id || req.body.manager_id || null,
      employee_count: req.body.employee_count,
      service_radius_km: req.body.service_radius_km
    };

    const requestInfo = {
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    const adminId = req.admin?.admin_id || req.admin?.id || req.user?.id || req.user?.user_id;
    const result = await BranchService.updateBranch(
      id,
      updateData,
      adminId,
      requestInfo
    );

    return successResponse(res, 200, 'Branch updated successfully', result);

  } catch (error) {
    logger.error('Update Branch Controller Error:', error);
    const statusCode = error.message === 'Branch not found' ? 404 : 500;
    return errorResponse(res, statusCode, error.message || 'Failed to update branch');
  }
};

// ==================== UPDATE BRANCH STATUS ====================

const updateBranchStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const { status } = req.body;

    const requestInfo = {
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    const result = await BranchService.updateBranchStatus(
      id,
      status,
      req.admin.admin_id,
      requestInfo
    );

    return successResponse(res, 200, 'Branch status updated successfully', result);

  } catch (error) {
    logger.error('Update Branch Status Controller Error:', error);
    const statusCode = error.message === 'Branch not found' ? 404 : 400;
    return errorResponse(res, statusCode, error.message || 'Failed to update branch status');
  }
};

// ==================== DELETE BRANCH ====================

const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const requestInfo = {
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    const result = await BranchService.deleteBranch(
      id,
      req.admin.admin_id,
      requestInfo
    );

    return successResponse(res, 200, 'Branch deleted successfully', result);

  } catch (error) {
    logger.error('Delete Branch Controller Error:', error);
    const statusCode = error.message === 'Branch not found' ? 404 : 400;
    return errorResponse(res, statusCode, error.message || 'Failed to delete branch');
  }
};

// ==================== GET BRANCH STATISTICS ====================

const getBranchStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    const statistics = await BranchService.getBranchStatistics(id);

    return successResponse(res, 200, 'Branch statistics retrieved successfully', { statistics });

  } catch (error) {
    logger.error('Get Branch Statistics Controller Error:', error);
    const statusCode = error.message === 'Branch not found' ? 404 : 500;
    return errorResponse(res, statusCode, error.message || 'Failed to retrieve branch statistics');
  }
};

// ==================== GET BRANCH ACTIVITY LOGS ====================

const getBranchActivityLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const pagination = {
      page: req.query.page || 1,
      limit: req.query.limit || 50
    };

    const result = await BranchService.getActivityLogs(id, pagination);

    return successResponse(res, 200, 'Activity logs retrieved successfully', result);

  } catch (error) {
    logger.error('Get Branch Activity Logs Controller Error:', error);
    const statusCode = error.message === 'Branch not found' ? 404 : 500;
    return errorResponse(res, statusCode, error.message || 'Failed to retrieve activity logs');
  }
};

// ==================== GET BRANCH SETTINGS ====================

const getBranchSettings = async (req, res) => {
  try {
    const { id } = req.params;

    const settings = await BranchService.getBranchSettings(id);

    return successResponse(res, 200, 'Branch settings retrieved successfully', { settings });

  } catch (error) {
    logger.error('Get Branch Settings Controller Error:', error);
    const statusCode = error.message === 'Branch not found' ? 404 : 500;
    return errorResponse(res, statusCode, error.message || 'Failed to retrieve branch settings');
  }
};

// ==================== UPDATE BRANCH SETTINGS ====================

const updateBranchSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const settingsData = {
      timezone: req.body.timezone,
      currency: req.body.currency,
      language: req.body.language,
      max_riders: req.body.max_riders,
      max_vehicles: req.body.max_vehicles,
      max_daily_bookings: req.body.max_daily_bookings,
      booking_radius_km: req.body.booking_radius_km,
      min_booking_amount: req.body.min_booking_amount,
      commission_percentage: req.body.commission_percentage,
      auto_assign_riders: req.body.auto_assign_riders,
      auto_accept_bookings: req.body.auto_accept_bookings,
      enable_email_notifications: req.body.enable_email_notifications,
      enable_sms_notifications: req.body.enable_sms_notifications,
      enable_push_notifications: req.body.enable_push_notifications,
      accept_cash: req.body.accept_cash,
      accept_online: req.body.accept_online,
      accept_wallet: req.body.accept_wallet
    };

    const requestInfo = {
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    const result = await BranchService.updateBranchSettings(
      id,
      settingsData,
      req.admin.admin_id,
      requestInfo
    );

    return successResponse(res, 200, 'Branch settings updated successfully', { settings: result });

  } catch (error) {
    logger.error('Update Branch Settings Controller Error:', error);
    const statusCode = error.message === 'Branch not found' ? 404 : 500;
    return errorResponse(res, statusCode, error.message || 'Failed to update branch settings');
  }
};

module.exports = {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  updateBranchStatus,
  deleteBranch,
  getBranchStatistics,
  getBranchActivityLogs,
  getBranchSettings,
  updateBranchSettings
};

