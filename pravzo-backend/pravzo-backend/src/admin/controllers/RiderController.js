const { validationResult } = require('express-validator');
const RiderService = require('../services/RiderService');
const { successResponse, errorResponse } = require('../../../src/utils/response');
const logger = require('../../../src/utils/logger');
const { exportToFile, validateExportFormat } = require('../../../src/utils/exportHelper');

class RiderController {
  // Get paginated riders list
  async getRiders(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        search: req.query.search,
        status: req.query.status,
        city: req.query.city,
        vehicleType: req.query.vehicleType,
        onlineStatus: req.query.onlineStatus,
        availability: req.query.availability,
        kycStatus: req.query.kycStatus,
        minRating: req.query.minRating,
        maxRating: req.query.maxRating,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await RiderService.getRiders(filters, pagination);

      return successResponse(res, 200, 'Riders retrieved successfully', result);
    } catch (error) {
      logger.error('Get Riders Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get rider by ID
  async getRiderById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);

      const rider = await RiderService.getRiderById(riderId);

      return successResponse(res, 200, 'Rider profile retrieved successfully', rider);
    } catch (error) {
      logger.error('Get Rider By ID Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }

  // Block rider
  async blockRider(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const { reason } = req.body;
      const adminId = req.admin.admin_id;

      await RiderService.blockRider(riderId, reason, adminId);

      return successResponse(res, 200, 'Rider blocked successfully');
    } catch (error) {
      logger.error('Block Rider Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Unblock rider
  async unblockRider(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;

      await RiderService.unblockRider(riderId, adminId);

      return successResponse(res, 200, 'Rider unblocked successfully');
    } catch (error) {
      logger.error('Unblock Rider Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Update rider status
  async updateRiderStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const { status } = req.body;
      const adminId = req.admin.admin_id;

      await RiderService.updateRiderStatus(riderId, status, adminId);

      return successResponse(res, 200, 'Rider status updated successfully');
    } catch (error) {
      logger.error('Update Rider Status Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Update rider KYC
  async updateRiderKYC(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const { kycStatus, remarks } = req.body;
      const adminId = req.admin.admin_id;

      await RiderService.updateRiderKYC(riderId, kycStatus, adminId, remarks);

      return successResponse(res, 200, 'Rider KYC updated successfully');
    } catch (error) {
      logger.error('Update Rider KYC Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Update rider vehicle
  async updateRiderVehicle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const { vehicleId, action } = req.body;
      const adminId = req.admin.admin_id;

      await RiderService.updateRiderVehicle(riderId, vehicleId, action, adminId);

      return successResponse(res, 200, 'Rider vehicle updated successfully');
    } catch (error) {
      logger.error('Update Rider Vehicle Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Update rider location
  async updateRiderLocation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const { latitude, longitude, speed, heading, battery } = req.body;
      const adminId = req.admin.admin_id;

      const locationData = {
        latitude,
        longitude,
        speed,
        heading,
        battery
      };

      await RiderService.updateRiderLocation(riderId, locationData, adminId);

      return successResponse(res, 200, 'Rider location updated successfully');
    } catch (error) {
      logger.error('Update Rider Location Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Update rider availability
  async updateRiderAvailability(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const { availability } = req.body;
      const adminId = req.admin.admin_id;

      await RiderService.updateRiderAvailability(riderId, availability, adminId);

      return successResponse(res, 200, 'Rider availability updated successfully');
    } catch (error) {
      logger.error('Update Rider Availability Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Get rider current booking
  async getRiderCurrentBooking(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);

      const result = await RiderService.getRiderCurrentBooking(riderId);

      return successResponse(res, 200, 'Current booking retrieved successfully', result);
    } catch (error) {
      logger.error('Get Rider Current Booking Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }

  // Get rider bookings
  async getRiderBookings(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };
      const filters = {
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await RiderService.getRiderBookings(riderId, pagination, filters);

      return successResponse(res, 200, 'Rider bookings retrieved successfully', result);
    } catch (error) {
      logger.error('Get Rider Bookings Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }

  // Get rider payments
  async getRiderPayments(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };
      const filters = {
        type: req.query.type
      };

      const result = await RiderService.getRiderPayments(riderId, pagination, filters);

      return successResponse(res, 200, 'Rider payments retrieved successfully', result);
    } catch (error) {
      logger.error('Get Rider Payments Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }

  // Get rider activity
  async getRiderActivity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit) || 20;

      const activities = await RiderService.getRiderActivity(riderId, limit);

      return successResponse(res, 200, 'Rider activity retrieved successfully', { activities });
    } catch (error) {
      logger.error('Get Rider Activity Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }

  // Get rider live location
  async getRiderLiveLocation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);

      const result = await RiderService.getRiderLiveLocation(riderId);

      return successResponse(res, 200, 'Rider live location retrieved successfully', result);
    } catch (error) {
      logger.error('Get Rider Live Location Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }

  // Get rider statistics
  async getRiderStatistics(req, res) {
    try {
      const statistics = await RiderService.getRiderStatistics();

      return successResponse(res, 200, 'Rider statistics retrieved successfully', { statistics });
    } catch (error) {
      logger.error('Get Rider Statistics Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Export riders
  async exportRiders(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      // CRIT-2 fix: validate format param before any service/DB call
      const { valid, fmt, error: fmtError } = validateExportFormat(req.query.format);
      if (!valid) {
        return errorResponse(res, 400, fmtError);
      }

      const filters = {
        status: req.query.status,
        city: req.query.city,
        kycStatus: req.query.kycStatus,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await RiderService.exportRiders(fmt, filters);

      if (!result.data || result.data.length === 0) {
        return errorResponse(res, 404, 'No riders found matching the filters');
      }

      await exportToFile(res, result.data, fmt, 'riders');
    } catch (error) {
      logger.error('Export Riders Controller Error:', error);
      // HIGH-1 fix: headers may be partially written for Excel
      if (res.headersSent) return;
      return errorResponse(res, 500, error.message);
    }
  }

  // ==================== ENTERPRISE RIDER MANAGEMENT CONTROLLERS ====================

  // Create rider
  async createRider(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderData = req.body;
      const adminId = req.admin.admin_id;

      const result = await RiderService.createRider(riderData, adminId);

      return successResponse(res, 201, 'Rider created successfully', result);
    } catch (error) {
      logger.error('Create Rider Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Update rider
  async updateRider(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const updateData = req.body;
      const adminId = req.admin.admin_id;

      await RiderService.updateRider(riderId, updateData, adminId);

      return successResponse(res, 200, 'Rider updated successfully');
    } catch (error) {
      logger.error('Update Rider Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 400, error.message);
    }
  }

  // Verify KYC
  async verifyKYC(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const { kycId, status, remarks, rejectionReason } = req.body;
      const adminId = req.admin.admin_id;

      await RiderService.verifyRiderKYC(riderId, kycId, status, adminId, remarks, rejectionReason);

      return successResponse(res, 200, 'Rider KYC verified successfully');
    } catch (error) {
      logger.error('Verify Rider KYC Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 400, error.message);
    }
  }

  // Assign branch
  async assignBranch(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const { branchId, assignmentType } = req.body;
      const adminId = req.admin.admin_id;

      const result = await RiderService.assignRiderToBranch(riderId, branchId, adminId, assignmentType);

      return successResponse(res, 200, 'Rider assigned to branch successfully', result);
    } catch (error) {
      logger.error('Assign Branch Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 400, error.message);
    }
  }

  // Transfer branch
  async transferBranch(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const { toBranchId, transferReason } = req.body;
      const adminId = req.admin.admin_id;

      await RiderService.transferRiderBranch(riderId, toBranchId, transferReason, adminId);

      return successResponse(res, 200, 'Rider transferred to new branch successfully');
    } catch (error) {
      logger.error('Transfer Branch Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 400, error.message);
    }
  }

  // Assign vehicle
  async assignVehicle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const { vehicleId, assignmentReason, odometerStart } = req.body;
      const adminId = req.admin.admin_id;

      await RiderService.assignVehicleToRider(riderId, vehicleId, assignmentReason, odometerStart, adminId);

      return successResponse(res, 200, 'Vehicle assigned to rider successfully');
    } catch (error) {
      logger.error('Assign Vehicle Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 400, error.message);
    }
  }

  // Remove vehicle
  async removeVehicle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const { removalReason, odometerEnd } = req.body;
      const adminId = req.admin.admin_id;

      await RiderService.removeVehicleFromRider(riderId, removalReason, odometerEnd, adminId);

      return successResponse(res, 200, 'Vehicle removed from rider successfully');
    } catch (error) {
      logger.error('Remove Vehicle Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 400, error.message);
    }
  }

  // Get rider vehicle
  async getRiderVehicle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);

      const result = await RiderService.getRiderVehicle(riderId);

      return successResponse(res, 200, 'Rider vehicle retrieved successfully', result);
    } catch (error) {
      logger.error('Get Rider Vehicle Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }

  // Get rider performance
  async getRiderPerformance(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const periodType = req.query.periodType || 'MONTHLY';

      const result = await RiderService.getRiderPerformance(riderId, periodType);

      return successResponse(res, 200, 'Rider performance retrieved successfully', result);
    } catch (error) {
      logger.error('Get Rider Performance Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }

  // Get rider earnings
  async getRiderEarnings(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);

      const result = await RiderService.getRiderEarnings(riderId);

      return successResponse(res, 200, 'Rider earnings retrieved successfully', result);
    } catch (error) {
      logger.error('Get Rider Earnings Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }

  // Get rider wallet
  async getRiderWallet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);

      const result = await RiderService.getRiderWallet(riderId);

      return successResponse(res, 200, 'Rider wallet retrieved successfully', result);
    } catch (error) {
      logger.error('Get Rider Wallet Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }

  // Get rider wallet transactions
  async getRiderWalletTransactions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await RiderService.getRiderWalletTransactionsDetailed(riderId, pagination);

      return successResponse(res, 200, 'Rider wallet transactions retrieved successfully', result);
    } catch (error) {
      logger.error('Get Rider Wallet Transactions Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }

  // Get rider jobs
  async getRiderJobs(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const filters = {
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await RiderService.getRiderJobs(riderId, filters);

      return successResponse(res, 200, 'Rider jobs retrieved successfully', result);
    } catch (error) {
      logger.error('Get Rider Jobs Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }

  // Get rider activity timeline
  async getRiderActivityTimeline(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const filters = {
        activityType: req.query.activityType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await RiderService.getRiderActivityTimeline(riderId, filters);

      return successResponse(res, 200, 'Rider activity timeline retrieved successfully', result);
    } catch (error) {
      logger.error('Get Rider Activity Timeline Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }

  // Get rider login history
  async getRiderLoginHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit) || 20;

      const result = await RiderService.getRiderLoginHistory(riderId, limit);

      return successResponse(res, 200, 'Rider login history retrieved successfully', result);
    } catch (error) {
      logger.error('Get Rider Login History Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }

  // Get rider documents
  async getRiderDocuments(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const riderId = parseInt(req.params.id);

      const result = await RiderService.getRiderDocumentsDetailed(riderId);

      return successResponse(res, 200, 'Rider documents retrieved successfully', result);
    } catch (error) {
      logger.error('Get Rider Documents Controller Error:', error);
      return errorResponse(res, error.message === 'Rider not found' ? 404 : 500, error.message);
    }
  }
}

module.exports = new RiderController();
