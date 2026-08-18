const RiderRepository = require('../repositories/RiderRepository');
const { formatMySQLDate } = require('../../../src/utils/helpers');
const logger = require('../../../src/utils/logger');

class RiderService {
  // Get paginated riders list
  async getRiders(filters, pagination) {
    try {
      const result = await RiderRepository.getRiders(filters, pagination);
      
      // Format response data
      result.riders = result.riders.map(rider => ({
        riderId: rider.rider_id,
        fullName: rider.full_name,
        phoneNumber: rider.phone_number,
        email: rider.email,
        riderCode: rider.rider_code,
        dateOfBirth: rider.date_of_birth,
        gender: rider.gender,
        address: rider.address,
        assignedCity: rider.assigned_city,
        assignedZone: rider.assigned_zone,
        status: rider.status,
        onlineStatus: rider.online_status,
        availability: rider.availability,
        kycStatus: rider.kyc_status,
        rating: parseFloat(rider.rating || 0),
        totalTrips: rider.total_trips,
        completedTrips: rider.completed_trips,
        cancelledTrips: rider.cancelled_trips,
        totalEarnings: parseFloat(rider.total_earnings || 0),
        todayEarnings: parseFloat(rider.today_earnings || 0),
        walletBalance: parseFloat(rider.wallet_balance || 0),
        acceptanceRate: parseFloat(rider.acceptance_rate || 0),
        completionRate: parseFloat(rider.completion_rate || 0),
        avgRideDuration: parseFloat(rider.avg_ride_duration || 0),
        avgDistance: parseFloat(rider.avg_distance || 0),
        vehicle: rider.assigned_vehicle_id ? {
          vehicleId: rider.assigned_vehicle_id,
          vehicleType: rider.vehicle_type,
          modelName: rider.model_name,
          registrationNumber: rider.registration_number,
          color: rider.vehicle_color
        } : null,
        profilePhoto: rider.profile_photo,
        createdAt: rider.created_at,
        updatedAt: rider.updated_at
      }));

      return result;
    } catch (error) {
      logger.error('RiderService - Get Riders Error:', error);
      throw new Error('Failed to fetch riders');
    }
  }

  // Get rider by ID with complete profile
  async getRiderById(riderId) {
    try {
      const rider = await RiderRepository.getRiderProfile(riderId);

      if (!rider) {
        throw new Error('Rider not found');
      }

      // Get additional data
      const [
        documents,
        devices,
        earnings,
        walletTransactions,
        tripStats,
        currentLocation,
        recentActivities
      ] = await Promise.all([
        RiderRepository.getRiderDocuments(riderId),
        RiderRepository.getRiderDevices(riderId),
        RiderRepository.getRiderEarnings(riderId),
        RiderRepository.getRiderWalletTransactions(riderId, 5),
        RiderRepository.getTripStatistics(riderId),
        RiderRepository.getCurrentLocation(riderId),
        RiderRepository.getRecentActivities(riderId, 10)
      ]);

      return {
        profile: {
          riderId: rider.rider_id,
          fullName: rider.full_name,
          phoneNumber: rider.phone_number,
          email: rider.email,
          riderCode: rider.rider_code,
          dateOfBirth: rider.date_of_birth,
          gender: rider.gender,
          address: rider.address,
          assignedCity: rider.assigned_city,
          assignedZone: rider.assigned_zone,
          status: rider.status,
          onlineStatus: rider.online_status,
          availability: rider.availability,
          kycStatus: rider.kyc_status,
          rating: parseFloat(rider.rating || 0),
          totalTrips: rider.total_trips,
          completedTrips: rider.completed_trips,
          cancelledTrips: rider.cancelled_trips,
          acceptanceRate: parseFloat(rider.acceptance_rate || 0),
          completionRate: parseFloat(rider.completion_rate || 0),
          avgRideDuration: parseFloat(rider.avg_ride_duration || 0),
          avgDistance: parseFloat(rider.avg_distance || 0),
          profilePhoto: rider.profile_photo,
          drivingLicenseNumber: rider.driving_license_number || null,
          drivingLicensePhoto: rider.driving_license_photo || null,
          aadharNumber: rider.aadhar_number || null,
          aadharCardPhoto: rider.aadhar_card_photo || null,
          bankAccountNumber: rider.bank_account_number,
          ifscCode: rider.ifsc_code,
          branchId: rider.branch_id,
          emergencyContactName: rider.emergency_contact_name,
          emergencyContactNumber: rider.emergency_contact_number,
          createdAt: rider.created_at,
          updatedAt: rider.updated_at
        },
        vehicle: rider.vehicle_id ? {
          vehicleId: rider.vehicle_id,
          vehicleType: rider.vehicle_type,
          modelName: rider.model_name,
          registrationNumber: rider.registration_number,
          color: rider.vehicle_color,
          year: rider.vehicle_year,
          status: rider.vehicle_status
        } : null,
        earnings: {
          todayEarnings: parseFloat(earnings.today_earnings || 0),
          weeklyEarnings: parseFloat(earnings.weekly_earnings || 0),
          monthlyEarnings: parseFloat(earnings.monthly_earnings || 0),
          totalEarnings: parseFloat(earnings.total_earnings || 0),
          walletBalance: parseFloat(rider.wallet_balance || 0)
        },
        documents: documents.map(doc => ({
          documentId: doc.document_id,
          documentType: doc.document_type,
          documentNumber: doc.document_number,
          documentUrl: doc.document_url,
          verifiedStatus: doc.verified_status,
          verifiedBy: doc.verified_by,
          verifiedByName: doc.verified_by_name,
          verifiedAt: doc.verified_at,
          remarks: doc.remarks,
          createdAt: doc.created_at
        })),
        devices: devices.map(device => ({
          deviceId: device.device_id,
          deviceType: device.device_type,
          deviceModel: device.device_model,
          osVersion: device.os_version,
          appVersion: device.app_version,
          isActive: device.is_active === 1,
          lastActiveAt: device.last_active_at,
          createdAt: device.created_at
        })),
        walletTransactions: walletTransactions.map(txn => ({
          transactionId: txn.transaction_id,
          transactionType: txn.transaction_type,
          amount: parseFloat(txn.amount),
          balanceBefore: parseFloat(txn.balance_before),
          balanceAfter: parseFloat(txn.balance_after),
          referenceType: txn.reference_type,
          referenceId: txn.reference_id,
          description: txn.description,
          createdAt: txn.created_at
        })),
        statistics: {
          trips: {
            total: tripStats.total_trips,
            completed: tripStats.completed_trips,
            cancelled: tripStats.cancelled_trips,
            active: tripStats.active_trips,
            avgDuration: parseFloat(tripStats.avg_duration || 0),
            avgDistance: parseFloat(tripStats.avg_distance || 0)
          }
        },
        currentLocation: currentLocation ? {
          latitude: parseFloat(currentLocation.latitude),
          longitude: parseFloat(currentLocation.longitude),
          speed: parseFloat(currentLocation.speed || 0),
          heading: parseFloat(currentLocation.heading || 0),
          battery: currentLocation.battery,
          updatedAt: currentLocation.updated_at
        } : null,
        recentActivities: recentActivities.map(activity => ({
          activityType: activity.activity_type,
          description: activity.description,
          createdAt: activity.created_at
        }))
      };
    } catch (error) {
      logger.error('RiderService - Get Rider By ID Error:', error);
      throw error;
    }
  }

  // Block rider
  async blockRider(riderId, reason, adminId) {
    try {
      const rider = await RiderRepository.findById(riderId);

      if (!rider) {
        throw new Error('Rider not found');
      }

      if (rider.status === 'SUSPENDED') {
        throw new Error('Rider is already blocked');
      }

      const blockedAt = formatMySQLDate();
      await RiderRepository.blockRider(riderId, reason, adminId, blockedAt);

      logger.info('Rider blocked successfully', { 
        riderId, 
        blockedBy: adminId, 
        reason 
      });

      return true;
    } catch (error) {
      logger.error('RiderService - Block Rider Error:', error);
      throw error;
    }
  }

  // Unblock rider
  async unblockRider(riderId, adminId) {
    try {
      const rider = await RiderRepository.findById(riderId);

      if (!rider) {
        throw new Error('Rider not found');
      }

      if (rider.status !== 'SUSPENDED') {
        throw new Error('Rider is not blocked');
      }

      const unblockedAt = formatMySQLDate();
      await RiderRepository.unblockRider(riderId, unblockedAt);

      logger.info('Rider unblocked successfully', { 
        riderId, 
        unblockedBy: adminId 
      });

      return true;
    } catch (error) {
      logger.error('RiderService - Unblock Rider Error:', error);
      throw error;
    }
  }

  // Update rider status
  async updateRiderStatus(riderId, status, adminId) {
    try {
      const rider = await RiderRepository.findById(riderId);

      if (!rider) {
        throw new Error('Rider not found');
      }

      if (rider.status === status) {
        throw new Error(`Rider status is already ${status}`);
      }

      const updatedAt = formatMySQLDate();
      await RiderRepository.updateRiderStatus(riderId, status, updatedAt);

      logger.info('Rider status updated successfully', { 
        riderId, 
        newStatus: status,
        updatedBy: adminId 
      });

      return true;
    } catch (error) {
      logger.error('RiderService - Update Rider Status Error:', error);
      throw error;
    }
  }

  // Update rider KYC
  async updateRiderKYC(riderId, kycStatus, adminId, remarks = null) {
    try {
      const rider = await RiderRepository.findById(riderId);

      if (!rider) {
        throw new Error('Rider not found');
      }

      // Validate KYC status transition
      if (kycStatus === 'APPROVED' && rider.kyc_status === 'APPROVED') {
        throw new Error('Rider KYC is already approved');
      }

      const updatedAt = formatMySQLDate();
      await RiderRepository.updateRiderKYC(riderId, kycStatus, adminId, remarks, updatedAt);

      logger.info('Rider KYC updated successfully', { 
        riderId, 
        kycStatus,
        updatedBy: adminId 
      });

      return true;
    } catch (error) {
      logger.error('RiderService - Update Rider KYC Error:', error);
      throw error;
    }
  }

  // Update rider vehicle
  async updateRiderVehicle(riderId, vehicleId, action, adminId) {
    try {
      const rider = await RiderRepository.findById(riderId);

      if (!rider) {
        throw new Error('Rider not found');
      }

      // Validate action
      if (action === 'REMOVE' && !rider.assigned_vehicle_id) {
        throw new Error('Rider has no vehicle assigned');
      }

      if ((action === 'ASSIGN' || action === 'REPLACE') && !vehicleId) {
        throw new Error('Vehicle ID is required for this action');
      }

      const updatedAt = formatMySQLDate();
      await RiderRepository.updateRiderVehicle(riderId, vehicleId, action, updatedAt);

      logger.info('Rider vehicle updated successfully', { 
        riderId, 
        vehicleId,
        action,
        updatedBy: adminId 
      });

      return true;
    } catch (error) {
      logger.error('RiderService - Update Rider Vehicle Error:', error);
      throw error;
    }
  }

  // Update rider location
  async updateRiderLocation(riderId, locationData, adminId) {
    try {
      const rider = await RiderRepository.findById(riderId);

      if (!rider) {
        throw new Error('Rider not found');
      }

      const updatedAt = formatMySQLDate();
      await RiderRepository.updateRiderLocation(riderId, locationData, updatedAt);

      logger.info('Rider location updated successfully', { 
        riderId, 
        updatedBy: adminId 
      });

      return true;
    } catch (error) {
      logger.error('RiderService - Update Rider Location Error:', error);
      throw error;
    }
  }

  // Update rider availability
  async updateRiderAvailability(riderId, availability, adminId) {
    try {
      const rider = await RiderRepository.findById(riderId);

      if (!rider) {
        throw new Error('Rider not found');
      }

      // Suspended riders cannot go online
      if (rider.status === 'SUSPENDED' && availability !== 'OFFLINE') {
        throw new Error('Blocked riders cannot be set to available');
      }

      // KYC must be approved before rider can be available
      if (rider.kyc_status !== 'APPROVED' && availability === 'AVAILABLE') {
        throw new Error('Rider KYC must be approved before becoming available');
      }

      const updatedAt = formatMySQLDate();
      await RiderRepository.updateRiderAvailability(riderId, availability, updatedAt);

      logger.info('Rider availability updated successfully', { 
        riderId, 
        availability,
        updatedBy: adminId 
      });

      return true;
    } catch (error) {
      logger.error('RiderService - Update Rider Availability Error:', error);
      throw error;
    }
  }

  // Get rider current booking
  async getRiderCurrentBooking(riderId) {
    try {
      const rider = await RiderRepository.findById(riderId);

      if (!rider) {
        throw new Error('Rider not found');
      }

      const booking = await RiderRepository.getCurrentBooking(riderId);

      if (!booking) {
        return { currentBooking: null };
      }

      return {
        currentBooking: {
          tripId: booking.trip_id,
          userId: booking.user_id,
          customerName: booking.customer_name,
          customerPhone: booking.customer_phone,
          pickupAddress: booking.pickup_address,
          pickupLatitude: parseFloat(booking.pickup_latitude),
          pickupLongitude: parseFloat(booking.pickup_longitude),
          dropoffAddress: booking.dropoff_address,
          dropoffLatitude: parseFloat(booking.dropoff_latitude),
          dropoffLongitude: parseFloat(booking.dropoff_longitude),
          distanceKm: parseFloat(booking.distance_km || 0),
          fareAmount: parseFloat(booking.fare_amount || 0),
          status: booking.status,
          acceptedAt: booking.accepted_at,
          pickedUpAt: booking.picked_up_at,
          createdAt: booking.created_at
        }
      };
    } catch (error) {
      logger.error('RiderService - Get Rider Current Booking Error:', error);
      throw error;
    }
  }

  // Get rider bookings
  async getRiderBookings(riderId, pagination, filters) {
    try {
      const rider = await RiderRepository.findById(riderId);

      if (!rider) {
        throw new Error('Rider not found');
      }

      const result = await RiderRepository.getRiderBookings(riderId, pagination, filters);

      result.bookings = result.bookings.map(booking => ({
        tripId: booking.trip_id,
        userId: booking.user_id,
        customerName: booking.customer_name,
        customerPhone: booking.customer_phone,
        customerPhoto: booking.customer_photo,
        pickupAddress: booking.pickup_address,
        dropoffAddress: booking.dropoff_address,
        distanceKm: parseFloat(booking.distance_km || 0),
        fareAmount: parseFloat(booking.fare_amount || 0),
        paymentMethod: booking.payment_method,
        paymentStatus: booking.payment_status,
        status: booking.status,
        acceptedAt: booking.accepted_at,
        pickedUpAt: booking.picked_up_at,
        completedAt: booking.completed_at,
        cancelledAt: booking.cancelled_at,
        createdAt: booking.created_at
      }));

      return result;
    } catch (error) {
      logger.error('RiderService - Get Rider Bookings Error:', error);
      throw error;
    }
  }

  // Get rider payments
  async getRiderPayments(riderId, pagination, filters) {
    try {
      const rider = await RiderRepository.findById(riderId);

      if (!rider) {
        throw new Error('Rider not found');
      }

      const result = await RiderRepository.getRiderPayments(riderId, pagination, filters);

      result.payments = result.payments.map(payment => ({
        transactionId: payment.transaction_id,
        transactionType: payment.transaction_type,
        amount: parseFloat(payment.amount),
        balanceBefore: parseFloat(payment.balance_before),
        balanceAfter: parseFloat(payment.balance_after),
        referenceType: payment.reference_type,
        referenceId: payment.reference_id,
        description: payment.description,
        createdAt: payment.created_at
      }));

      return result;
    } catch (error) {
      logger.error('RiderService - Get Rider Payments Error:', error);
      throw error;
    }
  }

  // Get rider activity
  async getRiderActivity(riderId, limit = 20) {
    try {
      const rider = await RiderRepository.findById(riderId);

      if (!rider) {
        throw new Error('Rider not found');
      }

      const activities = await RiderRepository.getRiderActivity(riderId, limit);

      return activities.map(activity => ({
        activityType: activity.activity_type,
        referenceId: activity.ref_id,
        description: activity.description,
        createdAt: activity.created_at
      }));
    } catch (error) {
      logger.error('RiderService - Get Rider Activity Error:', error);
      throw error;
    }
  }

  // Get rider live location
  async getRiderLiveLocation(riderId) {
    try {
      const rider = await RiderRepository.findById(riderId);

      if (!rider) {
        throw new Error('Rider not found');
      }

      const location = await RiderRepository.getCurrentLocation(riderId);

      if (!location) {
        return { liveLocation: null };
      }

      return {
        liveLocation: {
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          speed: parseFloat(location.speed || 0),
          heading: parseFloat(location.heading || 0),
          battery: location.battery,
          onlineStatus: rider.online_status,
          availability: rider.availability,
          vehicleType: rider.vehicle_type,
          registrationNumber: rider.registration_number,
          lastUpdated: location.updated_at
        }
      };
    } catch (error) {
      logger.error('RiderService - Get Rider Live Location Error:', error);
      throw error;
    }
  }

  // Get rider statistics
  async getRiderStatistics() {
    try {
      const stats = await RiderRepository.getRiderStatistics();

      return {
        totalRiders: stats.total_riders,
        onlineRiders: stats.online_riders,
        offlineRiders: stats.offline_riders,
        blockedRiders: stats.blocked_riders,
        verifiedRiders: stats.verified_riders,
        pendingKYC: stats.pending_kyc,
        todayJoined: stats.today_joined,
        weeklyJoined: stats.weekly_joined,
        monthlyJoined: stats.monthly_joined,
        growthPercentage: stats.growth_percentage,
        avgRating: parseFloat(stats.avg_rating || 0),
        avgEarnings: parseFloat(stats.avg_earnings || 0),
        avgAcceptanceRate: parseFloat(stats.avg_acceptance_rate || 0),
        avgCompletionRate: parseFloat(stats.avg_completion_rate || 0)
      };
    } catch (error) {
      logger.error('RiderService - Get Rider Statistics Error:', error);
      throw new Error('Failed to fetch rider statistics');
    }
  }

  // Create rider
  async createRider(riderData, adminId) {
    try {
      const { phone_number, email } = riderData;

      const existing = await RiderRepository.findByPhone(phone_number);
      if (existing) throw new Error('Phone number already registered');

      if (email) {
        const existingEmail = await RiderRepository.findByEmail(email);
        if (existingEmail) throw new Error('Email already registered');
      }

      const riderId = await RiderRepository.createRider(riderData, adminId);
      const rider = await RiderRepository.findById(riderId);
      return { riderId, riderCode: rider.rider_code };
    } catch (error) {
      logger.error('RiderService - Create Rider Error:', error);
      throw error;
    }
  }

  // Update rider
  async updateRider(riderId, updateData, adminId) {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');

      const updatedAt = formatMySQLDate();
      await RiderRepository.updateRider(riderId, updateData, updatedAt);

      logger.info('Rider updated', { riderId, updatedBy: adminId });
      return true;
    } catch (error) {
      logger.error('RiderService - Update Rider Error:', error);
      throw error;
    }
  }

  // Verify rider KYC (via kyc table)
  async verifyRiderKYC(riderId, kycId, status, adminId, remarks, rejectionReason) {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');

      const updatedAt = formatMySQLDate();
      await RiderRepository.verifyKYCRecord(kycId, status, adminId, remarks, rejectionReason, updatedAt);

      logger.info('Rider KYC verified', { riderId, kycId, status, by: adminId });
      return true;
    } catch (error) {
      logger.error('RiderService - Verify Rider KYC Error:', error);
      throw error;
    }
  }

  // Assign rider to branch
  async assignRiderToBranch(riderId, branchId, adminId, assignmentType = 'PRIMARY') {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');

      const assignedAt = formatMySQLDate();
      const assignmentId = await RiderRepository.createBranchAssignment({
        rider_id: riderId,
        branch_id: branchId,
        assignment_type: assignmentType,
        assigned_by: adminId,
        assigned_at: assignedAt
      });

      logger.info('Rider assigned to branch', { riderId, branchId, by: adminId });
      return { assignmentId, riderId, branchId, status: 'ACTIVE' };
    } catch (error) {
      logger.error('RiderService - Assign Branch Error:', error);
      throw error;
    }
  }

  // Transfer rider branch
  async transferRiderBranch(riderId, toBranchId, transferReason, adminId) {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');

      const now = formatMySQLDate();
      await RiderRepository.transferBranchAssignment(riderId, toBranchId, transferReason, adminId, now);

      logger.info('Rider branch transferred', { riderId, toBranchId, by: adminId });
      return true;
    } catch (error) {
      logger.error('RiderService - Transfer Branch Error:', error);
      throw error;
    }
  }

  // Assign vehicle to rider
  async assignVehicleToRider(riderId, vehicleId, assignmentReason, odometerStart, adminId) {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');

      const now = formatMySQLDate();
      await RiderRepository.createVehicleAssignment({
        vehicle_id: vehicleId,
        rider_id: riderId,
        assigned_by: adminId,
        assignment_reason: assignmentReason,
        assigned_at: now
      });

      // Update rider's assigned_vehicle_id
      await RiderRepository.updateRiderVehicle(riderId, vehicleId, 'ASSIGN', now);

      logger.info('Vehicle assigned to rider', { riderId, vehicleId, by: adminId });
      return true;
    } catch (error) {
      logger.error('RiderService - Assign Vehicle Error:', error);
      throw error;
    }
  }

  // Remove vehicle from rider
  async removeVehicleFromRider(riderId, removalReason, odometerEnd, adminId) {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');
      if (!rider.assigned_vehicle_id) throw new Error('Rider has no vehicle assigned');

      const now = formatMySQLDate();
      await RiderRepository.closeVehicleAssignment(riderId, rider.assigned_vehicle_id, removalReason, now);
      await RiderRepository.updateRiderVehicle(riderId, null, 'REMOVE', now);

      logger.info('Vehicle removed from rider', { riderId, by: adminId });
      return true;
    } catch (error) {
      logger.error('RiderService - Remove Vehicle Error:', error);
      throw error;
    }
  }

  // Get rider's current vehicle
  async getRiderVehicle(riderId) {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');

      if (!rider.assigned_vehicle_id) return { vehicle: null };

      const vehicle = await RiderRepository.getVehicleById(rider.assigned_vehicle_id);
      return { vehicle };
    } catch (error) {
      logger.error('RiderService - Get Rider Vehicle Error:', error);
      throw error;
    }
  }

  // Get rider performance
  async getRiderPerformance(riderId, periodType = 'MONTHLY') {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');

      const performance = await RiderRepository.getRiderPerformance(riderId, periodType);
      return { performance };
    } catch (error) {
      logger.error('RiderService - Get Rider Performance Error:', error);
      throw error;
    }
  }

  // Get rider earnings
  async getRiderEarnings(riderId) {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');

      const earnings = await RiderRepository.getRiderEarnings(riderId);
      const wallet = await RiderRepository.getRiderWallet(riderId);

      return {
        earnings,
        wallet: wallet || { balance: 0, total_earnings: 0, pending_settlement: 0 }
      };
    } catch (error) {
      logger.error('RiderService - Get Rider Earnings Error:', error);
      throw error;
    }
  }

  // Get rider wallet
  async getRiderWallet(riderId) {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');

      const wallet = await RiderRepository.getRiderWallet(riderId);
      return { wallet: wallet || { balance: 0 } };
    } catch (error) {
      logger.error('RiderService - Get Rider Wallet Error:', error);
      throw error;
    }
  }

  // Get rider wallet transactions (detailed / paginated)
  async getRiderWalletTransactionsDetailed(riderId, pagination) {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');

      return await RiderRepository.getRiderPayments(riderId, pagination, {});
    } catch (error) {
      logger.error('RiderService - Get Rider Wallet Transactions Error:', error);
      throw error;
    }
  }

  // Get rider jobs
  async getRiderJobs(riderId, filters) {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');

      const jobs = await RiderRepository.getRiderJobStatistics(riderId);
      return { jobs };
    } catch (error) {
      logger.error('RiderService - Get Rider Jobs Error:', error);
      throw error;
    }
  }

  // Get rider activity timeline
  async getRiderActivityTimeline(riderId, filters) {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');

      const activities = await RiderRepository.getRiderActivityLogs(riderId, filters);
      return { activities };
    } catch (error) {
      logger.error('RiderService - Get Rider Activity Timeline Error:', error);
      throw error;
    }
  }

  // Get rider login history
  async getRiderLoginHistory(riderId, limit = 20) {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');

      const history = await RiderRepository.getRiderLoginHistory(riderId, limit);
      return { loginHistory: history };
    } catch (error) {
      logger.error('RiderService - Get Rider Login History Error:', error);
      throw error;
    }
  }

  // Get rider documents (detailed)
  async getRiderDocumentsDetailed(riderId) {
    try {
      const rider = await RiderRepository.findById(riderId);
      if (!rider) throw new Error('Rider not found');

      const documents = await RiderRepository.getRiderDocuments(riderId);
      return { documents };
    } catch (error) {
      logger.error('RiderService - Get Rider Documents Error:', error);
      throw error;
    }
  }

  // Export riders
  async exportRiders(format, filters) {
    try {
      const riders = await RiderRepository.getRidersForExport(filters);

      // Format data for export
      const formattedData = riders.map(rider => ({
        'Rider ID': rider.rider_id,
        'Full Name': rider.full_name,
        'Phone Number': rider.phone_number,
        'Email': rider.email || 'N/A',
        'Rider Code': rider.rider_code,
        'Date of Birth': rider.date_of_birth || 'N/A',
        'Gender': rider.gender || 'N/A',
        'Assigned City': rider.assigned_city || 'N/A',
        'Assigned Zone': rider.assigned_zone || 'N/A',
        'Status': rider.status,
        'Online Status': rider.online_status,
        'Availability': rider.availability,
        'KYC Status': rider.kyc_status,
        'Rating': parseFloat(rider.rating || 0),
        'Total Trips': rider.total_trips,
        'Completed Trips': rider.completed_trips,
        'Cancelled Trips': rider.cancelled_trips,
        'Total Earnings': parseFloat(rider.total_earnings || 0),
        'Wallet Balance': parseFloat(rider.wallet_balance || 0),
        'Acceptance Rate (%)': parseFloat(rider.acceptance_rate || 0),
        'Completion Rate (%)': parseFloat(rider.completion_rate || 0),
        'Vehicle Type': rider.vehicle_type || 'N/A',
        'Model Name': rider.model_name || 'N/A',
        'Registration Number': rider.registration_number || 'N/A',
        'Registration Date': rider.created_at
      }));

      return {
        format,
        data: formattedData
      };
    } catch (error) {
      logger.error('RiderService - Export Riders Error:', error);
      throw new Error('Failed to export riders');
    }
  }
}

module.exports = new RiderService();
