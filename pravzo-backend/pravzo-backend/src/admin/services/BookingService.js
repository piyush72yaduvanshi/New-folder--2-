const BookingRepository = require('../repositories/BookingRepository');
const logger = require('../../../src/utils/logger');

class BookingService {
  // Get paginated bookings list
  async getBookings(filters, pagination) {
    try {

      return await BookingRepository.getBookings(filters, pagination);
    } catch (error) {
      logger.error('BookingService - Get Bookings Error:', error);
      throw new Error('Failed to fetch bookings');
    }
  }

  // Get booking by ID with complete details
  async getBookingById(bookingId) {
    try {
      let booking;
      try {
        booking = await BookingRepository.getBookingDetails(bookingId);
      } catch (repoErr) {
        console.error('DEBUG getBookingDetails REPO ERROR:', repoErr);
        throw repoErr;
      }

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Calculate ride metrics
      const totalTime = booking.completed_at && booking.picked_up_at
        ? Math.floor((new Date(booking.completed_at) - new Date(booking.picked_up_at)) / 1000 / 60)
        : booking.duration_minutes || 0;

      const waitingTime = booking.picked_up_at && booking.accepted_at
        ? Math.floor((new Date(booking.picked_up_at) - new Date(booking.accepted_at)) / 1000 / 60)
        : 0;

      return {
        bookingInfo: {
          bookingId: booking.trip_id,
          bookingStatus: booking.status,
          createdAt: booking.created_at,
          updatedAt: booking.updated_at
        },
        customer: booking.user_id ? {
          userId: booking.user_id,
          name: booking.user_name,
          phone: booking.user_phone,
          email: booking.user_email,
          photo: booking.user_photo,
          gender: booking.user_gender
        } : null,
        rider: booking.rider_id ? {
          riderId: booking.rider_id,
          name: booking.rider_name,
          phone: booking.rider_phone,
          email: booking.rider_email,
          riderCode: booking.rider_code,
          rating: parseFloat(booking.rider_rating || 0),
          photo: booking.rider_photo
        } : null,
        vehicle: booking.vehicle_id ? {
          vehicleId: booking.vehicle_id,
          type: booking.vehicle_type,
          model: booking.model_name,
          manufacturer: booking.manufacturer,
          registrationNumber: booking.registration_number,
          color: booking.color,
          year: booking.year_of_manufacture
        } : null,
        rideDetails: {
          pickup: {
            address: booking.pickup_address,
            latitude: booking.pickup_latitude ? parseFloat(booking.pickup_latitude) : null,
            longitude: booking.pickup_longitude ? parseFloat(booking.pickup_longitude) : null
          },
          dropoff: {
            address: booking.dropoff_address,
            latitude: booking.dropoff_latitude ? parseFloat(booking.dropoff_latitude) : null,
            longitude: booking.dropoff_longitude ? parseFloat(booking.dropoff_longitude) : null
          },
          distance: parseFloat(booking.distance_km || 0),
          duration: booking.duration_minutes,
          totalTime: totalTime,
          waitingTime: waitingTime
        },
        fareBreakdown: {
          totalFare: parseFloat(booking.fare_amount || 0),
          baseFare:       null,
          distanceCharge: null,
          timeCharge:     null,
          taxes:          null,
          platformFee:    null,
          discount:       null,
          coupon:         null
        },
        payment: {
          method: booking.payment_method,
          status: booking.payment_status,
          paidAmount: parseFloat(booking.fare_amount || 0)
        },
        timeline: {
          bookingCreated: booking.created_at,
          riderAccepted: booking.accepted_at,
          riderPickedUp: booking.picked_up_at,
          tripCompleted: booking.completed_at,
          tripCancelled: booking.cancelled_at
        },
        status: {
          current: booking.status,
          isPending: booking.status === 'PENDING',
          isAccepted: booking.status === 'ACCEPTED',
          isOngoing: ['PICKED_UP', 'IN_TRANSIT'].includes(booking.status),
          isCompleted: booking.status === 'COMPLETED',
          isCancelled: booking.status === 'CANCELLED'
        }
      };
    } catch (error) {
      logger.error('BookingService - Get Booking By ID Error:', error);
      if (error.message === 'Booking not found') {
        throw error;
      }
      throw new Error(`Failed to fetch booking details: ${error.message}`);
    }
  }

  // Get booking statistics
  async getBookingStatistics() {
    try {
      const stats = await BookingRepository.getBookingStatistics();

      return {
        overview: {
          totalBookings: stats.total_bookings,
          todayBookings: stats.today_bookings,
          weeklyBookings: stats.weekly_bookings,
          monthlyBookings: stats.monthly_bookings,
          growthPercentage: stats.growth_percentage
        },
        byStatus: {
          completed: stats.completed_bookings,
          cancelled: stats.cancelled_bookings,
          pending: stats.pending_bookings,
          accepted: stats.accepted_bookings,
          rejected: stats.rejected_bookings,
          ongoing: stats.ongoing_bookings
        },
        metrics: {
          averageFare: parseFloat(stats.avg_fare || 0).toFixed(2),
          averageDistance: parseFloat(stats.avg_distance || 0).toFixed(2),
          averageRideTime: parseFloat(stats.avg_ride_time || 0).toFixed(2),
          cancellationRate: stats.cancellation_rate,
          successRate: stats.success_rate
        }
      };
    } catch (error) {
      logger.error('BookingService - Get Statistics Error:', error);
      throw new Error('Failed to fetch booking statistics');
    }
  }

  // Export bookings
  async exportBookings(format, filters) {
    try {
      const data = await BookingRepository.getBookingsForExport(filters);

      if (!data || data.length === 0) {
        return { data: [], count: 0 };
      }

      // Format data for export
      const formattedData = data.map(booking => ({
        'Booking ID': booking.booking_id,
        'Booking Status': booking.booking_status,
        'Customer Name': booking.customer_name || 'N/A',
        'Customer Phone': booking.customer_phone || 'N/A',
        'Rider Name': booking.rider_name || 'Not Assigned',
        'Rider Phone': booking.rider_phone || 'N/A',
        'Rider Code': booking.rider_code || 'N/A',
        'Vehicle Type': booking.vehicle_type || 'N/A',
        'Registration Number': booking.registration_number || 'N/A',
        'Pickup Address': booking.pickup_address || 'N/A',
        'Dropoff Address': booking.dropoff_address || 'N/A',
        'Distance (km)': booking.distance_km || 0,
        'Duration (min)': booking.duration_minutes || 0,
        'Fare (₹)': booking.fare_amount || 0,
        'Payment Method': booking.payment_method || 'N/A',
        'Payment Status': booking.payment_status || 'N/A',
        'Created At': booking.created_at,
        'Accepted At': booking.accepted_at || 'N/A',
        'Picked Up At': booking.picked_up_at || 'N/A',
        'Completed At': booking.completed_at || 'N/A',
        'Cancelled At': booking.cancelled_at || 'N/A'
      }));

      return {
        data: formattedData,
        count: formattedData.length
      };
    } catch (error) {
      logger.error('BookingService - Export Bookings Error:', error);
      throw new Error('Failed to export bookings');
    }
  }

  // Get booking timeline
  async getBookingTimeline(bookingId) {
    try {
      const timeline = await BookingRepository.getBookingTimeline(bookingId);

      if (!timeline) {
        throw new Error('Booking not found');
      }

      const events = [];

      if (timeline.booking_created) {
        events.push({
          event: 'BOOKING_CREATED',
          description: `Booking created by ${timeline.user_name}`,
          timestamp: timeline.booking_created,
          status: 'PENDING'
        });
      }

      if (timeline.accepted_at) {
        events.push({
          event: 'BOOKING_ACCEPTED',
          description: `Booking accepted by ${timeline.rider_name} (${timeline.rider_code})`,
          timestamp: timeline.accepted_at,
          status: 'ACCEPTED'
        });
      }

      if (timeline.picked_up_at) {
        events.push({
          event: 'CUSTOMER_PICKED_UP',
          description: `Customer picked up by ${timeline.rider_name}`,
          timestamp: timeline.picked_up_at,
          status: 'PICKED_UP'
        });
      }

      if (timeline.completed_at) {
        events.push({
          event: 'TRIP_COMPLETED',
          description: 'Trip completed successfully',
          timestamp: timeline.completed_at,
          status: 'COMPLETED'
        });
      }

      if (timeline.cancelled_at) {
        events.push({
          event: 'TRIP_CANCELLED',
          description: 'Trip was cancelled',
          timestamp: timeline.cancelled_at,
          status: 'CANCELLED'
        });
      }

      return {
        bookingId: timeline.trip_id,
        currentStatus: timeline.status,
        timeline: events
      };
    } catch (error) {
      logger.error('BookingService - Get Timeline Error:', error);
      if (error.message === 'Booking not found') {
        throw error;
      }
      throw new Error('Failed to fetch booking timeline');
    }
  }

  // Get live booking status
  async getLiveBookingStatus(bookingId) {
    try {
      const liveStatus = await BookingRepository.getLiveBookingStatus(bookingId);

      if (!liveStatus) {
        throw new Error('Booking not found or not active');
      }

      return {
        bookingId: liveStatus.trip_id,
        status: liveStatus.status,
        rider: {
          riderId: liveStatus.rider_id,
          name: liveStatus.rider_name,
          phone: liveStatus.rider_phone,
          onlineStatus: liveStatus.online_status,
          availability: liveStatus.availability
        },
        vehicle: {
          type: liveStatus.vehicle_type,
          registrationNumber: liveStatus.registration_number
        },
        currentLocation: {
          latitude: liveStatus.current_latitude ? parseFloat(liveStatus.current_latitude) : null,
          longitude: liveStatus.current_longitude ? parseFloat(liveStatus.current_longitude) : null,
          speed: liveStatus.speed ? parseFloat(liveStatus.speed) : 0,
          heading: liveStatus.heading ? parseFloat(liveStatus.heading) : 0,
          battery: liveStatus.battery || 100,
          lastUpdated: liveStatus.location_updated_at
        },
        route: {
          pickup: {
            latitude: liveStatus.pickup_latitude ? parseFloat(liveStatus.pickup_latitude) : null,
            longitude: liveStatus.pickup_longitude ? parseFloat(liveStatus.pickup_longitude) : null
          },
          dropoff: {
            latitude: liveStatus.dropoff_latitude ? parseFloat(liveStatus.dropoff_latitude) : null,
            longitude: liveStatus.dropoff_longitude ? parseFloat(liveStatus.dropoff_longitude) : null
          }
        }
      };
    } catch (error) {
      logger.error('BookingService - Get Live Status Error:', error);
      if (error.message === 'Booking not found or not active') {
        throw error;
      }
      throw new Error('Failed to fetch live booking status');
    }
  }

  // ==================== OPERATIONAL METHODS ====================

  // Cancel booking
  async cancelBooking(bookingId, reason, cancelledBy, adminId) {
    try {
      const booking = await BookingRepository.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Business rule: Completed bookings cannot be cancelled
      if (booking.status === 'COMPLETED') {
        throw new Error('Completed bookings cannot be cancelled');
      }

      // Business rule: Already cancelled bookings
      if (booking.status === 'CANCELLED') {
        throw new Error('Booking is already cancelled');
      }

      const { formatMySQLDate } = require('../../../src/utils/helpers');
      const cancelledAt = formatMySQLDate();

      await BookingRepository.cancelBooking(bookingId, reason, cancelledBy, adminId, cancelledAt);

      logger.info('Booking cancelled successfully', {
        bookingId,
        cancelledBy,
        adminId,
        reason
      });

      return true;
    } catch (error) {
      logger.error('BookingService - Cancel Booking Error:', error);
      throw error;
    }
  }

  // Reschedule booking
  async rescheduleBooking(bookingId, newPickupTime, adminId) {
    try {
      const booking = await BookingRepository.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Business rule: Cannot reschedule completed or cancelled bookings
      if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
        throw new Error('Cannot reschedule completed or cancelled bookings');
      }

      // Business rule: Cannot reschedule ongoing bookings
      if (['PICKED_UP', 'IN_TRANSIT'].includes(booking.status)) {
        throw new Error('Cannot reschedule ongoing bookings');
      }

      const { formatMySQLDate } = require('../../../src/utils/helpers');
      const updatedAt = formatMySQLDate();

      await BookingRepository.rescheduleBooking(bookingId, newPickupTime, adminId, updatedAt);

      logger.info('Booking rescheduled successfully', {
        bookingId,
        newPickupTime,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('BookingService - Reschedule Booking Error:', error);
      throw error;
    }
  }

  // Refund booking
  async refundBooking(bookingId, refundAmount, refundReason, adminId) {
    try {
      const booking = await BookingRepository.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Business rule: Can only refund cancelled or completed bookings
      if (!['COMPLETED', 'CANCELLED'].includes(booking.status)) {
        throw new Error('Only completed or cancelled bookings can be refunded');
      }

      // Business rule: Refund amount cannot exceed total booking amount (fare_amount is aliased from total_amount)
      if (refundAmount > parseFloat(booking.fare_amount || 0) + parseFloat(booking.security_deposit || 0)) {
        throw new Error('Refund amount cannot exceed booking total (fare + deposit)');
      }

      // Business rule: Already refunded
      if (booking.payment_status === 'REFUNDED') {
        throw new Error('Booking payment is already refunded');
      }

      const { formatMySQLDate } = require('../../../src/utils/helpers');
      const refundedAt = formatMySQLDate();

      await BookingRepository.refundBooking(bookingId, refundAmount, refundReason, adminId, refundedAt);

      logger.info('Booking refunded successfully', {
        bookingId,
        refundAmount,
        adminId,
        refundReason
      });

      return true;
    } catch (error) {
      logger.error('BookingService - Refund Booking Error:', error);
      throw error;
    }
  }

  // Reassign rider
  async reassignRider(bookingId, newRiderId, reason, adminId) {
    try {
      const booking = await BookingRepository.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Business rule: Cannot reassign completed or cancelled bookings
      if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
        throw new Error('Cannot reassign rider for completed or cancelled bookings');
      }

      // Business rule: Check if new rider is active and available
      const riderStatus = await BookingRepository.getRiderStatus(newRiderId);

      if (!riderStatus) {
        throw new Error('Rider not found');
      }

      if (riderStatus.status !== 'ACTIVE') {
        throw new Error('Rider is not active');
      }

      if (riderStatus.online_status !== 'ONLINE') {
        throw new Error('Rider is not online');
      }

      if (riderStatus.availability !== 'AVAILABLE') {
        throw new Error('Rider is not available');
      }

      const { formatMySQLDate } = require('../../../src/utils/helpers');
      const reassignedAt = formatMySQLDate();

      await BookingRepository.reassignRider(bookingId, booking.rider_id, newRiderId, reason, adminId, reassignedAt);

      logger.info('Rider reassigned successfully', {
        bookingId,
        oldRiderId: booking.rider_id,
        newRiderId,
        adminId,
        reason
      });

      return true;
    } catch (error) {
      logger.error('BookingService - Reassign Rider Error:', error);
      throw error;
    }
  }

  // Manual complete booking
  async manualCompleteBooking(bookingId, finalFare, completionNotes, adminId) {
    try {
      const booking = await BookingRepository.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Business rule: Cannot complete already completed bookings
      if (booking.status === 'COMPLETED') {
        throw new Error('Booking is already completed');
      }

      // Business rule: Cannot complete cancelled bookings
      if (booking.status === 'CANCELLED') {
        throw new Error('Cannot complete cancelled bookings');
      }

      const { formatMySQLDate } = require('../../../src/utils/helpers');
      const completedAt = formatMySQLDate();

      await BookingRepository.manualCompleteBooking(bookingId, finalFare, completionNotes, adminId, completedAt);

      logger.info('Booking manually completed', {
        bookingId,
        finalFare,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('BookingService - Manual Complete Booking Error:', error);
      throw error;
    }
  }

  // Manual start booking
  async manualStartBooking(bookingId, adminId) {
    try {
      const booking = await BookingRepository.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Business rule: Can only start accepted bookings
      if (booking.status !== 'ACCEPTED') {
        throw new Error('Only accepted bookings can be started');
      }

      const { formatMySQLDate } = require('../../../src/utils/helpers');
      const startedAt = formatMySQLDate();

      await BookingRepository.manualStartBooking(bookingId, adminId, startedAt);

      logger.info('Booking manually started', {
        bookingId,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('BookingService - Manual Start Booking Error:', error);
      throw error;
    }
  }

  // Manual arrival booking
  async manualArrivalBooking(bookingId, adminId) {
    try {
      const booking = await BookingRepository.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Business rule: Can only mark arrival for accepted bookings
      if (booking.status !== 'ACCEPTED') {
        throw new Error('Only accepted bookings can be marked as arrived');
      }

      const { formatMySQLDate } = require('../../../src/utils/helpers');
      const arrivedAt = formatMySQLDate();

      await BookingRepository.manualArrivalBooking(bookingId, adminId, arrivedAt);

      logger.info('Rider arrival marked manually', {
        bookingId,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('BookingService - Manual Arrival Booking Error:', error);
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(bookingId, paymentStatus, paymentMethod, transactionId, adminId) {
    try {
      const booking = await BookingRepository.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      const { formatMySQLDate } = require('../../../src/utils/helpers');
      const updatedAt = formatMySQLDate();

      await BookingRepository.updatePaymentStatus(bookingId, paymentStatus, paymentMethod, transactionId, adminId, updatedAt);

      logger.info('Payment status updated', {
        bookingId,
        paymentStatus,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('BookingService - Update Payment Status Error:', error);
      throw error;
    }
  }

  // Update fare
  async updateFare(bookingId, newFare, reason, adminId) {
    try {
      const booking = await BookingRepository.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Business rule: Cannot update fare for completed bookings
      if (booking.status === 'COMPLETED') {
        throw new Error('Cannot update fare for completed bookings');
      }

      const oldFare = parseFloat(booking.fare_amount || 0);

      const { formatMySQLDate } = require('../../../src/utils/helpers');
      const updatedAt = formatMySQLDate();

      await BookingRepository.updateFare(bookingId, oldFare, newFare, reason, adminId, updatedAt);

      logger.info('Fare updated', {
        bookingId,
        oldFare,
        newFare,
        adminId,
        reason
      });

      return true;
    } catch (error) {
      logger.error('BookingService - Update Fare Error:', error);
      throw error;
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId, newStatus, reason, adminId) {
    try {
      const booking = await BookingRepository.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      const oldStatus = booking.status;

      // Business rule: Validate status transitions
      const validTransitions = {
        'PENDING': ['ACCEPTED', 'REJECTED', 'CANCELLED'],
        'ACCEPTED': ['PICKED_UP', 'CANCELLED'],
        'PICKED_UP': ['IN_TRANSIT', 'CANCELLED'],
        'IN_TRANSIT': ['COMPLETED', 'CANCELLED'],
        'COMPLETED': [], // Cannot change completed status
        'CANCELLED': [], // Cannot change cancelled status
        'REJECTED': [] // Cannot change rejected status
      };

      if (!validTransitions[oldStatus].includes(newStatus)) {
        throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`);
      }

      const { formatMySQLDate } = require('../../../src/utils/helpers');
      const updatedAt = formatMySQLDate();

      await BookingRepository.updateBookingStatus(bookingId, oldStatus, newStatus, reason, adminId, updatedAt);

      logger.info('Booking status updated', {
        bookingId,
        oldStatus,
        newStatus,
        adminId,
        reason
      });

      return true;
    } catch (error) {
      logger.error('BookingService - Update Status Error:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS METHODS ====================

  // Get revenue analytics
  async getRevenueAnalytics(filters) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const data = await BookingRepository.getRevenueAnalytics(startDate, endDate);

      return {
        period: {
          startDate,
          endDate
        },
        revenue: {
          total: parseFloat(data.total_revenue || 0).toFixed(2),
          today: parseFloat(data.today_revenue || 0).toFixed(2),
          week: parseFloat(data.week_revenue || 0).toFixed(2),
          month: parseFloat(data.month_revenue || 0).toFixed(2),
          year: parseFloat(data.year_revenue || 0).toFixed(2)
        },
        bookings: {
          total: data.total_bookings || 0,
          completed: data.completed_bookings || 0,
          avgBookingValue: parseFloat(data.avg_booking_value || 0).toFixed(2)
        },
        metrics: {
          totalTransactions: data.total_transactions || 0,
          conversionRate: data.total_bookings > 0 
            ? ((data.completed_bookings / data.total_bookings) * 100).toFixed(2) 
            : 0
        }
      };
    } catch (error) {
      logger.error('BookingService - Get Revenue Analytics Error:', error);
      throw new Error('Failed to fetch revenue analytics');
    }
  }

  // Get top cities
  async getTopCities(filters, limit = 10) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const cities = await BookingRepository.getTopCities(startDate, endDate, limit);

      return cities.map(city => ({
        city: city.city,
        totalBookings: city.total_bookings,
        completedBookings: city.completed_bookings,
        cancelledBookings: city.cancelled_bookings,
        revenue: parseFloat(city.total_revenue || 0).toFixed(2),
        avgFare: parseFloat(city.avg_fare || 0).toFixed(2),
        avgDistance: parseFloat(city.avg_distance || 0).toFixed(2),
        cancellationRate: city.total_bookings > 0 
          ? ((city.cancelled_bookings / city.total_bookings) * 100).toFixed(2) 
          : 0
      }));
    } catch (error) {
      logger.error('BookingService - Get Top Cities Error:', error);
      throw new Error('Failed to fetch top cities');
    }
  }

  // Get top riders
  async getTopRiders(filters, limit = 10) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const riders = await BookingRepository.getTopRiders(startDate, endDate, limit);

      return riders.map(rider => ({
        riderId: rider.rider_id,
        name: rider.full_name,
        riderCode: rider.rider_code,
        phone: rider.phone_number,
        city: rider.assigned_city,
        rating: parseFloat(rider.rating || 0),
        totalBookings: rider.total_bookings,
        completedBookings: rider.completed_bookings,
        cancelledTrips: rider.cancelled_trips,
        totalEarnings: parseFloat(rider.total_earnings || 0).toFixed(2),
        avgFare: parseFloat(rider.avg_fare || 0).toFixed(2),
        avgDistance: parseFloat(rider.avg_distance || 0).toFixed(2),
        completionRate: parseFloat(rider.completion_rate || 0)
      }));
    } catch (error) {
      logger.error('BookingService - Get Top Riders Error:', error);
      throw new Error('Failed to fetch top riders');
    }
  }

  // Get top users
  async getTopUsers(filters, limit = 10) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const users = await BookingRepository.getTopUsers(startDate, endDate, limit);

      return users.map(user => ({
        userId: user.user_id,
        name: user.full_name,
        phone: user.phone_number,
        email: user.email,
        totalBookings: user.total_bookings,
        completedBookings: user.completed_bookings,
        cancelledBookings: user.cancelled_bookings,
        totalSpent: parseFloat(user.total_spent || 0).toFixed(2),
        avgBookingValue: parseFloat(user.avg_booking_value || 0).toFixed(2),
        lastBookingDate: user.last_booking_date
      }));
    } catch (error) {
      logger.error('BookingService - Get Top Users Error:', error);
      throw new Error('Failed to fetch top users');
    }
  }

  // Get peak hours
  async getPeakHours(filters) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const hours = await BookingRepository.getPeakHours(startDate, endDate);

      return hours.map(hour => ({
        hour: hour.hour,
        timeRange: `${hour.hour}:00 - ${hour.hour}:59`,
        totalBookings: hour.total_bookings,
        completedBookings: hour.completed_bookings,
        cancelledBookings: hour.cancelled_bookings,
        revenue: parseFloat(hour.revenue || 0).toFixed(2),
        avgFare: parseFloat(hour.avg_fare || 0).toFixed(2)
      }));
    } catch (error) {
      logger.error('BookingService - Get Peak Hours Error:', error);
      throw new Error('Failed to fetch peak hours');
    }
  }

  // Get cancellation report
  async getCancellationReport(filters) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const report = await BookingRepository.getCancellationReport(startDate, endDate);

      return {
        summary: {
          totalBookings: report.summary.total_bookings || 0,
          totalCancelled: report.summary.total_cancelled || 0,
          cancellationRate: parseFloat(report.summary.cancellation_rate || 0)
        },
        dailyTrend: report.daily_cancellations.map(day => ({
          date: day.date,
          totalBookings: day.total_bookings,
          cancelledCount: day.cancelled_count,
          cancellationRate: day.total_bookings > 0 
            ? ((day.cancelled_count / day.total_bookings) * 100).toFixed(2) 
            : 0
        }))
      };
    } catch (error) {
      logger.error('BookingService - Get Cancellation Report Error:', error);
      throw new Error('Failed to fetch cancellation report');
    }
  }

  // Get payment report
  async getPaymentReport(filters) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const report = await BookingRepository.getPaymentReport(startDate, endDate);

      return {
        summary: {
          totalTransactions: report.summary.total_transactions || 0,
          successfulPayments: report.summary.successful_payments || 0,
          failedPayments: report.summary.failed_payments || 0,
          pendingPayments: report.summary.pending_payments || 0,
          refundedPayments: report.summary.refunded_payments || 0,
          totalCollected: parseFloat(report.summary.total_collected || 0).toFixed(2),
          totalRefunded: parseFloat(report.summary.total_refunded || 0).toFixed(2),
          netRevenue: parseFloat((report.summary.total_collected || 0) - (report.summary.total_refunded || 0)).toFixed(2),
          successRate: report.summary.total_transactions > 0 
            ? ((report.summary.successful_payments / report.summary.total_transactions) * 100).toFixed(2) 
            : 0
        },
        byPaymentMethod: report.by_payment_method.map(method => ({
          paymentMethod: method.payment_method,
          transactionCount: method.transaction_count,
          successfulCount: method.successful_count,
          totalAmount: parseFloat(method.total_amount || 0).toFixed(2),
          avgAmount: parseFloat(method.avg_amount || 0).toFixed(2)
        }))
      };
    } catch (error) {
      logger.error('BookingService - Get Payment Report Error:', error);
      throw new Error('Failed to fetch payment report');
    }
  }

  // Get daily report
  async getDailyReport(filters) {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      
      const report = await BookingRepository.getDailyReport(startDate, endDate);

      return report.map(day => ({
        date: day.date,
        totalBookings: day.total_bookings,
        completed: day.completed,
        cancelled: day.cancelled,
        pending: day.pending,
        revenue: parseFloat(day.revenue || 0).toFixed(2),
        avgFare: parseFloat(day.avg_fare || 0).toFixed(2),
        totalDistance: parseFloat(day.total_distance || 0).toFixed(2),
        avgDistance: parseFloat(day.avg_distance || 0).toFixed(2),
        uniqueRiders: day.unique_riders,
        uniqueCustomers: day.unique_customers,
        completionRate: day.total_bookings > 0 
          ? ((day.completed / day.total_bookings) * 100).toFixed(2) 
          : 0
      }));
    } catch (error) {
      logger.error('BookingService - Get Daily Report Error:', error);
      throw new Error('Failed to fetch daily report');
    }
  }

  // Get monthly report
  async getMonthlyReport(year) {
    try {
      const report = await BookingRepository.getMonthlyReport(year);

      return report.map(month => ({
        month: month.month,
        monthName: month.month_name,
        totalBookings: month.total_bookings,
        completed: month.completed,
        cancelled: month.cancelled,
        revenue: parseFloat(month.revenue || 0).toFixed(2),
        avgFare: parseFloat(month.avg_fare || 0).toFixed(2),
        totalDistance: parseFloat(month.total_distance || 0).toFixed(2),
        uniqueRiders: month.unique_riders,
        uniqueCustomers: month.unique_customers,
        completionRate: month.total_bookings > 0 
          ? ((month.completed / month.total_bookings) * 100).toFixed(2) 
          : 0
      }));
    } catch (error) {
      logger.error('BookingService - Get Monthly Report Error:', error);
      throw new Error('Failed to fetch monthly report');
    }
  }

  // Get yearly report
  async getYearlyReport() {
    try {
      const report = await BookingRepository.getYearlyReport();

      return report.map(year => ({
        year: year.year,
        totalBookings: year.total_bookings,
        completed: year.completed,
        cancelled: year.cancelled,
        revenue: parseFloat(year.revenue || 0).toFixed(2),
        avgFare: parseFloat(year.avg_fare || 0).toFixed(2),
        totalDistance: parseFloat(year.total_distance || 0).toFixed(2),
        uniqueRiders: year.unique_riders,
        uniqueCustomers: year.unique_customers,
        completionRate: year.total_bookings > 0 
          ? ((year.completed / year.total_bookings) * 100).toFixed(2) 
          : 0
      }));
    } catch (error) {
      logger.error('BookingService - Get Yearly Report Error:', error);
      throw new Error('Failed to fetch yearly report');
    }
  }

  // Helper method to get date range
  getDateRange(filters) {
    const { formatMySQLDate } = require('../../../src/utils/helpers');
    const now = new Date();
    let startDate, endDate;

    if (filters.period) {
      switch (filters.period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          endDate = new Date();
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 30));
          endDate = new Date();
      }
    } else {
      startDate = filters.startDate ? new Date(filters.startDate) : new Date(now.setDate(now.getDate() - 30));
      endDate = filters.endDate ? new Date(filters.endDate) : new Date();
    }

    return {
      startDate: formatMySQLDate(startDate),
      endDate: formatMySQLDate(endDate)
    };
  }

  // BUG-0005 FIX: assign rider to a booking (admin-side operation)
  async assignRider(bookingId, riderId) {
    const db = require('../../../src/config/db');

    const [bookingRows] = await db.query(
      'SELECT booking_id, status FROM bookings WHERE booking_id = ?',
      [bookingId]
    );
    if (bookingRows.length === 0) throw new Error('Booking not found');

    const booking = bookingRows[0];
    if (['CANCELLED', 'COMPLETED'].includes(booking.status)) {
      throw new Error('Rider cannot be assigned to a cancelled or completed booking');
    }

    // riderId can be riders.rider_id (admin) or users.user_id (user system) — resolve both
    // Try riders table first (admin system)
    let resolvedRiderId = riderId;
    let riderUserId = null;
    const [riderRows] = await db.query(
      'SELECT rider_id, user_id, status, kyc_status FROM riders WHERE rider_id = ? LIMIT 1',
      [riderId]
    );

    if (riderRows.length > 0) {
      // It's a riders.rider_id
      const rider = riderRows[0];
      resolvedRiderId = rider.rider_id;
      riderUserId = rider.user_id;

      if (rider.status === 'SUSPENDED' || rider.status === 'BLOCKED') {
        throw new Error('Selected rider is blocked');
      }
    } else {
      // Try as users.user_id (user system)
      const [userRows] = await db.query(
        'SELECT user_id, role, application_status, employee_status, rider_id FROM users WHERE user_id = ?',
        [riderId]
      );
      if (userRows.length === 0) throw new Error('Rider not found');
      const user = userRows[0];

      if (user.role !== 'VEHICLE_WITH_JOB') throw new Error('Selected user is not a rider');
      if (user.application_status !== 'verified') throw new Error('Selected rider is not verified');
      if (user.employee_status && user.employee_status !== 'ACTIVE') throw new Error('Selected rider is not active');

      riderUserId = user.user_id;
      // Resolve to riders.rider_id if linked
      if (user.rider_id) {
        resolvedRiderId = user.rider_id;
      } else {
        // rider record doesn't exist yet — use user_id as fallback
        resolvedRiderId = riderId;
      }
    }

    await db.query(
      'UPDATE bookings SET rider_id = ?, rider_user_id = ?, updated_at = NOW() WHERE booking_id = ?',
      [resolvedRiderId, riderUserId, bookingId]
    );

    return true;
  }
}

module.exports = new BookingService();

