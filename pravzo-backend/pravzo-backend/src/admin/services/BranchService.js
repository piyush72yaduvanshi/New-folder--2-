const BranchRepository = require('../repositories/BranchRepository');
const logger = require('../../../src/utils/logger');
const db = require('../../../src/config/db');

class BranchService {
  // ==================== CREATE BRANCH ====================

  async createBranch(branchData, createdBy, requestInfo) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Validate unique constraints
      const existingName = await BranchRepository.findByName(branchData.branch_name);
      if (existingName) {
        throw new Error('Branch name already exists');
      }

      const existingCode = await BranchRepository.findByBranchCode(branchData.branch_code);
      if (existingCode) {
        throw new Error('Branch code already exists');
      }

      const existingEmail = await BranchRepository.findByEmail(branchData.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }

      const existingPhone = await BranchRepository.findByPhone(branchData.phone_number);
      if (existingPhone) {
        throw new Error('Phone number already exists');
      }

      // Prepare branch data
      const newBranchData = {
        ...branchData,
        branch_status: branchData.branch_status || 'ACTIVE',
        branch_type: branchData.branch_type || 'SUB',
        country: branchData.country || 'India',
        created_by: createdBy
      };

      // Create branch
      const branchId = await BranchRepository.createBranch(newBranchData);

      // Create default settings
      const settingsData = {
        branch_id: branchId,
        timezone: branchData.settings?.timezone || 'Asia/Kolkata',
        currency: branchData.settings?.currency || 'INR',
        language: branchData.settings?.language || 'en',
        max_riders: branchData.settings?.max_riders || 50,
        max_vehicles: branchData.settings?.max_vehicles || 100,
        max_daily_bookings: branchData.settings?.max_daily_bookings || 500,
        booking_radius_km: branchData.settings?.booking_radius_km || 10.00,
        min_booking_amount: branchData.settings?.min_booking_amount || 0.00,
        commission_percentage: branchData.settings?.commission_percentage || 10.00,
        auto_assign_riders: branchData.settings?.auto_assign_riders !== false,
        auto_accept_bookings: branchData.settings?.auto_accept_bookings || false,
        enable_email_notifications: branchData.settings?.enable_email_notifications !== false,
        enable_sms_notifications: branchData.settings?.enable_sms_notifications !== false,
        enable_push_notifications: branchData.settings?.enable_push_notifications !== false,
        accept_cash: branchData.settings?.accept_cash !== false,
        accept_online: branchData.settings?.accept_online !== false,
        accept_wallet: branchData.settings?.accept_wallet !== false,
        created_by: createdBy
      };

      await BranchRepository.createBranchSettings(settingsData);

      // Log activity
      await BranchRepository.createActivityLog({
        branch_id: branchId,
        admin_id: createdBy,
        action: 'CREATED',
        description: `Branch "${branchData.branch_name}" created with code ${branchData.branch_code}`,
        new_value: JSON.stringify({ branch_id: branchId, branch_name: branchData.branch_name }),
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      await connection.commit();

      // Get created branch details
      const branch = await BranchRepository.getBranchDetails(branchId);
      const settings = await BranchRepository.getBranchSettings(branchId);

      return {
        branch,
        settings
      };

    } catch (error) {
      await connection.rollback();
      logger.error('Branch Service - Create Branch Error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ==================== GET BRANCHES ====================

  async getBranches(filters, pagination) {
    try {
      return await BranchRepository.getBranches(filters, pagination);
    } catch (error) {
      logger.error('Branch Service - Get Branches Error:', error);
      throw error;
    }
  }

  // ==================== GET BRANCH BY ID ====================

  async getBranchById(branchId) {
    try {
      const branch = await BranchRepository.getBranchDetails(branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }

      // Get settings
      const settings = await BranchRepository.getBranchSettings(branchId);

      return {
        branch,
        settings
      };
    } catch (error) {
      logger.error('Branch Service - Get Branch By ID Error:', error);
      throw error;
    }
  }

  // ==================== UPDATE BRANCH ====================

  async updateBranch(branchId, updateData, updatedBy, requestInfo) {
    try {
      // Check if branch exists
      const branch = await BranchRepository.findById(branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }

      // Validate unique constraints if email/phone changed
      if (updateData.email && updateData.email !== branch.email) {
        const existingEmail = await BranchRepository.findByEmail(updateData.email);
        if (existingEmail) {
          throw new Error('Email already exists');
        }
      }

      if (updateData.phone_number && updateData.phone_number !== branch.phone_number) {
        const existingPhone = await BranchRepository.findByPhone(updateData.phone_number);
        if (existingPhone) {
          throw new Error('Phone number already exists');
        }
      }

      if (updateData.branch_name && updateData.branch_name !== branch.branch_name) {
        const existingName = await BranchRepository.findByName(updateData.branch_name);
        if (existingName) {
          throw new Error('Branch name already exists');
        }
      }

      // Update branch
      const dataToUpdate = {
        ...updateData,
        updated_by: updatedBy
      };

      const updated = await BranchRepository.updateBranch(branchId, dataToUpdate);
      if (!updated) {
        throw new Error('Failed to update branch');
      }

      // Log activity
      await BranchRepository.createActivityLog({
        branch_id: branchId,
        admin_id: updatedBy,
        action: 'UPDATED',
        description: `Branch "${branch.branch_name}" updated`,
        old_value: JSON.stringify(branch),
        new_value: JSON.stringify(updateData),
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      // Get updated branch details
      return await this.getBranchById(branchId);

    } catch (error) {
      logger.error('Branch Service - Update Branch Error:', error);
      throw error;
    }
  }

  // ==================== UPDATE BRANCH STATUS ====================

  async updateBranchStatus(branchId, status, updatedBy, requestInfo) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if branch exists
      const branch = await BranchRepository.findById(branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }

      // Business rule: Check if branch can be inactivated
      if (status === 'INACTIVE') {
        const hasActiveBookings = await BranchRepository.hasActiveBookings(branchId);
        if (hasActiveBookings) {
          throw new Error('Cannot inactivate branch with active bookings');
        }
      }

      // Update status
      const updated = await BranchRepository.updateBranchStatus(branchId, status, updatedBy);
      if (!updated) {
        throw new Error('Failed to update branch status');
      }

      // Log activity
      await BranchRepository.createActivityLog({
        branch_id: branchId,
        admin_id: updatedBy,
        action: 'STATUS_CHANGED',
        description: `Branch status changed from ${branch.branch_status} to ${status}`,
        old_value: branch.branch_status,
        new_value: status,
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      await connection.commit();

      return {
        branch_id: branchId,
        old_status: branch.branch_status,
        new_status: status
      };

    } catch (error) {
      await connection.rollback();
      logger.error('Branch Service - Update Branch Status Error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ==================== DELETE BRANCH ====================

  async deleteBranch(branchId, deletedBy, requestInfo) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if branch exists
      const branch = await BranchRepository.findById(branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }

      // Business rules: Check if branch can be deleted
      const hasActiveBookings = await BranchRepository.hasActiveBookings(branchId);
      if (hasActiveBookings) {
        throw new Error('Cannot delete branch with active bookings');
      }

      const hasActiveRiders = await BranchRepository.hasActiveRiders(branchId);
      if (hasActiveRiders) {
        throw new Error('Cannot delete branch with active riders');
      }

      const hasActiveVehicles = await BranchRepository.hasActiveVehicles(branchId);
      if (hasActiveVehicles) {
        throw new Error('Cannot delete branch with active vehicles');
      }

      const hasAssignedAdmins = await BranchRepository.hasAssignedAdmins(branchId);
      if (hasAssignedAdmins) {
        throw new Error('Cannot delete branch with assigned admin');
      }

      // Soft delete branch
      const deleted = await BranchRepository.softDeleteBranch(branchId, deletedBy);
      if (!deleted) {
        throw new Error('Failed to delete branch');
      }

      // Log activity
      await BranchRepository.createActivityLog({
        branch_id: branchId,
        admin_id: deletedBy,
        action: 'DELETED',
        description: `Branch "${branch.branch_name}" (${branch.branch_code}) deleted`,
        old_value: JSON.stringify(branch),
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      await connection.commit();

      return {
        branch_id: branchId,
        branch_name: branch.branch_name,
        deleted: true
      };

    } catch (error) {
      await connection.rollback();
      logger.error('Branch Service - Delete Branch Error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ==================== GET BRANCH STATISTICS ====================

  async getBranchStatistics(branchId) {
    try {
      // Check if branch exists
      const branch = await BranchRepository.findById(branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }

      return await BranchRepository.getBranchStatistics(branchId);
    } catch (error) {
      logger.error('Branch Service - Get Branch Statistics Error:', error);
      throw error;
    }
  }

  // ==================== GET ACTIVITY LOGS ====================

  async getActivityLogs(branchId, pagination) {
    try {
      // Check if branch exists
      const branch = await BranchRepository.findById(branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }

      return await BranchRepository.getActivityLogs(branchId, pagination);
    } catch (error) {
      logger.error('Branch Service - Get Activity Logs Error:', error);
      throw error;
    }
  }

  // ==================== GET BRANCH SETTINGS ====================

  async getBranchSettings(branchId) {
    try {
      const branch = await BranchRepository.findById(branchId);
      if (!branch) throw new Error('Branch not found');

      // Always returns a value (defaults if no settings row exists)
      return await BranchRepository.getBranchSettings(branchId);
    } catch (error) {
      logger.error('Branch Service - Get Branch Settings Error:', error);
      throw error;
    }
  }

  // ==================== UPDATE BRANCH SETTINGS ====================

  async updateBranchSettings(branchId, settingsData, updatedBy, requestInfo) {
    try {
      // Check if branch exists
      const branch = await BranchRepository.findById(branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }

      // Get old settings (always returns defaults if no row exists)
      const oldSettings = await BranchRepository.getBranchSettings(branchId);

      // If no real settings row exists, create one; otherwise update
      const hasExistingRow = oldSettings.setting_id || oldSettings.id;
      if (!hasExistingRow) {
        await BranchRepository.createBranchSettings({ branch_id: branchId, ...settingsData, created_by: updatedBy });
        return await BranchRepository.getBranchSettings(branchId);
      }

      // Update settings
      const dataToUpdate = {
        ...settingsData,
        updated_by: updatedBy
      };

      const updated = await BranchRepository.updateBranchSettings(branchId, dataToUpdate);
      if (!updated) {
        throw new Error('Failed to update branch settings');
      }

      // Log activity
      await BranchRepository.createActivityLog({
        branch_id: branchId,
        admin_id: updatedBy,
        action: 'SETTINGS_UPDATED',
        description: `Branch settings updated for "${branch.branch_name}"`,
        old_value: JSON.stringify(oldSettings),
        new_value: JSON.stringify(settingsData),
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      // Get updated settings
      return await BranchRepository.getBranchSettings(branchId);

    } catch (error) {
      logger.error('Branch Service - Update Branch Settings Error:', error);
      throw error;
    }
  }
}

module.exports = new BranchService();

