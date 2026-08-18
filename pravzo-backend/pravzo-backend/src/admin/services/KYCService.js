'use strict';

const KYCRepository = require('../repositories/KYCRepository');
const { formatMySQLDate } = require('../../../src/utils/helpers');
const logger = require('../../../src/utils/logger');

// Helper: map a kyc or user row to the standard response shape
function mapDoc(doc) {
  if (!doc) return null;
  return {
    documentId: doc.kyc_id || doc.user_id,
    kycId: doc.kyc_id || doc.user_id,
    userId: doc.user_id,
    user_id: doc.user_id,
    riderId: doc.rider_id || null,
    rider_id: doc.rider_id || null,
    fullName: doc.full_name || '',
    phoneNumber: doc.phone_number || '',
    email: doc.email || '',
    city: doc.city || doc.assigned_city || 'N/A',
    documentType: doc.document_type || (doc.driving_license_number ? 'DRIVING_LICENSE' : (doc.aadhar_number ? 'AADHAR' : 'USER_KYC')),
    documentNumber: doc.document_number || doc.driving_license_number || doc.aadhar_number || 'N/A',
    documentUrl: doc.front_image_url || doc.driving_license_photo || doc.aadhar_card_photo || null,
    backImageUrl: doc.back_image_url || doc.driving_license_back_photo || doc.aadhar_card_back_photo || null,
    selfieUrl: doc.selfie_url || doc.profile_photo || null,
    verifiedStatus: doc.verification_status || doc.kyc_status || 'PENDING',
    verifiedBy: doc.verified_by || null,
    verifiedByName: doc.verified_by_name || null,
    verifiedAt: doc.verified_at || null,
    remarks: doc.admin_remarks || null,
    rejectionReason: doc.rejection_reason || null,
    submittedAt: doc.submitted_at || doc.updated_at || doc.created_at,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at
  };
}

class KYCService {
  // Get paginated KYC list
  async getKYCList(filters, pagination) {
    try {
      const result = await KYCRepository.getKYCList(filters, pagination);
      result.documents = result.documents.map(mapDoc);
      return result;
    } catch (error) {
      logger.error('KYCService - Get KYC List Error:', error);
      throw new Error('Failed to fetch KYC list');
    }
  }

  // Get pending KYC
  async getPendingKYC(pagination) {
    try {
      const result = await KYCRepository.getPendingKYC(pagination);
      result.documents = result.documents.map(mapDoc);
      return result;
    } catch (error) {
      logger.error('KYCService - Get Pending KYC Error:', error);
      throw new Error('Failed to fetch pending KYC');
    }
  }

  // Get verified KYC
  async getVerifiedKYC(pagination) {
    try {
      const result = await KYCRepository.getVerifiedKYC(pagination);
      result.documents = result.documents.map(mapDoc);
      return result;
    } catch (error) {
      logger.error('KYCService - Get Verified KYC Error:', error);
      throw new Error('Failed to fetch verified KYC');
    }
  }

  // Get rejected KYC
  async getRejectedKYC(pagination) {
    try {
      const result = await KYCRepository.getRejectedKYC(pagination);
      result.documents = result.documents.map(mapDoc);
      return result;
    } catch (error) {
      logger.error('KYCService - Get Rejected KYC Error:', error);
      throw new Error('Failed to fetch rejected KYC');
    }
  }

  // Get KYC details by user_id or kyc_id
  async getKYCById(kycOrUserId) {
    try {
      const doc = await KYCRepository.getKYCDetails(kycOrUserId);

      if (!doc) {
        throw new Error('KYC document not found');
      }

      // Get all KYC submissions for this user
      const targetUserId = doc.user_id;
      const riderDocuments = await KYCRepository.getUserDocuments(targetUserId);

      return {
        document: {
          documentId: doc.kyc_id,
          kycId: doc.kyc_id,
          userId: doc.user_id,
          user_id: doc.user_id,
          riderId: doc.rider_id || null,
          documentType: doc.document_type,
          documentNumber: doc.document_number,
          documentUrl: doc.front_image_url || null,
          backImageUrl: doc.back_image_url || null,
          selfieUrl: doc.selfie_url || null,
          verifiedStatus: doc.verification_status,
          verifiedBy: doc.verified_by,
          verifiedByName: doc.verified_by_name,
          verifiedByEmail: doc.verified_by_email,
          verifiedAt: doc.verified_at,
          remarks: doc.admin_remarks,
          rejectionReason: doc.rejection_reason,
          submittedAt: doc.submitted_at,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at
        },
        user: {
          userId: doc.user_id,
          user_id: doc.user_id,
          riderId: doc.rider_id || null,
          fullName: doc.full_name,
          phoneNumber: doc.phone_number,
          email: doc.email,
          dateOfBirth: doc.date_of_birth,
          gender: doc.gender,
          address: doc.address,
          city: doc.city,
          status: doc.user_status,
          createdAt: doc.user_created_at
        },
        documents: {
          drivingLicense: {
            number: doc.driving_license_number,
            photo: doc.driving_license_photo,
            backPhoto: doc.driving_license_back_photo
          },
          aadharCard: {
            number: doc.aadhar_number,
            photo: doc.aadhar_card_photo,
            backPhoto: doc.aadhar_card_back_photo
          },
          bankDetails: {
            accountNumber: doc.bank_account_number,
            ifscCode: doc.ifsc_code,
            branchName: doc.branch_name
          }
        },
        allDocuments: riderDocuments.map(d => ({
          documentId: d.kyc_id,
          userId: d.user_id,
          documentType: d.document_type,
          documentNumber: d.document_number,
          documentUrl: d.front_image_url || null,
          verifiedStatus: d.verification_status,
          verifiedByName: d.verified_by_name,
          verifiedAt: d.verified_at,
          remarks: d.admin_remarks,
          createdAt: d.created_at
        }))
      };
    } catch (error) {
      logger.error('KYCService - Get KYC By ID Error:', error);
      throw error;
    }
  }

  // Approve KYC by user_id or kyc_id
  async approveKYC(kycOrUserId, adminId, remarks = null) {
    try {
      const document = await KYCRepository.findById(kycOrUserId);

      if (!document) {
        throw new Error('KYC document not found');
      }

      if (document.verification_status === 'APPROVED') {
        throw new Error('KYC document is already approved');
      }

      const approvedAt = formatMySQLDate();
      await KYCRepository.approveKYC(kycOrUserId, adminId, approvedAt, remarks);

      logger.info('KYC approved successfully', { id: kycOrUserId, approvedBy: adminId });
      return true;
    } catch (error) {
      logger.error('KYCService - Approve KYC Error:', error);
      throw error;
    }
  }

  // Reject KYC by user_id or kyc_id
  async rejectKYC(kycOrUserId, adminId, reason, remarks = null) {
    try {
      const document = await KYCRepository.findById(kycOrUserId);

      if (!document) {
        throw new Error('KYC document not found');
      }

      if (document.verification_status === 'REJECTED') {
        throw new Error('KYC document is already rejected');
      }

      const rejectedAt = formatMySQLDate();
      await KYCRepository.rejectKYC(kycOrUserId, adminId, rejectedAt, reason, remarks);

      logger.info('KYC rejected successfully', { id: kycOrUserId, rejectedBy: adminId, reason });
      return true;
    } catch (error) {
      logger.error('KYCService - Reject KYC Error:', error);
      throw error;
    }
  }

  // Move KYC back to pending (reverify)
  async reverifyKYC(kycOrUserId, adminId, reason) {
    try {
      const document = await KYCRepository.findById(kycOrUserId);

      if (!document) {
        throw new Error('KYC document not found');
      }

      if (document.verification_status === 'PENDING') {
        throw new Error('KYC document is already pending');
      }

      const requestedAt = formatMySQLDate();
      await KYCRepository.reverifyKYC(kycOrUserId, adminId, requestedAt, `Reverify requested: ${reason}`);

      logger.info('KYC reverify requested successfully', { id: kycOrUserId, requestedBy: adminId, reason });
      return true;
    } catch (error) {
      logger.error('KYCService - Reverify KYC Error:', error);
      throw error;
    }
  }

  // Update KYC status
  async updateKYCStatus(kycOrUserId, status, adminId) {
    try {
      const document = await KYCRepository.findById(kycOrUserId);

      if (!document) {
        throw new Error('KYC document not found');
      }

      if (document.verification_status === status) {
        throw new Error(`KYC status is already ${status}`);
      }

      const updatedAt = formatMySQLDate();
      await KYCRepository.updateKYCStatus(kycOrUserId, status, updatedAt);

      logger.info('KYC status updated successfully', { id: kycOrUserId, newStatus: status, updatedBy: adminId });
      return true;
    } catch (error) {
      logger.error('KYCService - Update KYC Status Error:', error);
      throw error;
    }
  }

  // Get KYC timeline for a user/rider
  async getKYCTimeline(userIdOrRiderId) {
    try {
      const timeline = await KYCRepository.getKYCTimeline(userIdOrRiderId);

      return timeline.map(item => {
        const timelineItem = {
          documentId: item.kyc_id,
          userId: item.user_id,
          documentType: item.document_type,
          status: item.verification_status,
          submittedAt: item.submitted_at || item.created_at
        };

        if (item.verification_status === 'APPROVED' && item.verified_at) {
          timelineItem.verifiedAt = item.verified_at;
          timelineItem.verifiedBy = item.verified_by;
          timelineItem.action = 'Approved';
        } else if (item.verification_status === 'REJECTED' && item.verified_at) {
          timelineItem.rejectedAt = item.verified_at;
          timelineItem.rejectedBy = item.verified_by;
          timelineItem.action = 'Rejected';
          timelineItem.reason = item.rejection_reason;
        } else if (item.verification_status === 'PENDING') {
          timelineItem.action = 'Submitted';
        }

        return timelineItem;
      });
    } catch (error) {
      logger.error('KYCService - Get KYC Timeline Error:', error);
      throw new Error('Failed to fetch KYC timeline');
    }
  }

  // Get KYC statistics
  async getKYCStatistics() {
    try {
      const stats = await KYCRepository.getKYCStatistics();

      return {
        totalKYC: stats.total_kyc,
        pendingCount: stats.pending_count,
        approvedCount: stats.approved_count,
        rejectedCount: stats.rejected_count,
        todayRequests: stats.today_requests,
        monthlyRequests: stats.monthly_requests,
        avgApprovalTime: parseFloat(stats.avg_approval_time || 0),
        rejectionRate: stats.rejection_rate,
        verificationSuccessRate: stats.verification_success_rate
      };
    } catch (error) {
      logger.error('KYCService - Get KYC Statistics Error:', error);
      throw new Error('Failed to fetch KYC statistics');
    }
  }

  // Export KYC data
  async exportKYC(format, filters) {
    try {
      const documents = await KYCRepository.getKYCForExport(filters);

      const formattedData = documents.map(doc => ({
        'KYC ID': doc.kyc_id,
        'User ID': doc.user_id,
        'Rider ID': doc.rider_id || 'N/A',
        'Full Name': doc.full_name,
        'Phone Number': doc.phone_number,
        'Email': doc.email || 'N/A',
        'City': doc.city || 'N/A',
        'Document Type': doc.document_type,
        'Document Number': doc.document_number || 'N/A',
        'Verification Status': doc.verification_status,
        'Verified By': doc.verified_by_name || 'N/A',
        'Submitted Date': doc.created_at,
        'Verified Date': doc.verified_at || 'N/A'
      }));

      return { format, data: formattedData };
    } catch (error) {
      logger.error('KYCService - Export KYC Error:', error);
      throw new Error('Failed to export KYC data');
    }
  }
}

module.exports = new KYCService();
