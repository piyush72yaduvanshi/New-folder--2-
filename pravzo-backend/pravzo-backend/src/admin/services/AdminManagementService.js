const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../../../src/config/db');
const AdminManagementRepository = require('../repositories/AdminManagementRepository');
const structuredLogger = require('../../../src/utils/structuredLogger');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

class AdminManagementService {
  // ==================== CREATE ADMIN ====================

  async createAdmin(adminData, createdBy, requestInfo) {
    try {
      // Check if email already exists
      const existingAdmin = await AdminManagementRepository.findByEmail(adminData.email);
      if (existingAdmin) {
        throw new Error('Email already exists');
      }

      // Generate random password
      const randomPassword = this.generateRandomPassword();
      const password_hash = await bcrypt.hash(randomPassword, 10);

      // Prepare admin data
      const newAdminData = {
        full_name: adminData.full_name,
        email: adminData.email,
        phone_number: adminData.phone_number || null,
        password_hash,
        role: adminData.role || 'ADMIN',
        department: adminData.department || 'General',
        created_by: createdBy
      };

      // Create admin
      const adminId = await AdminManagementRepository.createAdmin(newAdminData);

      // Log activity
      await AdminManagementRepository.createActivityLog({
        admin_id: createdBy,
        action: 'ADMIN_CREATED',
        details: JSON.stringify({
          new_admin_id: adminId,
          email: adminData.email,
          role: adminData.role
        }),
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      // Send credentials email (async, don't wait)
      this.sendCredentialsEmail(adminData.full_name, adminData.email, randomPassword, adminData.role, adminData.department)
        .catch(err => structuredLogger.error('Email sending failed:', err));

      // Get created admin details
      const admin = await AdminManagementRepository.getAdminDetails(adminId);

      return {
        admin,
        credentials_sent: true,
        message: 'Login credentials have been sent to the provided email address'
      };

    } catch (error) {
      structuredLogger.error('Admin Service - Create Admin Error:', error);
      throw error;
    }
  }

  // ==================== GET ADMINS ====================

  async getAdmins(filters, pagination) {
    try {
      return await AdminManagementRepository.getAdmins(filters, pagination);
    } catch (error) {
      structuredLogger.error('Admin Service - Get Admins Error:', error);
      throw error;
    }
  }

  // ==================== GET ADMIN BY ID ====================

  async getAdminById(adminId) {
    try {
      const admin = await AdminManagementRepository.getAdminDetails(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }
      return admin;
    } catch (error) {
      structuredLogger.error('Admin Service - Get Admin By ID Error:', error);
      throw error;
    }
  }

  // ==================== UPDATE ADMIN ====================

  async updateAdmin(adminId, updateData, updatedBy, requestInfo) {
    try {
      // Check if admin exists
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Update admin
      const updated = await AdminManagementRepository.updateAdmin(adminId, updateData);
      if (!updated) {
        throw new Error('Failed to update admin');
      }

      // Log activity
      await AdminManagementRepository.createActivityLog({
        admin_id: updatedBy,
        action: 'ADMIN_UPDATED',
        details: JSON.stringify({
          updated_admin_id: adminId,
          changes: updateData
        }),
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      // Get updated admin details
      return await AdminManagementRepository.getAdminDetails(adminId);

    } catch (error) {
      structuredLogger.error('Admin Service - Update Admin Error:', error);
      throw error;
    }
  }

  // ==================== BLOCK ADMIN ====================

  async blockAdmin(adminId, reason, blockedBy, requestInfo) {
    try {
      // Check if admin exists
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Cannot block yourself
      if (parseInt(adminId) === parseInt(blockedBy)) {
        throw new Error('You cannot block yourself');
      }

      if (admin.role === 'SUPER_ADMIN') {
        throw new Error('Use the status update endpoint to manage SUPER_ADMIN accounts');
      }

      // Block admin — live admins.status ENUM has no 'BLOCKED', use 'SUSPENDED'
      const blocked = await AdminManagementRepository.updateAdminStatus(adminId, 'SUSPENDED');
      if (!blocked) {
        throw new Error('Failed to block admin');
      }

      // Log activity
      await AdminManagementRepository.createActivityLog({
        admin_id: blockedBy,
        action: 'ADMIN_BLOCKED',
        details: JSON.stringify({
          blocked_admin_id: adminId,
          reason: reason || 'No reason provided'
        }),
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      return {
        admin_id: adminId,
        status: 'BLOCKED'
      };

    } catch (error) {
      structuredLogger.error('Admin Service - Block Admin Error:', error);
      throw error;
    }
  }

  // ==================== UNBLOCK ADMIN ====================

  async unblockAdmin(adminId, unblockedBy, requestInfo) {
    try {
      // Check if admin exists
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Unblock admin
      const unblocked = await AdminManagementRepository.updateAdminStatus(adminId, 'ACTIVE');
      if (!unblocked) {
        throw new Error('Failed to unblock admin');
      }

      // Log activity
      await AdminManagementRepository.createActivityLog({
        admin_id: unblockedBy,
        action: 'ADMIN_UNBLOCKED',
        details: JSON.stringify({
          unblocked_admin_id: adminId
        }),
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      return {
        admin_id: adminId,
        status: 'ACTIVE'
      };

    } catch (error) {
      structuredLogger.error('Admin Service - Unblock Admin Error:', error);
      throw error;
    }
  }

  // ==================== RESET PASSWORD ====================

  async resetPassword(adminId, resetBy, requestInfo) {
    try {
      // Get admin details
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Generate new password
      const newPassword = this.generateRandomPassword();
      const password_hash = await bcrypt.hash(newPassword, 10);

      // Update password
      const updated = await AdminManagementRepository.updateAdminPassword(adminId, password_hash);
      if (!updated) {
        throw new Error('Failed to reset password');
      }

      // Log activity
      await AdminManagementRepository.createActivityLog({
        admin_id: resetBy,
        action: 'PASSWORD_RESET',
        details: JSON.stringify({
          reset_for_admin_id: adminId
        }),
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      // Send new password email (async, don't wait)
      this.sendPasswordResetEmail(admin.full_name, admin.email, newPassword)
        .catch(err => structuredLogger.error('Email sending failed:', err));

      return {
        admin_id: adminId,
        email_sent: true
      };

    } catch (error) {
      structuredLogger.error('Admin Service - Reset Password Error:', error);
      throw error;
    }
  }

  // ==================== DELETE ADMIN ====================

  async deleteAdmin(adminId, deletedBy, requestInfo) {
    try {
      // Check if admin exists
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Cannot delete yourself
      if (parseInt(adminId) === parseInt(deletedBy)) {
        throw new Error('You cannot delete yourself');
      }

      // Soft delete admin
      const deleted = await AdminManagementRepository.softDeleteAdmin(adminId);
      if (!deleted) {
        throw new Error('Failed to delete admin');
      }

      // Log activity
      await AdminManagementRepository.createActivityLog({
        admin_id: deletedBy,
        action: 'ADMIN_DELETED',
        details: JSON.stringify({
          deleted_admin_id: adminId,
          email: admin.email
        }),
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      return {
        admin_id: adminId,
        deleted: true
      };

    } catch (error) {
      structuredLogger.error('Admin Service - Delete Admin Error:', error);
      throw error;
    }
  }

  // ==================== GET ACTIVITY LOGS ====================

  async getActivityLogs(adminId, pagination) {
    try {
      // Check if admin exists
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      return await AdminManagementRepository.getActivityLogs(adminId, pagination);
    } catch (error) {
      structuredLogger.error('Admin Service - Get Activity Logs Error:', error);
      throw error;
    }
  }

  // ==================== GET STATISTICS ====================

  async getStatistics() {
    try {
      return await AdminManagementRepository.getAdminStatistics();
    } catch (error) {
      structuredLogger.error('Admin Service - Get Statistics Error:', error);
      throw error;
    }
  }

  // ==================== UPDATE ADMIN STATUS (generic — supports all valid statuses) ====================

  async updateAdminStatus(adminId, status, updatedBy, requestInfo) {
    try {
      // Validate allowed statuses — defense-in-depth beyond express-validator
      const ALLOWED_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED', 'SUSPENDED', 'PENDING', 'LOCKED'];
      if (!ALLOWED_STATUSES.includes(status)) {
        throw new Error(`Invalid status value: ${status}`);
      }

      // Check if admin exists
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Self-protection: cannot change your own status (applies to all status changes, not just BLOCKED)
      if (parseInt(adminId) === parseInt(updatedBy)) {
        throw new Error('You cannot change your own account status');
      }

 
      if (admin.role === 'SUPER_ADMIN' && status !== 'ACTIVE') {
        const activeSuperAdminCount = await AdminManagementRepository.countActiveSuperAdmins();
        if (activeSuperAdminCount <= 1) {
          throw new Error('Cannot deactivate the last active SUPER_ADMIN account. Promote another admin first.');
        }
      }

      // Update status directly — correct status stored in DB
      const updated = await AdminManagementRepository.updateAdminStatus(adminId, status);
      if (!updated) {
        throw new Error('Failed to update admin status');
      }

      // Log activity
      await AdminManagementRepository.createActivityLog({
        admin_id: updatedBy,
        action: 'STATUS_CHANGED',
        details: JSON.stringify({
          target_admin_id: adminId,
          old_status: admin.account_status,
          new_status: status
        }),
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent
      });

      return {
        admin_id: adminId,
        status
      };
    } catch (error) {
      structuredLogger.error('Admin Service - Update Admin Status Error:', error);
      throw error;
    }
  }

  // ==================== BRANCH ASSIGNMENT ====================

  async assignBranch(adminId, branchId, assignmentType, assignedBy, requestInfo) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if admin exists
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Check if admin already has an active assignment
      const existingAssignment = await AdminManagementRepository.getActiveAssignment(adminId);
      if (existingAssignment) {
        throw new Error('Admin already has an active branch assignment');
      }

      // Check if branch already has an active admin
      const branchAdmin = await AdminManagementRepository.getActiveBranchAdmin(branchId);
      if (branchAdmin) {
        throw new Error('Branch already has an active admin assigned');
      }

      // Create assignment
      const assignmentId = await AdminManagementRepository.createBranchAssignment({
        admin_id: adminId,
        branch_id: branchId,
        assignment_type: assignmentType || 'PRIMARY',
        assigned_by: assignedBy
      });

      // Update admin's current_branch_id
      await AdminManagementRepository.updateAdminCurrentBranch(adminId, branchId);

      // Log activity
      await AdminManagementRepository.createEnhancedActivityLog({
        admin_id: assignedBy,
        action: 'BRANCH_ASSIGNED',
        module: 'ADMIN_MANAGEMENT',
        entity_type: 'ASSIGNMENT',
        entity_id: assignmentId.toString(),
        description: `Assigned admin ${admin.full_name} to branch ${branchId}`,
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent,
        request_method: 'POST',
        request_url: requestInfo.url
      });

      await connection.commit();

      return {
        assignment_id: assignmentId,
        admin_id: adminId,
        branch_id: branchId,
        status: 'ACTIVE'
      };

    } catch (error) {
      await connection.rollback();
      structuredLogger.error('Admin Service - Assign Branch Error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async transferBranch(adminId, newBranchId, transferReason, transferNotes, transferredBy, requestInfo) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if admin exists
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Get current assignment
      const currentAssignment = await AdminManagementRepository.getActiveAssignment(adminId);
      if (!currentAssignment) {
        throw new Error('Admin does not have an active branch assignment');
      }

      // Check if new branch already has an active admin
      const branchAdmin = await AdminManagementRepository.getActiveBranchAdmin(newBranchId);
      if (branchAdmin) {
        throw new Error('Destination branch already has an active admin assigned');
      }

      // Close current assignment
      await AdminManagementRepository.transferAssignment(currentAssignment.assignment_id, {
        transferred_to_branch: newBranchId,
        transfer_reason: transferReason,
        transfer_notes: transferNotes,
        unassigned_by: transferredBy
      });

      // Create new assignment
      const newAssignmentId = await AdminManagementRepository.createBranchAssignment({
        admin_id: adminId,
        branch_id: newBranchId,
        assignment_type: currentAssignment.assignment_type,
        assigned_by: transferredBy
      });

      // Update admin's current_branch_id
      await AdminManagementRepository.updateAdminCurrentBranch(adminId, newBranchId);

      // Log activity
      await AdminManagementRepository.createEnhancedActivityLog({
        admin_id: transferredBy,
        action: 'BRANCH_TRANSFERRED',
        module: 'ADMIN_MANAGEMENT',
        entity_type: 'ASSIGNMENT',
        entity_id: newAssignmentId.toString(),
        description: `Transferred admin ${admin.full_name} from branch ${currentAssignment.branch_id} to branch ${newBranchId}`,
        old_value: currentAssignment.branch_id.toString(),
        new_value: newBranchId.toString(),
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent,
        request_method: 'PATCH',
        request_url: requestInfo.url
      });

      await connection.commit();

      return {
        assignment_id: newAssignmentId,
        admin_id: adminId,
        old_branch_id: currentAssignment.branch_id,
        new_branch_id: newBranchId,
        status: 'TRANSFERRED'
      };

    } catch (error) {
      await connection.rollback();
      structuredLogger.error('Admin Service - Transfer Branch Error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async removeBranch(adminId, removedBy, requestInfo) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if admin exists
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Get current assignment
      const currentAssignment = await AdminManagementRepository.getActiveAssignment(adminId);
      if (!currentAssignment) {
        throw new Error('Admin does not have an active branch assignment');
      }

      // Close assignment
      await AdminManagementRepository.closeAssignment(
        currentAssignment.assignment_id,
        removedBy,
        'REMOVED'
      );

      // Update admin's current_branch_id to NULL
      await AdminManagementRepository.updateAdminCurrentBranch(adminId, null);

      // Log activity
      await AdminManagementRepository.createEnhancedActivityLog({
        admin_id: removedBy,
        action: 'BRANCH_REMOVED',
        module: 'ADMIN_MANAGEMENT',
        entity_type: 'ASSIGNMENT',
        entity_id: currentAssignment.assignment_id.toString(),
        description: `Removed admin ${admin.full_name} from branch ${currentAssignment.branch_id}`,
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent,
        request_method: 'PATCH',
        request_url: requestInfo.url
      });

      await connection.commit();

      return {
        admin_id: adminId,
        branch_id: currentAssignment.branch_id,
        status: 'REMOVED'
      };

    } catch (error) {
      await connection.rollback();
      structuredLogger.error('Admin Service - Remove Branch Error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async getAssignmentHistory(adminId, pagination) {
    try {
      // Check if admin exists
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      return await AdminManagementRepository.getAssignmentHistory(adminId, pagination);
    } catch (error) {
      structuredLogger.error('Admin Service - Get Assignment History Error:', error);
      throw error;
    }
  }

  // ==================== LOGIN HISTORY ====================

  async getLoginHistory(adminId, pagination) {
    try {
      // Check if admin exists
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      return await AdminManagementRepository.getLoginHistory(adminId, pagination);
    } catch (error) {
      structuredLogger.error('Admin Service - Get Login History Error:', error);
      throw error;
    }
  }

  // ==================== PASSWORD MANAGEMENT ====================

  async resetPasswordAdvanced(adminId, resetBy, requestInfo) {
    try {
      // Get admin details
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Generate new password
      const newPassword = this.generateRandomPassword();
      const password_hash = await bcrypt.hash(newPassword, 10);

      // Save to password history
      await AdminManagementRepository.savePasswordHistory({
        admin_id: adminId,
        password_hash: password_hash,
        changed_by: resetBy,
        change_reason: 'RESET',
        is_temporary: true
      });

      // Update password and force change flag
      await AdminManagementRepository.updateAdminPassword(adminId, password_hash);
      await AdminManagementRepository.updatePasswordChangeFlag(adminId, true);

      // Log activity
      await AdminManagementRepository.createEnhancedActivityLog({
        admin_id: resetBy,
        action: 'PASSWORD_RESET',
        module: 'ADMIN_MANAGEMENT',
        entity_type: 'ADMIN',
        entity_id: adminId.toString(),
        description: `Reset password for admin ${admin.full_name}`,
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent,
        request_method: 'PATCH',
        request_url: requestInfo.url
      });

      // Send new password email (async, don't wait)
      this.sendPasswordResetEmail(admin.full_name, admin.email, newPassword)
        .catch(err => structuredLogger.error('Email sending failed:', err));

      return {
        admin_id: adminId,
        email_sent: true,
        force_change_required: true
      };

    } catch (error) {
      structuredLogger.error('Admin Service - Reset Password Advanced Error:', error);
      throw error;
    }
  }

  async validatePasswordReuse(adminId, newPassword) {
    try {
      const lastPasswords = await AdminManagementRepository.getLastPasswords(adminId, 5);
      
      for (const record of lastPasswords) {
        const match = await bcrypt.compare(newPassword, record.password_hash);
        if (match) {
          return false; // Password has been used before
        }
      }
      
      return true; // Password is new
    } catch (error) {
      structuredLogger.error('Admin Service - Validate Password Reuse Error:', error);
      throw error;
    }
  }

  // ==================== PERMISSIONS MANAGEMENT ====================

  async getPermissions(adminId) {
    try {
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      let permissions = await AdminManagementRepository.getPermissions(adminId);
      
      // If no permissions exist, create default ones
      if (!permissions) {
        await AdminManagementRepository.createDefaultPermissions(adminId, admin.role, null);
        permissions = await AdminManagementRepository.getPermissions(adminId);
      }

      return permissions;
    } catch (error) {
      structuredLogger.error('Admin Service - Get Permissions Error:', error);
      throw error;
    }
  }

  async updatePermissions(adminId, permissions, updatedBy, requestInfo) {
    try {
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Get existing permissions for comparison
      const oldPermissions = await AdminManagementRepository.getPermissions(adminId);

      // Update permissions
      const updated = await AdminManagementRepository.updatePermissions(adminId, permissions, updatedBy);
      if (!updated) {
        throw new Error('Failed to update permissions');
      }

      // Log activity
      await AdminManagementRepository.createEnhancedActivityLog({
        admin_id: updatedBy,
        action: 'PERMISSIONS_UPDATED',
        module: 'ADMIN_MANAGEMENT',
        entity_type: 'PERMISSIONS',
        entity_id: adminId.toString(),
        description: `Updated permissions for admin ${admin.full_name}`,
        old_value: JSON.stringify(oldPermissions),
        new_value: JSON.stringify(permissions),
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent,
        request_method: 'PATCH',
        request_url: requestInfo.url
      });

      return await AdminManagementRepository.getPermissions(adminId);
    } catch (error) {
      structuredLogger.error('Admin Service - Update Permissions Error:', error);
      throw error;
    }
  }

  // ==================== SESSION MANAGEMENT ====================

  async getActiveSessions(adminId) {
    try {
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      return await AdminManagementRepository.getActiveSessions(adminId);
    } catch (error) {
      structuredLogger.error('Admin Service - Get Active Sessions Error:', error);
      throw error;
    }
  }

  async revokeSession(adminId, sessionId, revokedBy, requestInfo) {
    try {
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      const revoked = await AdminManagementRepository.revokeSession(sessionId);
      if (!revoked) {
        throw new Error('Session not found');
      }

      // Log activity
      await AdminManagementRepository.createEnhancedActivityLog({
        admin_id: revokedBy,
        action: 'SESSION_REVOKED',
        module: 'ADMIN_MANAGEMENT',
        entity_type: 'SESSION',
        entity_id: sessionId,
        description: `Revoked session for admin ${admin.full_name}`,
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent,
        request_method: 'DELETE',
        request_url: requestInfo.url
      });

      return {
        session_id: sessionId,
        status: 'REVOKED'
      };
    } catch (error) {
      structuredLogger.error('Admin Service - Revoke Session Error:', error);
      throw error;
    }
  }

  async revokeAllSessions(adminId, revokedBy, exceptCurrentSession, requestInfo) {
    try {
      const admin = await AdminManagementRepository.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      const count = await AdminManagementRepository.revokeAllSessions(adminId, exceptCurrentSession);

      // Log activity
      await AdminManagementRepository.createEnhancedActivityLog({
        admin_id: revokedBy,
        action: 'SESSION_REVOKED',
        module: 'ADMIN_MANAGEMENT',
        entity_type: 'SESSION',
        entity_id: adminId.toString(),
        description: `Revoked ${count} sessions for admin ${admin.full_name}`,
        ip_address: requestInfo.ip,
        user_agent: requestInfo.userAgent,
        request_method: 'DELETE',
        request_url: requestInfo.url
      });

      return {
        admin_id: adminId,
        sessions_revoked: count
      };
    } catch (error) {
      structuredLogger.error('Admin Service - Revoke All Sessions Error:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  generateRandomPassword() {
    // Use crypto.randomInt for cryptographically secure password generation.
    // Math.random() is a PRNG and must not be used for security-sensitive values.
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    const allChars = uppercase + lowercase + numbers;

    let password = '';
    // Guarantee at least one character from each required class
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += special[crypto.randomInt(special.length)];

    // Fill remaining 8 characters from the combined set
    for (let i = 0; i < 8; i++) {
      password += allChars[crypto.randomInt(allChars.length)];
    }

    // Shuffle using Fisher-Yates with crypto.randomInt — NOT Math.random()
    const arr = password.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }

  async sendCredentialsEmail(fullName, email, password, role, department) {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .credentials { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4CAF50; }
          .credential-row { margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; font-size: 16px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Pravzo Admin Panel</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>Your admin account has been created successfully. Below are your login credentials:</p>
            
            <div class="credentials">
              <div class="credential-row">
                <span class="label">Email / User ID:</span>
                <span class="value">${email}</span>
              </div>
              <div class="credential-row">
                <span class="label">Temporary Password:</span>
                <span class="value">${password}</span>
              </div>
              <div class="credential-row">
                <span class="label">Role:</span>
                <span class="value">${role}</span>
              </div>
              <div class="credential-row">
                <span class="label">Department:</span>
                <span class="value">${department || 'Not Specified'}</span>
              </div>
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>Please change your password immediately after first login</li>
                <li>Do not share your credentials with anyone</li>
                <li>Keep your password secure and confidential</li>
              </ul>
            </div>

            <p><strong>Login URL:</strong> ${process.env.ADMIN_PANEL_URL || 'http://localhost:3000/admin/login'}</p>
            
            <p>Best regards,<br><strong>Pravzo Admin Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Pravzo. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return transporter.sendMail({
      from: `"Pravzo Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Pravzo Admin Account Credentials',
      html: emailHtml
    });
  }

  async sendPasswordResetEmail(fullName, email, newPassword) {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ff9800; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .credentials { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #ff9800; }
          .warning { background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset - Pravzo Admin</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>Your password has been reset by the Super Administrator. Here is your new temporary password:</p>
            
            <div class="credentials">
              <p><strong>New Password:</strong> ${newPassword}</p>
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>Please change this password immediately after login</li>
                <li>Do not share this password with anyone</li>
                <li>If you didn't request this reset, contact support immediately</li>
              </ul>
            </div>

            <p><strong>Login URL:</strong> ${process.env.ADMIN_PANEL_URL || 'http://localhost:3000/admin/login'}</p>
            
            <p>Best regards,<br><strong>Pravzo Admin Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return transporter.sendMail({
      from: `"Pravzo Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Password Has Been Reset - Pravzo Admin',
      html: emailHtml
    });
  }
}

module.exports = new AdminManagementService();

