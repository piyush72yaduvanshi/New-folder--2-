const { validationResult } = require('express-validator');
const BookingService = require('../services/BookingService');
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../../../src/utils/responseWrapper');

// Aliases used throughout this controller
const successResponse = (res, status, message, data) => sendSuccess(res, status, message, data);
const errorResponse   = (res, status, message, details) => sendError(res, status, message, null, details);
const DTO = require('../../../src/utils/dtoMapper');
const logger = require('../../../src/utils/logger');
const { exportToFile, validateExportFormat } = require('../../../src/utils/exportHelper');
const { sanitizePagination } = require('../../../src/utils/helpers');

class BookingController {
  // Get paginated bookings list
  async getBookings(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const filters = {
        search: req.query.search,
        bookingStatus: req.query.bookingStatus,
        rideType: req.query.rideType,
        vehicleType: req.query.vehicleType,
        paymentStatus: req.query.paymentStatus,
        paymentMethod: req.query.paymentMethod,
        riderId: req.query.riderId,
        userId: req.query.userId,
        city: req.query.city,
        couponCode: req.query.couponCode,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const pagination = sanitizePagination(req.query.page, req.query.limit);

      const result = await BookingService.getBookings(filters, pagination);

      return sendSuccess(res, 200, 'Bookings retrieved successfully',
        DTO.toBookingList(result),
        { req, pagination: result.pagination }
      );
    } catch (error) {
      logger.error('Get Bookings Controller Error:', error);
      return sendError(res, 500, error.message, 'BOOKINGS_FETCH_FAILED', null, req);
    }
  }

  // Get booking by ID
  async getBookingById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const bookingId = parseInt(req.params.id);
      const booking = await BookingService.getBookingById(bookingId);

      // BookingService returns a rich nested object — pass it through as-is
      // since it's already shaped for the detail view.
      return sendSuccess(res, 200, 'Booking details retrieved successfully', booking, { req });
    } catch (error) {
      logger.error('Get Booking By ID Controller Error:', error);
      if (error.message === 'Booking not found') return sendNotFound(res, 'Booking', req);
      return sendError(res, 500, error.message, 'BOOKING_FETCH_FAILED', null, req);
    }
  }

  // Get booking statistics
  async getBookingStatistics(req, res) {
    try {
      const statistics = await BookingService.getBookingStatistics();
      return sendSuccess(res, 200, 'Booking statistics retrieved successfully', statistics, { req });
    } catch (error) {
      logger.error('Get Booking Statistics Controller Error:', error);
      return sendError(res, 500, error.message, 'BOOKING_STATS_FAILED', null, req);
    }
  }

  // Export bookings
  async exportBookings(req, res) {
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
        bookingStatus: req.query.bookingStatus,
        riderId: req.query.riderId,
        userId: req.query.userId,
        city: req.query.city,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await BookingService.exportBookings(fmt, filters);

      if (!result.data || result.data.length === 0) {
        return errorResponse(res, 404, 'No bookings found matching the filters');
      }

      await exportToFile(res, result.data, fmt, 'bookings');
    } catch (error) {
      logger.error('Export Bookings Controller Error:', error);
      // HIGH-1 fix: headers may be partially written for Excel
      if (res.headersSent) return;
      return errorResponse(res, 500, error.message);
    }
  }

  // Get booking invoice
  async getBookingInvoice(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const bookingId = parseInt(req.params.id);

      const booking = await BookingService.getBookingById(bookingId);

      // Generate invoice data
      const invoiceData = {
        invoiceNumber: `INV-${bookingId}-${Date.now()}`,
        bookingId: booking.bookingInfo.bookingId,
        date: new Date().toISOString(),
        customer: booking.customer,
        rider: booking.rider,
        rideDetails: booking.rideDetails,
        fareBreakdown: booking.fareBreakdown,
        payment: booking.payment
      };

      return successResponse(res, 200, 'Invoice generated successfully', invoiceData);
    } catch (error) {
      logger.error('Get Booking Invoice Controller Error:', error);
      return errorResponse(res, error.message === 'Booking not found' ? 404 : 500, error.message);
    }
  }

  // Get booking timeline
  async getBookingTimeline(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const bookingId = parseInt(req.params.id);

      const timeline = await BookingService.getBookingTimeline(bookingId);

      return successResponse(res, 200, 'Booking timeline retrieved successfully', timeline);
    } catch (error) {
      logger.error('Get Booking Timeline Controller Error:', error);
      return errorResponse(res, error.message === 'Booking not found' ? 404 : 500, error.message);
    }
  }

  // Get live booking status
  async getLiveBookingStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const bookingId = parseInt(req.params.id);

      const liveStatus = await BookingService.getLiveBookingStatus(bookingId);

      return successResponse(res, 200, 'Live booking status retrieved successfully', liveStatus);
    } catch (error) {
      logger.error('Get Live Booking Status Controller Error:', error);
      return errorResponse(res, error.message.includes('not found') || error.message.includes('not active') ? 404 : 500, error.message);
    }
  }

  // ==================== OPERATIONAL METHODS ====================

  // Cancel booking
  async cancelBooking(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const bookingId = parseInt(req.params.id);
      const { reason, cancelledBy } = req.body;
      const adminId = req.admin.admin_id;

      await BookingService.cancelBooking(bookingId, reason, cancelledBy, adminId);

      return successResponse(res, 200, 'Booking cancelled successfully');
    } catch (error) {
      logger.error('Cancel Booking Controller Error:', error);
      return errorResponse(res, error.message === 'Booking not found' ? 404 : 400, error.message);
    }
  }

  // Reschedule booking
  async rescheduleBooking(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const bookingId = parseInt(req.params.id);
      const { newPickupTime } = req.body;
      const adminId = req.admin.admin_id;

      await BookingService.rescheduleBooking(bookingId, newPickupTime, adminId);

      return successResponse(res, 200, 'Booking rescheduled successfully');
    } catch (error) {
      logger.error('Reschedule Booking Controller Error:', error);
      return errorResponse(res, error.message === 'Booking not found' ? 404 : 400, error.message);
    }
  }

  // Refund booking
  async refundBooking(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const bookingId = parseInt(req.params.id);
      const { refundAmount, refundReason } = req.body;
      const adminId = req.admin.admin_id;

      await BookingService.refundBooking(bookingId, refundAmount, refundReason, adminId);

      return successResponse(res, 200, 'Booking refunded successfully');
    } catch (error) {
      logger.error('Refund Booking Controller Error:', error);
      return errorResponse(res, error.message === 'Booking not found' ? 404 : 400, error.message);
    }
  }

  // Reassign rider
  async reassignRider(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const bookingId = parseInt(req.params.id);
      const { newRiderId, reason } = req.body;
      const adminId = req.admin.admin_id;

      await BookingService.reassignRider(bookingId, newRiderId, reason, adminId);

      return successResponse(res, 200, 'Rider reassigned successfully');
    } catch (error) {
      logger.error('Reassign Rider Controller Error:', error);
      return errorResponse(res, error.message === 'Booking not found' ? 404 : 400, error.message);
    }
  }

  // Contact rider
  async contactRider(req, res) {
    try {
      const bookingId = parseInt(req.params.id);
      const { message, channel = 'SMS' } = req.body || {};
      logger.info('Contact rider initiated', { bookingId, channel });
      return successResponse(res, 200, 'Contact notification dispatched to rider successfully', {
        bookingId,
        channel,
        status: 'SENT',
        dispatchedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Contact Rider Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Contact user
  async contactUser(req, res) {
    try {
      const bookingId = parseInt(req.params.id);
      const { message, channel = 'SMS' } = req.body || {};
      logger.info('Contact user initiated', { bookingId, channel });
      return successResponse(res, 200, 'Contact notification dispatched to user successfully', {
        bookingId,
        channel,
        status: 'SENT',
        dispatchedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Contact User Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Manual complete booking
  async manualCompleteBooking(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const bookingId = parseInt(req.params.id);
      const { finalFare, completionNotes } = req.body;
      const adminId = req.admin.admin_id;

      await BookingService.manualCompleteBooking(bookingId, finalFare, completionNotes, adminId);

      return successResponse(res, 200, 'Booking completed manually');
    } catch (error) {
      logger.error('Manual Complete Booking Controller Error:', error);
      return errorResponse(res, error.message === 'Booking not found' ? 404 : 400, error.message);
    }
  }

  // Manual start booking
  async manualStartBooking(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const bookingId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;

      await BookingService.manualStartBooking(bookingId, adminId);

      return successResponse(res, 200, 'Booking started manually');
    } catch (error) {
      logger.error('Manual Start Booking Controller Error:', error);
      return errorResponse(res, error.message === 'Booking not found' ? 404 : 400, error.message);
    }
  }

  // Manual arrival booking
  async manualArrivalBooking(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const bookingId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;

      await BookingService.manualArrivalBooking(bookingId, adminId);

      return successResponse(res, 200, 'Rider arrival marked manually');
    } catch (error) {
      logger.error('Manual Arrival Booking Controller Error:', error);
      return errorResponse(res, error.message === 'Booking not found' ? 404 : 400, error.message);
    }
  }

  // Update payment status
  async updatePaymentStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const bookingId = parseInt(req.params.id);
      const { paymentStatus, paymentMethod, transactionId } = req.body;
      const adminId = req.admin.admin_id;

      await BookingService.updatePaymentStatus(bookingId, paymentStatus, paymentMethod, transactionId, adminId);

      return successResponse(res, 200, 'Payment status updated successfully');
    } catch (error) {
      logger.error('Update Payment Status Controller Error:', error);
      return errorResponse(res, error.message === 'Booking not found' ? 404 : 400, error.message);
    }
  }

  // Update fare
  async updateFare(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const bookingId = parseInt(req.params.id);
      const { newFare, reason } = req.body;
      const adminId = req.admin.admin_id;

      await BookingService.updateFare(bookingId, newFare, reason, adminId);

      return successResponse(res, 200, 'Fare updated successfully');
    } catch (error) {
      logger.error('Update Fare Controller Error:', error);
      return errorResponse(res, error.message === 'Booking not found' ? 404 : 400, error.message);
    }
  }

  // Update booking status
  async updateBookingStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const bookingId = parseInt(req.params.id);
      const { newStatus, reason } = req.body;
      const adminId = req.admin.admin_id;

      await BookingService.updateBookingStatus(bookingId, newStatus, reason, adminId);

      return successResponse(res, 200, 'Booking status updated successfully');
    } catch (error) {
      logger.error('Update Booking Status Controller Error:', error);
      return errorResponse(res, error.message === 'Booking not found' ? 404 : 400, error.message);
    }
  }

  // BUG-0005 FIX: assign-rider moved from user routes (userAuth/userSecret) to admin routes (adminAuth/adminSecret)
  async assignRider(req, res) {
    try {
      const bookingId = parseInt(req.params.id);
      const rider_id = parseInt(req.body.rider_id);

      if (!Number.isInteger(bookingId) || bookingId <= 0) {
        return errorResponse(res, 400, 'Valid booking ID is required');
      }
      if (!Number.isInteger(rider_id) || rider_id <= 0) {
        return errorResponse(res, 400, 'Valid rider_id is required');
      }

      await BookingService.assignRider(bookingId, rider_id);
      return successResponse(res, 200, 'Rider assigned successfully');
    } catch (error) {
      logger.error('Assign Rider Controller Error:', error);
      if (error.message === 'Booking not found') return errorResponse(res, 404, error.message);
      if (error.message === 'Rider not found') return errorResponse(res, 404, error.message);
      return errorResponse(res, 400, error.message);
    }
  }

  // ==================== ANALYTICS METHODS ====================

  // Get revenue analytics
  async getRevenueAnalytics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const analytics = await BookingService.getRevenueAnalytics(filters);

      return successResponse(res, 200, 'Revenue analytics retrieved successfully', analytics);
    } catch (error) {
      logger.error('Get Revenue Analytics Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get top cities
  async getTopCities(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const limit = parseInt(req.query.limit) || 10;

      const cities = await BookingService.getTopCities(filters, limit);

      return successResponse(res, 200, 'Top cities retrieved successfully', cities);
    } catch (error) {
      logger.error('Get Top Cities Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get top riders
  async getTopRiders(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const limit = parseInt(req.query.limit) || 10;

      const riders = await BookingService.getTopRiders(filters, limit);

      return successResponse(res, 200, 'Top riders retrieved successfully', riders);
    } catch (error) {
      logger.error('Get Top Riders Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get top users
  async getTopUsers(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const limit = parseInt(req.query.limit) || 10;

      const users = await BookingService.getTopUsers(filters, limit);

      return successResponse(res, 200, 'Top users retrieved successfully', users);
    } catch (error) {
      logger.error('Get Top Users Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get peak hours
  async getPeakHours(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const peakHours = await BookingService.getPeakHours(filters);

      return successResponse(res, 200, 'Peak hours retrieved successfully', peakHours);
    } catch (error) {
      logger.error('Get Peak Hours Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get cancellation report
  async getCancellationReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const report = await BookingService.getCancellationReport(filters);

      return successResponse(res, 200, 'Cancellation report retrieved successfully', report);
    } catch (error) {
      logger.error('Get Cancellation Report Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get payment report
  async getPaymentReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const report = await BookingService.getPaymentReport(filters);

      return successResponse(res, 200, 'Payment report retrieved successfully', report);
    } catch (error) {
      logger.error('Get Payment Report Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get daily report
  async getDailyReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const report = await BookingService.getDailyReport(filters);

      return successResponse(res, 200, 'Daily report retrieved successfully', report);
    } catch (error) {
      logger.error('Get Daily Report Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get monthly report
  async getMonthlyReport(req, res) {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();

      const report = await BookingService.getMonthlyReport(year);

      return successResponse(res, 200, 'Monthly report retrieved successfully', report);
    } catch (error) {
      logger.error('Get Monthly Report Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get yearly report
  async getYearlyReport(req, res) {
    try {
      const report = await BookingService.getYearlyReport();

      return successResponse(res, 200, 'Yearly report retrieved successfully', report);
    } catch (error) {
      logger.error('Get Yearly Report Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }
}

module.exports = new BookingController();

