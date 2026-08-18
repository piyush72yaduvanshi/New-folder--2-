const { validationResult } = require('express-validator');
const RentalService = require('../services/RentalService');
const { successResponse, errorResponse } = require('../../../src/utils/response');
const logger = require('../../../src/utils/logger');

// Map common error messages to HTTP status codes
function rentalStatus(msg) {
  if (!msg) return 500;
  if (msg.includes('not found') || msg.includes('Not found')) return 404;
  if (msg.includes('already') || msg.includes('cannot') || msg.includes('Invalid') || msg.includes('not available') || msg.includes('must be') || msg.includes('state') || msg.includes('State')) return 400;
  return 500;
}

class RentalController {
  // Get paginated rentals list
  async getRentals(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        search: req.query.search,
        status: req.query.status,
        branchId: req.query.branchId ? parseInt(req.query.branchId) : null,
        vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId) : null,
        userId: req.query.userId ? parseInt(req.query.userId) : null,
        paymentStatus: req.query.paymentStatus,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await RentalService.getRentals(filters, pagination);
      return successResponse(res, 200, 'Rentals list retrieved successfully', result);
    } catch (error) {
      logger.error('RentalController - Get Rentals Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get rental by ID
  async getRentalById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const rentalId = parseInt(req.params.id);
      const rental = await RentalService.getRentalById(rentalId);
      return successResponse(res, 200, 'Rental details retrieved successfully', rental);
    } catch (error) {
      logger.error('RentalController - Get Rental By ID Error:', error);
      const statusCode = error.message === 'Rental not found' ? 404 : 500;
      return errorResponse(res, statusCode, error.message);
    }
  }

  // Generate pickup OTP
  async generatePickupOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const rentalId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;

      const result = await RentalService.generatePickupOTP(rentalId, adminId);
      return successResponse(res, 200, 'Pickup OTP generated successfully', result);
    } catch (error) {
      logger.error('RentalController - Generate OTP Error:', error);
      return errorResponse(res, rentalStatus(error.message), error.message);
    }
  }
  async pickupRental(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const rentalId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;
      const pickupData = req.body;

      const result = await RentalService.pickupRental(rentalId, pickupData, adminId);
      return successResponse(res, 200, 'Vehicle picked up and rental marked active', result);
    } catch (error) {
      logger.error('RentalController - Pickup Rental Error:', error);
      return errorResponse(res, rentalStatus(error.message), error.message);
    }
  }

  // Return transition
  async returnRental(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const rentalId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;
      const returnData = req.body;

      const result = await RentalService.returnRental(rentalId, returnData, adminId);
      return successResponse(res, 200, 'Vehicle returned and rental completed', result);
    } catch (error) {
      logger.error('RentalController - Return Rental Error:', error);
      return errorResponse(res, rentalStatus(error.message), error.message);
    }
  }

  // Extend rental duration
  async extendRental(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const rentalId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;
      const extensionData = req.body;

      const result = await RentalService.extendRental(rentalId, extensionData, adminId);
      return successResponse(res, 200, 'Rental duration extended successfully', result);
    } catch (error) {
      logger.error('RentalController - Extend Rental Error:', error);
      return errorResponse(res, rentalStatus(error.message), error.message);
    }
  }

  // Cancel rental
  async cancelRental(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const rentalId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;
      const { reason } = req.body;

      const result = await RentalService.cancelRental(rentalId, reason, adminId);
      return successResponse(res, 200, 'Rental cancelled successfully', result);
    } catch (error) {
      logger.error('RentalController - Cancel Rental Error:', error);
      return errorResponse(res, rentalStatus(error.message), error.message);
    }
  }
  async forceCloseRental(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const rentalId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;
      const { reason } = req.body;

      const result = await RentalService.forceCloseRental(rentalId, reason, adminId);
      return successResponse(res, 200, 'Rental force closed successfully', result);
    } catch (error) {
      logger.error('RentalController - Force Close Rental Error:', error);
      return errorResponse(res, rentalStatus(error.message), error.message);
    }
  }

  // Get overdue rentals
  async getOverdueRentals(req, res) {
    try {
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await RentalService.getOverdueRentals(pagination);
      return successResponse(res, 200, 'Overdue rentals retrieved successfully', result);
    } catch (error) {
      logger.error('RentalController - Get Overdue Rentals Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get invoice details
  async getRentalInvoice(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const rentalId = parseInt(req.params.id);
      const result = await RentalService.getRentalInvoice(rentalId);
      return successResponse(res, 200, 'Rental invoice retrieved successfully', result);
    } catch (error) {
      logger.error('RentalController - Get Rental Invoice Error:', error);
      const statusCode = error.message.includes('Invoice not found') ? 404 : 500;
      return errorResponse(res, statusCode, error.message);
    }
  }

  // Get payment history
  async getPaymentHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const rentalId = parseInt(req.params.id);
      const result = await RentalService.getPaymentHistory(rentalId);
      return successResponse(res, 200, 'Rental payment history retrieved successfully', result);
    } catch (error) {
      logger.error('RentalController - Get Payment History Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get activity/timeline history
  async getTimeline(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const rentalId = parseInt(req.params.id);
      const result = await RentalService.getTimeline(rentalId);
      return successResponse(res, 200, 'Rental timeline retrieved successfully', result);
    } catch (error) {
      logger.error('RentalController - Get Timeline Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get damage reports
  async getDamageReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const rentalId = parseInt(req.params.id);
      const result = await RentalService.getDamageReport(rentalId);
      return successResponse(res, 200, 'Rental damage reports retrieved successfully', result);
    } catch (error) {
      logger.error('RentalController - Get Damage Report Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Record checklist
  async recordChecklist(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const rentalId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;
      const checklistData = req.body;

      const result = await RentalService.recordChecklist(rentalId, checklistData, adminId);
      return successResponse(res, 200, 'Checklist recorded successfully', result);
    } catch (error) {
      logger.error('RentalController - Record Checklist Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Record inspection
  async recordInspection(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const rentalId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;
      const inspectionData = req.body;

      const result = await RentalService.recordInspection(rentalId, inspectionData, adminId);
      return successResponse(res, 200, 'Inspection recorded successfully', result);
    } catch (error) {
      logger.error('RentalController - Record Inspection Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }
}

module.exports = new RentalController();

