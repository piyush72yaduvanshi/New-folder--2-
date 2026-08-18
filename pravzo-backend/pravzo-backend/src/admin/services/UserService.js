const UserRepository = require('../repositories/UserRepository');
const { formatMySQLDate } = require('../../../src/utils/helpers');
const logger = require('../../../src/utils/logger');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class UserService {
  // Get paginated users list
  async getUsers(filters, pagination) {
    try {
      return await UserRepository.getUsers(filters, pagination);
    } catch (error) {
      logger.error('UserService - Get Users Error:', error);
      throw new Error('Failed to fetch users');
    }
  }

  // Get user by ID with complete profile
  async getUserById(userId) {
    try {
      const user = await UserRepository.getUserProfile(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Get additional data
      const [
        addresses,
        documents,
        devices,
        walletTransactions,
        bookingStats,
        paymentStats,
        supportTickets
      ] = await Promise.all([
        UserRepository.getUserAddresses(userId),
        UserRepository.getUserDocuments(userId),
        UserRepository.getUserDevices(userId),
        UserRepository.getUserWalletTransactions(userId, 5),
        UserRepository.getBookingStatistics(userId),
        UserRepository.getPaymentStatistics(userId),
        UserRepository.getSupportTicketCount(userId)
      ]);

      return {
        // Keep raw DB row at top-level so DTO.toUser(user.profile) works correctly
        // transformUser expects snake_case DB columns (user_id, full_name, etc.)
        profile: {
          // --- snake_case DB fields (required by DTO.toUser / transformUser) ---
          user_id:                user.user_id,
          full_name:              user.full_name,
          phone_number:           user.phone_number,
          email:                  user.email,
          date_of_birth:          user.date_of_birth,
          gender:                 user.gender,
          address:                user.address,
          city:                   user.city,
          state:                  user.state,
          pincode:                user.pincode,
          role:                   user.role || 'RENT_A_VEHICLE',
          profile_photo:          user.profile_photo,
          status:                 user.status,
          kyc_status:             user.kyc_status,
          email_verified:         user.email_verified,
          phone_verified:         user.phone_verified,
          wallet_balance:         user.wallet_balance,
          branch_id:              user.branch_id,
          branch_name:            user.branch_name || null,
          created_at:             user.created_at,
          updated_at:             user.updated_at,
          // Document columns
          aadhar_number:          user.aadhar_number || null,
          aadhar_front_url:       user.aadhar_card_photo || null,
          aadhar_back_url:        user.aadhar_card_back_photo || null,
          driving_license_number: user.driving_license_number || null,
          driving_license_front_url: user.driving_license_photo || null,
          driving_license_back_url:  user.driving_license_back_photo || null,
          bank_account_number:    user.bank_account_number || null,
          ifsc_code:              user.ifsc_code || null,
          // --- camelCase aliases (legacy / backward compat) ---
          userId:           user.user_id,
          id:               `USR${user.user_id}`,
          fullName:         user.full_name,
          name:             user.full_name,
          phoneNumber:      user.phone_number,
          phone:            user.phone_number,
          dateOfBirth:      user.date_of_birth,
          dob:              user.date_of_birth,
          aadharNumber:     user.aadhar_number || null,
          drivingLicenseNumber: user.driving_license_number || null,
          bankAccountNumber: user.bank_account_number || null,
          ifscCode:         user.ifsc_code || null,
          walletBalance:    parseFloat(user.wallet_balance || 0),
          walletAmount:     parseFloat(user.wallet_balance || 0),
          kycStatus:        user.kyc_status,
          emailVerified:    user.email_verified,
          phoneVerified:    user.phone_verified,
          createdAt:        user.created_at,
          updatedAt:        user.updated_at,
        },
        addresses: addresses.map(addr => ({
          addressId: addr.address_id,
          addressType: addr.address_type,
          addressLine1: addr.address_line1,
          addressLine2: addr.address_line2,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          latitude: addr.latitude,
          longitude: addr.longitude,
          isDefault: addr.is_default === 1,
          createdAt: addr.created_at
        })),
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
          bookings: {
            total: bookingStats.total_bookings,
            completed: bookingStats.completed,
            cancelled: bookingStats.cancelled,
            active: bookingStats.active,
            totalSpent: parseFloat(bookingStats.total_spent || 0)
          },
          payments: {
            total: paymentStats.total_payments,
            totalAmount: parseFloat(paymentStats.total_amount || 0),
            successful: paymentStats.successful,
            failed: paymentStats.failed
          },
          support: {
            total: supportTickets.total,
            open: supportTickets.open,
            resolved: supportTickets.resolved
          }
        }
      };
    } catch (error) {
      logger.error('UserService - Get User By ID Error:', error);
      throw error;
    }
  }

  // Block user
  async blockUser(userId, reason, adminId) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (user.status === 'BLOCKED') {
        throw new Error('User is already blocked');
      }

      const blockedAt = formatMySQLDate();
      await UserRepository.blockUser(userId, reason, adminId, blockedAt);

      logger.info('User blocked successfully', { 
        userId, 
        blockedBy: adminId, 
        reason 
      });

      return true;
    } catch (error) {
      logger.error('UserService - Block User Error:', error);
      throw error;
    }
  }

  // Unblock user
  async unblockUser(userId, adminId) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (user.status !== 'BLOCKED') {
        throw new Error('User is not blocked');
      }

      const unblockedAt = formatMySQLDate();
      await UserRepository.unblockUser(userId, unblockedAt);

      logger.info('User unblocked successfully', { 
        userId, 
        unblockedBy: adminId 
      });

      return true;
    } catch (error) {
      logger.error('UserService - Unblock User Error:', error);
      throw error;
    }
  }

  // Verify user manually
  async verifyUser(userId, adminId, remarks = null) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const verifiedAt = formatMySQLDate();
      await UserRepository.verifyUser(userId, adminId, verifiedAt, remarks);

      logger.info('User verified successfully', { 
        userId, 
        verifiedBy: adminId 
      });

      return true;
    } catch (error) {
      logger.error('UserService - Verify User Error:', error);
      throw error;
    }
  }

  // Update user status
  async updateUserStatus(userId, status, adminId) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (user.status === status) {
        throw new Error(`User status is already ${status}`);
      }

      const updatedAt = formatMySQLDate();
      await UserRepository.updateUserStatus(userId, status, updatedAt);

      logger.info('User status updated successfully', { 
        userId, 
        newStatus: status,
        updatedBy: adminId 
      });

      return true;
    } catch (error) {
      logger.error('UserService - Update User Status Error:', error);
      throw error;
    }
  }

  // Soft delete user
  async deleteUser(userId, reason, adminId) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const deletedAt = formatMySQLDate();
      await UserRepository.softDeleteUser(userId, reason, adminId, deletedAt);

      logger.info('User deleted successfully', { 
        userId, 
        deletedBy: adminId, 
        reason 
      });

      return true;
    } catch (error) {
      logger.error('UserService - Delete User Error:', error);
      throw error;
    }
  }

  // Export users
  async exportUsers(format, filters) {
    try {
      const users = await UserRepository.getUsersForExport(filters);

      // Format data for export using actual DB column names
      const formattedData = users.map(user => ({
        'User ID': `USR${user.user_id}`,
        'Full Name': user.full_name,
        'Phone Number': user.phone_number,
        'Email': user.email || 'N/A',
        'Date of Birth': user.date_of_birth || 'N/A',
        'Gender': user.gender || 'N/A',
        'Role': user.role || 'User',
        'Address': user.address || 'N/A',
        'City': user.city || 'N/A',
        'State': user.state || 'N/A',
        'Pincode': user.pincode || 'N/A',
        'KYC Status': user.kyc_status || 'PENDING',
        'Wallet Balance': parseFloat(user.wallet_balance || 0),
        'Total Bookings': user.total_bookings || 0,
        'Total Spent': parseFloat(user.total_spent || 0),
        'Status': user.status,
        'Registration Date': user.created_at
      }));

      return {
        format,
        data: formattedData
      };
    } catch (error) {
      logger.error('UserService - Export Users Error:', error);
      throw new Error('Failed to export users');
    }
  }

  // Get user login history
  async getUserLoginHistory(userId, pagination) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const result = await UserRepository.getUserLoginHistory(userId, pagination);

      result.loginHistory = result.loginHistory.map(history => ({
        deviceId: history.device_id,
        deviceType: history.device_type,
        deviceModel: history.device_model,
        osVersion: history.os_version,
        appVersion: history.app_version,
        isActive: history.is_active === 1,
        lastActiveAt: history.last_active_at,
        loginTime: history.created_at
      }));

      return result;
    } catch (error) {
      logger.error('UserService - Get Login History Error:', error);
      throw error;
    }
  }

  // Get user bookings
  async getUserBookings(userId, pagination, filters) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) throw new Error('User not found');

      const result = await UserRepository.getUserBookings(userId, pagination, filters);

      // rider_trips columns: trip_id, fare_amount, status, created_at etc.
      result.bookings = result.bookings.map(booking => ({
        bookingId: `BK${booking.trip_id}`,
        tripId: booking.trip_id,
        riderId: booking.rider_id,
        pickupAddress: booking.pickup_address,
        dropoffAddress: booking.dropoff_address,
        distanceKm: parseFloat(booking.distance_km || 0),
        durationMinutes: booking.duration_minutes,
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
      logger.error('UserService - Get User Bookings Error:', error);
      throw error;
    }
  }

  // Get user payments
  async getUserPayments(userId, pagination, filters) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) throw new Error('User not found');

      const result = await UserRepository.getUserPayments(userId, pagination, filters);
      // Get refunds (status = REFUNDED in payment_transactions)
      const refunds = await UserRepository.getUserRefunds(userId, 10);

      // payment_transactions columns: payment_id, transaction_id, reference_type,
      // reference_id, amount, payment_method, status, created_at
      result.payments = result.payments.map(payment => ({
        paymentId: payment.payment_id,
        transactionId: payment.transaction_id,
        referenceType: payment.reference_type,
        referenceId: payment.reference_id,
        amount: parseFloat(payment.amount),
        paymentMethod: payment.payment_method,
        status: payment.status,
        createdAt: payment.created_at
      }));

      result.refunds = refunds.map(refund => ({
        paymentId: refund.payment_id,
        referenceId: refund.reference_id,
        amount: parseFloat(refund.amount),
        paymentMethod: refund.payment_method,
        status: refund.status,
        createdAt: refund.created_at
      }));

      return result;
    } catch (error) {
      logger.error('UserService - Get User Payments Error:', error);
      throw error;
    }
  }

  // Get user activity
  async getUserActivity(userId, limit = 20) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const activities = await UserRepository.getUserActivity(userId, limit);

      return activities.map(activity => ({
        activityType: activity.activity_type,
        referenceId: activity.ref_id,
        description: activity.description,
        createdAt: activity.created_at
      }));
    } catch (error) {
      logger.error('UserService - Get User Activity Error:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStatistics() {
    try {
      const stats = await UserRepository.getUserStatistics();

      return {
        totalUsers: stats.total_users,
        activeUsers: stats.active_users,
        blockedUsers: stats.blocked_users,
        inactiveUsers: stats.inactive_users,
        pendingUsers: stats.pending_users,
        verifiedUsers: stats.verified_users,
        todayRegistrations: stats.today_registrations,
        monthlyRegistrations: stats.monthly_registrations,
        growthPercentage: stats.growth_percentage
      };
    } catch (error) {
      logger.error('UserService - Get User Statistics Error:', error);
      throw new Error('Failed to fetch user statistics');
    }
  }

  // ==================== ENTERPRISE USER MANAGEMENT ====================
  // ==================== KYC VERIFICATION ====================

  async verifyKYC(kycId, status, adminId, remarks = null, reason = null) {
    try {
      const userId = kycId;
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const kycStatus = status === 'APPROVED' ? 'APPROVED' : (status === 'REJECTED' ? 'REJECTED' : status);
      await UserRepository.updateKYCStatusDirect(userId, kycStatus);

      // Log activity (no-op if table missing)
      await UserRepository.createActivityLog({
        userId,
        activityType: status === 'APPROVED' ? 'KYC_APPROVAL' : 'KYC_REJECTION',
        description: `KYC ${status.toLowerCase()} by admin`,
        referenceType: 'KYC',
        referenceId: userId,
        performedByType: 'ADMIN',
        performedById: adminId
      });

      logger.info('KYC verification processed', { userId, status, verifiedBy: adminId });
      return true;
    } catch (error) {
      logger.error('UserService - Verify KYC Error:', error);
      throw error;
    }
  }

  async getKYCDetails(userId) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const kycRecords = await UserRepository.getKYCDetails(userId);

      return kycRecords.map(kyc => ({
        kycId: kyc.kyc_id,
        documentType: kyc.document_type,
        documentNumber: kyc.document_number,
        fullName: kyc.full_name,
        dateOfBirth: kyc.date_of_birth,
        issueDate: kyc.issue_date,
        expiryDate: kyc.expiry_date,
        frontImageUrl: kyc.front_image_url,
        backImageUrl: kyc.back_image_url,
        selfieUrl: kyc.selfie_url,
        verificationStatus: kyc.verification_status,
        verifiedAt: kyc.verified_at,
        verifiedBy: kyc.verified_by,
        verifiedByName: kyc.verified_by_name,
        adminRemarks: kyc.admin_remarks,
        rejectionReason: kyc.rejection_reason,
        submittedAt: kyc.submitted_at,
        createdAt: kyc.created_at
      }));
    } catch (error) {
      logger.error('UserService - Get KYC Details Error:', error);
      throw error;
    }
  }

  // ==================== WALLET MANAGEMENT ====================

  async getWallet(userId) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const walletBalance = await UserRepository.getWalletBalance(userId);

      const balance = parseFloat(walletBalance?.wallet_balance || 0);
      return {
        userId,
        walletAmount: balance,
        walletBalance: balance,
        frozenBalance: 0,
        availableBalance: balance
      };
    } catch (error) {
      logger.error('UserService - Get Wallet Error:', error);
      throw error;
    }
  }

  async creditWallet(userId, amount, description, referenceType, referenceId, adminId, paymentMethod = null, paymentReference = null) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (amount <= 0) {
        throw new Error('Credit amount must be greater than 0');
      }

      const result = await UserRepository.creditWallet(
        userId, amount, description, referenceType, referenceId, 
        adminId, paymentMethod, paymentReference
      );

      // Log activity
      await UserRepository.createActivityLog({
        userId,
        activityType: 'WALLET_CREDIT',
        description: `Wallet credited with ₹${amount}`,
        referenceType,
        referenceId,
        oldValue: JSON.stringify({ balance: result.balanceBefore }),
        newValue: JSON.stringify({ balance: result.balanceAfter }),
        performedByType: 'ADMIN',
        performedById: adminId
      });

      logger.info('Wallet credited', { 
        userId, 
        amount,
        creditedBy: adminId 
      });

      return result;
    } catch (error) {
      logger.error('UserService - Credit Wallet Error:', error);
      throw error;
    }
  }

  async debitWallet(userId, amount, description, referenceType, referenceId, adminId, notes = null) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (amount <= 0) {
        throw new Error('Debit amount must be greater than 0');
      }

      const result = await UserRepository.debitWallet(
        userId, amount, description, referenceType, referenceId, adminId, notes
      );

      // Log activity
      await UserRepository.createActivityLog({
        userId,
        activityType: 'WALLET_DEBIT',
        description: `Wallet debited with ₹${amount}`,
        referenceType,
        referenceId,
        oldValue: JSON.stringify({ balance: result.balanceBefore }),
        newValue: JSON.stringify({ balance: result.balanceAfter }),
        performedByType: 'ADMIN',
        performedById: adminId
      });

      logger.info('Wallet debited', { 
        userId, 
        amount,
        debitedBy: adminId 
      });

      return result;
    } catch (error) {
      logger.error('UserService - Debit Wallet Error:', error);
      throw error;
    }
  }

  async getWalletTransactions(userId, pagination, filters) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const result = await UserRepository.getWalletTransactionsDetailed(userId, pagination, filters);

      result.transactions = result.transactions.map(txn => ({
        transactionId: txn.transaction_id,
        transactionType: txn.transaction_type,
        transactionStatus: txn.transaction_status,
        amount: parseFloat(txn.amount),
        balanceBefore: parseFloat(txn.balance_before),
        balanceAfter: parseFloat(txn.balance_after),
        referenceType: txn.reference_type,
        referenceId: txn.reference_id,
        description: txn.description,
        paymentMethod: txn.payment_method,
        paymentReference: txn.payment_reference,
        processedByType: txn.processed_by_type,
        processedById: txn.processed_by_id,
        notes: txn.notes,
        createdAt: txn.created_at
      }));

      return result;
    } catch (error) {
      logger.error('UserService - Get Wallet Transactions Error:', error);
      throw error;
    }
  }

  // ==================== BRANCH TRANSFER ====================

  async transferBranch(userId, branchId, reason, notes, adminId) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Validate transfer
      const validation = await UserRepository.validateBranchTransfer(userId);

      if (!validation.canTransfer) {
        const reasons = [];
        if (validation.hasActiveRental) reasons.push('user has active rental');
        if (validation.hasActiveBooking) reasons.push('user has active booking');
        if (validation.hasPendingSettlement) reasons.push('user has pending settlement');
        
        throw new Error(`Cannot transfer branch: ${reasons.join(', ')}`);
      }

      const fromBranchId = user.branch_id;

      await UserRepository.transferBranch(userId, fromBranchId, branchId, reason, notes, adminId);

      // Log activity
      await UserRepository.createActivityLog({
        userId,
        activityType: 'BRANCH_TRANSFER',
        description: `Branch transferred from ${fromBranchId} to ${branchId}`,
        referenceType: 'BRANCH',
        referenceId: branchId,
        oldValue: JSON.stringify({ branchId: fromBranchId }),
        newValue: JSON.stringify({ branchId }),
        performedByType: 'ADMIN',
        performedById: adminId
      });

      logger.info('Branch transfer completed', { 
        userId, 
        fromBranchId,
        toBranchId: branchId,
        transferredBy: adminId 
      });

      return validation;
    } catch (error) {
      logger.error('UserService - Transfer Branch Error:', error);
      throw error;
    }
  }

  async getBranchAssignmentHistory(userId) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const history = await UserRepository.getBranchAssignmentHistory(userId);

      return history.map(record => ({
        assignmentId: record.assignment_id,
        branchId: record.branch_id,
        branchName: record.branch_name,
        branchCity: record.branch_city,
        assignmentStatus: record.assignment_status,
        assignmentType: record.assignment_type,
        assignedAt: record.assigned_at,
        assignedBy: record.assigned_by,
        assignedByName: record.assigned_by_name,
        unassignedAt: record.unassigned_at,
        unassignedBy: record.unassigned_by,
        unassignedByName: record.unassigned_by_name,
        transferredFromBranch: record.transferred_from_branch,
        transferredFromBranchName: record.transferred_from_branch_name,
        transferredToBranch: record.transferred_to_branch,
        transferredToBranchName: record.transferred_to_branch_name,
        transferReason: record.transfer_reason,
        transferNotes: record.transfer_notes
      }));
    } catch (error) {
      logger.error('UserService - Get Branch Assignment History Error:', error);
      throw error;
    }
  }

  // ==================== ACTIVITY TIMELINE ====================

  async getActivityTimeline(userId, pagination, filters) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const result = await UserRepository.getActivityTimeline(userId, pagination, filters);

      result.activities = result.activities.map(activity => ({
        activityId: activity.activity_id,
        activityType: activity.activity_type,
        description: activity.activity_description,
        referenceType: activity.reference_type,
        referenceId: activity.reference_id,
        oldValue: activity.old_value,
        newValue: activity.new_value,
        performedByType: activity.performed_by_type,
        performedById: activity.performed_by_id,
        ipAddress: activity.ip_address,
        deviceType: activity.device_type,
        createdAt: activity.created_at
      }));

      return result;
    } catch (error) {
      logger.error('UserService - Get Activity Timeline Error:', error);
      throw error;
    }
  }

  // ==================== LOGIN HISTORY ====================

  async getLoginHistoryDetailed(userId, pagination, filters) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const result = await UserRepository.getLoginHistoryDetailed(userId, pagination, filters);

      result.loginHistory = result.loginHistory.map(login => ({
        loginId: login.login_id,
        loginStatus: login.login_status,
        loginMethod: login.login_method,
        failedReason: login.failed_reason,
        sessionId: login.session_id,
        ipAddress: login.ip_address,
        deviceType: login.device_type,
        deviceModel: login.device_model,
        browser: login.browser,
        operatingSystem: login.operating_system,
        appVersion: login.app_version,
        country: login.country,
        city: login.city,
        loginAt: login.login_at,
        logoutAt: login.logout_at,
        sessionDuration: login.session_duration,
        isSuspicious: login.is_suspicious === 1
      }));

      return result;
    } catch (error) {
      logger.error('UserService - Get Login History Detailed Error:', error);
      throw error;
    }
  }

  // ==================== DEVICE MANAGEMENT ====================

  async getDevices(userId) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const devices = await UserRepository.getUserDevicesDetailed(userId);

      return devices.map(device => ({
        deviceId: device.device_id,
        deviceType: device.device_type,
        deviceModel: device.device_model,
        deviceName: device.device_name,
        platform: device.platform,
        browser: device.browser,
        osVersion: device.os_version,
        appVersion: device.app_version,
        isActive: device.is_active === 1,
        isTrusted: device.is_trusted === 1,
        lastIpAddress: device.last_ip_address,
        lastActiveAt: device.last_active_at,
        notificationEnabled: device.notification_enabled === 1,
        createdAt: device.created_at
      }));
    } catch (error) {
      logger.error('UserService - Get Devices Error:', error);
      throw error;
    }
  }

  // ==================== PASSWORD RESET ====================

  async resetPassword(userId, adminId) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const tempPassword = crypto.randomBytes(10).toString('base64url').slice(0, 12);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await UserRepository.resetUserPassword(userId, hashedPassword, adminId);

      await UserRepository.createActivityLog({
        userId,
        activityType: 'PASSWORD_CHANGE',
        description: 'Password reset by admin',
        performedByType: 'ADMIN',
        performedById: adminId
      });

      logger.info('Password reset completed', {
        userId,
        resetBy: adminId
      });
      return { message: 'Password reset successfully. New credentials will be sent to the user.' };
    } catch (error) {
      logger.error('UserService - Reset Password Error:', error);
      throw error;
    }
  }

  // ==================== UPDATE USER ====================

  async updateUser(userId, updateData, adminId) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const oldData = { ...user };
      await UserRepository.updateUserDetails(userId, updateData, adminId);

      // Log activity
      await UserRepository.createActivityLog({
        userId,
        activityType: 'PROFILE_UPDATE',
        description: 'Profile updated by admin',
        oldValue: JSON.stringify(oldData),
        newValue: JSON.stringify(updateData),
        performedByType: 'ADMIN',
        performedById: adminId
      });

      logger.info('User updated', { 
        userId, 
        updatedBy: adminId 
      });

      return true;
    } catch (error) {
      logger.error('UserService - Update User Error:', error);
      throw error;
    }
  }

  // ==================== GET RENTALS & JOBS ====================

  async getUserRentals(userId, pagination, filters) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const result = await UserRepository.getUserRentals(userId, pagination, filters);

      result.rentals = result.rentals.map(rental => ({
        rentalId: rental.rental_id,
        vehicleId: rental.vehicle_id,
        modelName: rental.model_name,
        registrationNumber: rental.registration_number,
        vehicleType: rental.vehicle_type,
        startDate: rental.start_date,
        endDate: rental.end_date,
        totalAmount: parseFloat(rental.total_amount || 0),
        status: rental.status,
        createdAt: rental.created_at
      }));

      return result;
    } catch (error) {
      logger.error('UserService - Get User Rentals Error:', error);
      throw error;
    }
  }

  async getUserJobs(userId, pagination, filters) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const result = await UserRepository.getUserJobs(userId, pagination, filters);

      result.jobs = result.jobs.map(job => ({
        tripId: job.trip_id,
        jobStatus: job.job_status,
        pickupLocation: job.pickup_location,
        dropoffLocation: job.dropoff_location,
        fare: parseFloat(job.fare || 0),
        earnings: parseFloat(job.rider_earnings || 0),
        createdAt: job.created_at,
        completedAt: job.completed_at
      }));

      return result;
    } catch (error) {
      logger.error('UserService - Get User Jobs Error:', error);
      throw error;
    }
  }

  // ==================== DOCUMENT MANAGEMENT ====================

  async getDocuments(userId) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      const documents = await UserRepository.getUserDocuments(userId);
      return documents.map(doc => ({
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
      }));
    } catch (error) {
      logger.error('UserService - Get Documents Error:', error);
      throw error;
    }
  }
}

module.exports = new UserService();

