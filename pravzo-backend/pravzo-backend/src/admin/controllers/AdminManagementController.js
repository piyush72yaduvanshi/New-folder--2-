'use strict';
const { validationResult } = require('express-validator');
const AdminManagementService = require('../services/AdminManagementService');
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../../../src/utils/responseWrapper');
const DTO = require('../../../src/utils/dtoMapper');
const structuredLogger = require('../../../src/utils/structuredLogger');
const { sanitizePagination } = require('../../../src/utils/helpers');

// ── Helper: map common error messages to HTTP status codes ────────────────────
function statusFor(message) {
  if (!message) return 500;
  if (message === 'Admin not found') return 404;
  if (message.includes('not found')) return 404;
  if (
    message.includes('already exists') ||
    message.includes('Duplicate entry') ||
    message.includes('already has') ||
    message.includes('cannot') ||
    message.includes('Invalid') ||
    message.includes('does not have')
  ) return 409;
  return 500;
}

// ==================== CREATE ADMIN ====================

const createAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array(), req);
    }

    const adminData = {
      full_name: req.body.full_name,
      email: req.body.email,
      phone_number: req.body.phone_number,
      role: req.body.role || 'ADMIN',
      department: req.body.department || 'General'
    };

    const requestInfo = { ip: req.ip, userAgent: req.get('user-agent') };

    const result = await AdminManagementService.createAdmin(
      adminData,
      req.admin.admin_id,
      requestInfo
    );

    return sendSuccess(res, 201, 'Admin created successfully. Credentials sent to email.', result, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.createAdmin', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to create admin', 'ADMIN_CREATE_FAILED', null, req);
  }
};

// ==================== GET ALL ADMINS ====================

const getAllAdmins = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array(), req);
    }

    const filters = {
      search: req.query.search,
      role: req.query.role,
      status: req.query.status,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'DESC'
    };

    const pagination = sanitizePagination(req.query.page, req.query.limit);

    const result = await AdminManagementService.getAdmins(filters, pagination);

    return sendSuccess(res, 200, 'Admins retrieved successfully',
      DTO.toAdminList(result),
      { req, pagination: result.pagination }
    );

  } catch (error) {
    structuredLogger.error('AdminManagementController.getAllAdmins', { error: error.message, requestId: req.requestId });
    return sendError(res, 500, error.message || 'Failed to retrieve admins', 'ADMINS_FETCH_FAILED', null, req);
  }
};

// ==================== GET ADMIN BY ID ====================

const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await AdminManagementService.getAdminById(id);
    return sendSuccess(res, 200, 'Admin details retrieved successfully', DTO.toAdmin(admin), { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.getAdminById', { error: error.message, requestId: req.requestId });
    if (error.message === 'Admin not found') return sendNotFound(res, 'Admin', req);
    return sendError(res, 500, error.message || 'Failed to retrieve admin details', 'ADMIN_FETCH_FAILED', null, req);
  }
};

// ==================== UPDATE ADMIN ====================

const updateAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array(), req);
    }

    const { id } = req.params;
    const updateData = {
      full_name: req.body.full_name,
      phone_number: req.body.phone_number,
      role: req.body.role,
      department: req.body.department
    };

    const requestInfo = { ip: req.ip, userAgent: req.get('user-agent') };

    const admin = await AdminManagementService.updateAdmin(
      id, updateData, req.admin.admin_id, requestInfo
    );

    return sendSuccess(res, 200, 'Admin updated successfully', DTO.toAdmin(admin), { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.updateAdmin', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to update admin', 'ADMIN_UPDATE_FAILED', null, req);
  }
};

// ==================== BLOCK ADMIN ====================

const blockAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const requestInfo = { ip: req.ip, userAgent: req.get('user-agent') };

    const result = await AdminManagementService.blockAdmin(
      id, reason, req.admin.admin_id, requestInfo
    );

    return sendSuccess(res, 200, 'Admin blocked successfully', result, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.blockAdmin', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to block admin', 'ADMIN_BLOCK_FAILED', null, req);
  }
};

// ==================== UNBLOCK ADMIN ====================

const unblockAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const requestInfo = { ip: req.ip, userAgent: req.get('user-agent') };

    const result = await AdminManagementService.unblockAdmin(
      id, req.admin.admin_id, requestInfo
    );

    return sendSuccess(res, 200, 'Admin unblocked successfully', result, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.unblockAdmin', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to unblock admin', 'ADMIN_UNBLOCK_FAILED', null, req);
  }
};

// ==================== RESET ADMIN PASSWORD ====================

const resetAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const requestInfo = { ip: req.ip, userAgent: req.get('user-agent') };

    const result = await AdminManagementService.resetPassword(
      id, req.admin.admin_id, requestInfo
    );

    return sendSuccess(res, 200, 'Password reset successfully. New credentials sent to email.', result, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.resetAdminPassword', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to reset password', 'ADMIN_PASSWORD_RESET_FAILED', null, req);
  }
};

// ==================== DELETE ADMIN ====================

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const requestInfo = { ip: req.ip, userAgent: req.get('user-agent') };

    const result = await AdminManagementService.deleteAdmin(
      id, req.admin.admin_id, requestInfo
    );

    return sendSuccess(res, 200, 'Admin deleted successfully', result, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.deleteAdmin', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to delete admin', 'ADMIN_DELETE_FAILED', null, req);
  }
};

// ==================== GET ADMIN ACTIVITY LOGS ====================

const getAdminActivityLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await AdminManagementService.getActivityLogs(id, pagination);
    return sendSuccess(res, 200, 'Activity logs retrieved successfully', result, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.getAdminActivityLogs', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to retrieve activity logs', 'ACTIVITY_LOGS_FAILED', null, req);
  }
};

// ==================== GET ADMIN STATISTICS ====================

const getAdminStatistics = async (req, res) => {
  try {
    const statistics = await AdminManagementService.getStatistics();
    return sendSuccess(res, 200, 'Admin statistics retrieved successfully', { statistics }, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.getAdminStatistics', { error: error.message, requestId: req.requestId });
    return sendError(res, 500, error.message || 'Failed to retrieve statistics', 'ADMIN_STATS_FAILED', null, req);
  }
};

// ==================== ASSIGN BRANCH ====================

const assignBranch = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array(), req);
    }

    const { id } = req.params;
    const { branch_id, assignment_type } = req.body;
    const requestInfo = { ip: req.ip, userAgent: req.get('user-agent'), url: req.originalUrl };

    const result = await AdminManagementService.assignBranch(
      id, branch_id, assignment_type, req.admin.admin_id, requestInfo
    );

    return sendSuccess(res, 200, 'Branch assigned successfully', result, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.assignBranch', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to assign branch', 'BRANCH_ASSIGN_FAILED', null, req);
  }
};

// ==================== TRANSFER BRANCH ====================

const transferBranch = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array(), req);
    }

    const { id } = req.params;
    const { new_branch_id, transfer_reason, transfer_notes } = req.body;
    const requestInfo = { ip: req.ip, userAgent: req.get('user-agent'), url: req.originalUrl };

    const result = await AdminManagementService.transferBranch(
      id, new_branch_id, transfer_reason, transfer_notes, req.admin.admin_id, requestInfo
    );

    return sendSuccess(res, 200, 'Branch transferred successfully', result, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.transferBranch', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to transfer branch', 'BRANCH_TRANSFER_FAILED', null, req);
  }
};

// ==================== REMOVE BRANCH ====================

const removeBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const requestInfo = { ip: req.ip, userAgent: req.get('user-agent'), url: req.originalUrl };

    const result = await AdminManagementService.removeBranch(
      id, req.admin.admin_id, requestInfo
    );

    return sendSuccess(res, 200, 'Branch removed successfully', result, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.removeBranch', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to remove branch', 'BRANCH_REMOVE_FAILED', null, req);
  }
};

// ==================== GET ASSIGNMENT HISTORY ====================

const getAssignmentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await AdminManagementService.getAssignmentHistory(id, pagination);
    return sendSuccess(res, 200, 'Assignment history retrieved successfully', result, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.getAssignmentHistory', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to retrieve assignment history', 'ASSIGNMENT_HISTORY_FAILED', null, req);
  }
};

// ==================== GET LOGIN HISTORY ====================

const getLoginHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await AdminManagementService.getLoginHistory(id, pagination);
    return sendSuccess(res, 200, 'Login history retrieved successfully', result, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.getLoginHistory', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to retrieve login history', 'LOGIN_HISTORY_FAILED', null, req);
  }
};

// ==================== GET PERMISSIONS ====================

const getPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const permissions = await AdminManagementService.getPermissions(id);
    return sendSuccess(res, 200, 'Permissions retrieved successfully', permissions, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.getPermissions', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to retrieve permissions', 'PERMISSIONS_FETCH_FAILED', null, req);
  }
};

// ==================== UPDATE PERMISSIONS ====================

const updatePermissions = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array(), req);
    }

    const { id } = req.params;
    const permissions = {
      dashboard:        req.body.dashboard,
      users:            req.body.users,
      riders:           req.body.riders,
      vehicles:         req.body.vehicles,
      bookings:         req.body.bookings,
      rentals:          req.body.rentals,
      jobs:             req.body.jobs,
      reports:          req.body.reports,
      payments:         req.body.payments,
      notifications:    req.body.notifications,
      settings:         req.body.settings,
      landing_cms:      req.body.landing_cms,
      branches:         req.body.branches,
      admin_management: req.body.admin_management
    };

    const requestInfo = { ip: req.ip, userAgent: req.get('user-agent'), url: req.originalUrl };

    const result = await AdminManagementService.updatePermissions(
      id, permissions, req.admin.admin_id, requestInfo
    );

    return sendSuccess(res, 200, 'Permissions updated successfully', result, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.updatePermissions', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to update permissions', 'PERMISSIONS_UPDATE_FAILED', null, req);
  }
};

// ==================== GET ACTIVE SESSIONS ====================

const getActiveSessions = async (req, res) => {
  try {
    const { id } = req.params;
    const sessions = await AdminManagementService.getActiveSessions(id);
    return sendSuccess(res, 200, 'Active sessions retrieved successfully', { sessions }, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.getActiveSessions', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to retrieve active sessions', 'SESSIONS_FETCH_FAILED', null, req);
  }
};

// ==================== REVOKE SESSION ====================

const revokeSession = async (req, res) => {
  try {
    const { id, session_id } = req.params;
    const requestInfo = { ip: req.ip, userAgent: req.get('user-agent'), url: req.originalUrl };

    const result = await AdminManagementService.revokeSession(
      id, session_id, req.admin.admin_id, requestInfo
    );

    return sendSuccess(res, 200, 'Session revoked successfully', result, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.revokeSession', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to revoke session', 'SESSION_REVOKE_FAILED', null, req);
  }
};

// ==================== UPDATE ADMIN STATUS ====================

const updateAdminStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array(), req);
    }

    const { id } = req.params;
    const { status } = req.body;
    const requestInfo = { ip: req.ip, userAgent: req.get('user-agent'), url: req.originalUrl };

    const result = await AdminManagementService.updateAdminStatus(
      id, status, req.admin.admin_id, requestInfo
    );

    return sendSuccess(res, 200, 'Admin status updated successfully', result, { req });

  } catch (error) {
    structuredLogger.error('AdminManagementController.updateAdminStatus', { error: error.message, requestId: req.requestId });
    return sendError(res, statusFor(error.message), error.message || 'Failed to update admin status', 'ADMIN_STATUS_UPDATE_FAILED', null, req);
  }
};

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  blockAdmin,
  unblockAdmin,
  resetAdminPassword,
  deleteAdmin,
  getAdminActivityLogs,
  getAdminStatistics,
  assignBranch,
  transferBranch,
  removeBranch,
  getAssignmentHistory,
  getLoginHistory,
  getPermissions,
  updatePermissions,
  getActiveSessions,
  revokeSession,
  updateAdminStatus
};

