const { validationResult } = require('express-validator');
const UserService = require('../services/UserService');
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../../../src/utils/responseWrapper');

// Aliases used throughout this controller
const successResponse = (res, status, message, data) => sendSuccess(res, status, message, data);
const errorResponse   = (res, status, message, details) => sendError(res, status, message, null, details);
const DTO = require('../../../src/utils/dtoMapper');
const logger = require('../../../src/utils/logger');
const { exportToFile, validateExportFormat } = require('../../../src/utils/exportHelper');
const { sanitizePagination } = require('../../../src/utils/helpers');

class UserController {
  // Get paginated users list
  async getUsers(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const filters = {
        search: req.query.search,
        status: req.query.status,
        role: req.query.role,
        city: req.query.city,
        gender: req.query.gender,
        verified: req.query.verified,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const pagination = sanitizePagination(req.query.page, req.query.limit);

      const result = await UserService.getUsers(filters, pagination);

      // Apply DTO mapping — returns frontend-compatible field names
      return sendSuccess(res, 200, 'Users retrieved successfully',
        DTO.toUserList(result),
        { req, pagination: result.pagination }
      );
    } catch (error) {
      logger.error('Get Users Controller Error:', error);
      return sendError(res, 500, error.message, 'USERS_FETCH_FAILED', null, req);
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const cleanDigits = String(req.params.id).replace(/\D/g, '');
      const userId = parseInt(cleanDigits, 10);
      if (isNaN(userId)) {
        return sendNotFound(res, 'User', req);
      }
      const user = await UserService.getUserById(userId);

      // UserService returns { profile, addresses, documents, ... }
      // DTO.toUser expects a flat DB row — pass user.profile (the raw-ish flat object)
      const transformed = DTO.toUser(user.profile || user);
      // Attach extra data that frontend needs
      transformed.statistics  = user.statistics  || null;
      transformed.addresses   = user.addresses   || [];
      transformed.documents   = user.documents   || [];
      transformed.devices     = user.devices     || [];
      transformed.walletTransactions = user.walletTransactions || [];

      return sendSuccess(res, 200, 'User profile retrieved successfully', transformed, { req });
    } catch (error) {
      logger.error('Get User By ID Controller Error:', error);
      if (error.message === 'User not found') return sendNotFound(res, 'User', req);
      return sendError(res, 500, error.message, 'USER_FETCH_FAILED', null, req);
    }
  }

  // Block user
  async blockUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const { reason } = req.body;
      const adminId = req.admin.admin_id;

      await UserService.blockUser(userId, reason, adminId);

      return successResponse(res, 200, 'User blocked successfully');
    } catch (error) {
      logger.error('Block User Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Unblock user
  async unblockUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;

      await UserService.unblockUser(userId, adminId);

      return successResponse(res, 200, 'User unblocked successfully');
    } catch (error) {
      logger.error('Unblock User Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Verify user
  async verifyUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const { remarks } = req.body;
      const adminId = req.admin.admin_id;

      await UserService.verifyUser(userId, adminId, remarks);

      return successResponse(res, 200, 'User verified successfully');
    } catch (error) {
      logger.error('Verify User Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Update user status
  async updateUserStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const { status } = req.body;
      const adminId = req.admin.admin_id;

      await UserService.updateUserStatus(userId, status, adminId);

      return successResponse(res, 200, 'User status updated successfully');
    } catch (error) {
      logger.error('Update User Status Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Delete user (soft delete)
  async deleteUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const { reason } = req.body;
      const adminId = req.admin.admin_id;

      await UserService.deleteUser(userId, reason, adminId);

      return successResponse(res, 200, 'User deleted successfully');
    } catch (error) {
      logger.error('Delete User Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Export users
  async exportUsers(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const { valid, fmt, error: fmtError } = validateExportFormat(req.query.format);
      if (!valid) {
        return errorResponse(res, 400, fmtError);
      }

      const filters = {
        status: req.query.status,
        role: req.query.role,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await UserService.exportUsers(fmt, filters);

      if (!result.data || result.data.length === 0) {
        return errorResponse(res, 404, 'No users found matching the filters');
      }

      await exportToFile(res, result.data, fmt, 'users');
    } catch (error) {
      logger.error('Export Users Controller Error:', error);
      // HIGH-1 fix: headers may be partially written for Excel — cannot send JSON error
      if (res.headersSent) return;
      return errorResponse(res, 500, error.message);
    }
  }

  // Get user login history
  async getUserLoginHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await UserService.getUserLoginHistory(userId, pagination);

      return successResponse(res, 200, 'Login history retrieved successfully', result);
    } catch (error) {
      logger.error('Get User Login History Controller Error:', error);
      return errorResponse(res, error.message === 'User not found' ? 404 : 500, error.message);
    }
  }

  // Get user bookings
  async getUserBookings(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };
      const filters = {
        status: req.query.status
      };

      const result = await UserService.getUserBookings(userId, pagination, filters);

      return successResponse(res, 200, 'User bookings retrieved successfully', result);
    } catch (error) {
      logger.error('Get User Bookings Controller Error:', error);
      return errorResponse(res, error.message === 'User not found' ? 404 : 500, error.message);
    }
  }

  // Get user payments
  async getUserPayments(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };
      const filters = {
        type: req.query.type
      };

      const result = await UserService.getUserPayments(userId, pagination, filters);

      return successResponse(res, 200, 'User payments retrieved successfully', result);
    } catch (error) {
      logger.error('Get User Payments Controller Error:', error);
      return errorResponse(res, error.message === 'User not found' ? 404 : 500, error.message);
    }
  }

  // Get user activity
  async getUserActivity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit) || 20;

      const activities = await UserService.getUserActivity(userId, limit);

      return successResponse(res, 200, 'User activity retrieved successfully', { activities });
    } catch (error) {
      logger.error('Get User Activity Controller Error:', error);
      return errorResponse(res, error.message === 'User not found' ? 404 : 500, error.message);
    }
  }

  // Get user statistics
  async getUserStatistics(req, res) {
    try {
      const statistics = await UserService.getUserStatistics();

      return successResponse(res, 200, 'User statistics retrieved successfully', { statistics });
    } catch (error) {
      logger.error('Get User Statistics Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // ==================== ENTERPRISE USER MANAGEMENT ====================
  // ==================== UPDATE USER ====================

  async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const updateData = req.body;
      const adminId = req.admin.admin_id;

      await UserService.updateUser(userId, updateData, adminId);

      return successResponse(res, 200, 'User updated successfully');
    } catch (error) {
      logger.error('Update User Controller Error:', error);
      return errorResponse(res, error.message === 'User not found' ? 404 : 400, error.message);
    }
  }

  // ==================== KYC VERIFICATION ====================

  async verifyKYC(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const { kycId, status, remarks, rejectionReason } = req.body;
      const adminId = req.admin.admin_id;

      await UserService.verifyKYC(kycId, status, adminId, remarks, rejectionReason);

      return successResponse(res, 200, `KYC ${status.toLowerCase()} successfully`);
    } catch (error) {
      logger.error('Verify KYC Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  async getKYCDetails(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);

      const kycRecords = await UserService.getKYCDetails(userId);

      return successResponse(res, 200, 'KYC details retrieved successfully', { kyc: kycRecords });
    } catch (error) {
      logger.error('Get KYC Details Controller Error:', error);
      return errorResponse(res, error.message === 'User not found' ? 404 : 500, error.message);
    }
  }

  // ==================== WALLET MANAGEMENT ====================

  async getWallet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);

      const wallet = await UserService.getWallet(userId);

      return successResponse(res, 200, 'Wallet details retrieved successfully', { wallet });
    } catch (error) {
      logger.error('Get Wallet Controller Error:', error);
      return errorResponse(res, error.message === 'User not found' ? 404 : 500, error.message);
    }
  }

  async getWalletTransactions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };
      const filters = {
        type: req.query.type,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await UserService.getWalletTransactions(userId, pagination, filters);

      return successResponse(res, 200, 'Wallet transactions retrieved successfully', result);
    } catch (error) {
      logger.error('Get Wallet Transactions Controller Error:', error);
      return errorResponse(res, error.message === 'User not found' ? 404 : 500, error.message);
    }
  }

  async creditWallet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const { amount, description, referenceType, referenceId, paymentMethod, paymentReference } = req.body;
      const adminId = req.admin.admin_id;

      const result = await UserService.creditWallet(
        userId, amount, description, referenceType, referenceId, 
        adminId, paymentMethod, paymentReference
      );

      return successResponse(res, 200, 'Wallet credited successfully', result);
    } catch (error) {
      logger.error('Credit Wallet Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  async debitWallet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const { amount, description, referenceType, referenceId, notes } = req.body;
      const adminId = req.admin.admin_id;

      const result = await UserService.debitWallet(
        userId, amount, description, referenceType, referenceId, adminId, notes
      );

      return successResponse(res, 200, 'Wallet debited successfully', result);
    } catch (error) {
      logger.error('Debit Wallet Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // ==================== BRANCH TRANSFER ====================

  async transferBranch(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const { branchId, reason, notes } = req.body;
      const adminId = req.admin.admin_id;

      const validation = await UserService.transferBranch(userId, branchId, reason, notes, adminId);

      return successResponse(res, 200, 'Branch transfer completed successfully', { validation });
    } catch (error) {
      logger.error('Transfer Branch Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  async getBranchAssignmentHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);

      const history = await UserService.getBranchAssignmentHistory(userId);

      return successResponse(res, 200, 'Branch assignment history retrieved successfully', { history });
    } catch (error) {
      logger.error('Get Branch Assignment History Controller Error:', error);
      return errorResponse(res, error.message === 'User not found' ? 404 : 500, error.message);
    }
  }

  // ==================== ACTIVITY TIMELINE ====================

  async getActivityTimeline(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };
      const filters = {
        activityType: req.query.activityType,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await UserService.getActivityTimeline(userId, pagination, filters);

      return successResponse(res, 200, 'Activity timeline retrieved successfully', result);
    } catch (error) {
      logger.error('Get Activity Timeline Controller Error:', error);
      return errorResponse(res, error.message === 'User not found' ? 404 : 500, error.message);
    }
  }

  // ==================== LOGIN HISTORY ====================

  async getLoginHistoryDetailed(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };
      const filters = {
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await UserService.getLoginHistoryDetailed(userId, pagination, filters);

      return successResponse(res, 200, 'Login history retrieved successfully', result);
    } catch (error) {
      logger.error('Get Login History Detailed Controller Error:', error);
      return errorResponse(res, error.message === 'User not found' ? 404 : 500, error.message);
    }
  }

  // ==================== DEVICE MANAGEMENT ====================

  async getDevices(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);

      const devices = await UserService.getDevices(userId);

      return successResponse(res, 200, 'Devices retrieved successfully', { devices });
    } catch (error) {
      logger.error('Get Devices Controller Error:', error);
      return errorResponse(res, error.message === 'User not found' ? 404 : 500, error.message);
    }
  }

  // ==================== PASSWORD RESET ====================

  async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;

      const result = await UserService.resetPassword(userId, adminId);

      return successResponse(res, 200, 'Password reset successfully', result);
    } catch (error) {
      logger.error('Reset Password Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // ==================== RENTALS & JOBS ====================

  async getUserRentals(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };
      const filters = {
        status: req.query.status
      };

      const result = await UserService.getUserRentals(userId, pagination, filters);

      return successResponse(res, 200, 'User rentals retrieved successfully', result);
    } catch (error) {
      logger.error('Get User Rentals Controller Error:', error);
      return errorResponse(res, error.message === 'User not found' ? 404 : 500, error.message);
    }
  }

  async getUserJobs(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };
      const filters = {
        status: req.query.status
      };

      const result = await UserService.getUserJobs(userId, pagination, filters);

      return successResponse(res, 200, 'User jobs retrieved successfully', result);
    } catch (error) {
      logger.error('Get User Jobs Controller Error:', error);
      return errorResponse(res, error.message === 'User not found' ? 404 : 500, error.message);
    }
  }

  async getDocuments(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);

      // Route through UserService to respect the Controller → Service → Repository pattern
      const documents = await UserService.getDocuments(userId);

      return successResponse(res, 200, 'Documents retrieved successfully', { documents });
    } catch (error) {
      logger.error('Get Documents Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }
}

module.exports = new UserController();

