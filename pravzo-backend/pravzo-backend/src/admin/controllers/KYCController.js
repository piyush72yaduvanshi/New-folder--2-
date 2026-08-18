const { validationResult } = require('express-validator');
const KYCService = require('../services/KYCService');
const { successResponse, errorResponse } = require('../../../src/utils/response');
const logger = require('../../../src/utils/logger');
const { exportToFile, validateExportFormat } = require('../../../src/utils/exportHelper');
const path = require('path');
const fs = require('fs');

class KYCController {
  // Get paginated KYC list
  async getKYCList(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        search: req.query.search,
        status: req.query.status,
        verificationType: req.query.verificationType,
        city: req.query.city,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await KYCService.getKYCList(filters, pagination);

      return successResponse(res, 200, 'KYC list retrieved successfully', result);
    } catch (error) {
      logger.error('Get KYC List Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get pending KYC requests
  async getPendingKYC(req, res) {
    try {
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await KYCService.getPendingKYC(pagination);

      return successResponse(res, 200, 'Pending KYC retrieved successfully', result);
    } catch (error) {
      logger.error('Get Pending KYC Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get verified KYC
  async getVerifiedKYC(req, res) {
    try {
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await KYCService.getVerifiedKYC(pagination);

      return successResponse(res, 200, 'Verified KYC retrieved successfully', result);
    } catch (error) {
      logger.error('Get Verified KYC Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get rejected KYC
  async getRejectedKYC(req, res) {
    try {
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await KYCService.getRejectedKYC(pagination);

      return successResponse(res, 200, 'Rejected KYC retrieved successfully', result);
    } catch (error) {
      logger.error('Get Rejected KYC Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get KYC by ID
  async getKYCById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const documentId = parseInt(req.params.id);

      const kyc = await KYCService.getKYCById(documentId);

      return successResponse(res, 200, 'KYC details retrieved successfully', kyc);
    } catch (error) {
      logger.error('Get KYC By ID Controller Error:', error);
      return errorResponse(res, error.message === 'KYC document not found' ? 404 : 500, error.message);
    }
  }

  // Approve KYC
  async approveKYC(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const targetId = parseInt(req.body.userId || req.body.user_id || req.body.documentId || req.body.kycId || req.body.kyc_id, 10);
      const remarks = req.body.remarks;
      const adminId = req.admin.admin_id;

      await KYCService.approveKYC(targetId, adminId, remarks);

      return successResponse(res, 200, 'KYC approved successfully');
    } catch (error) {
      logger.error('Approve KYC Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Reject KYC
  async rejectKYC(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const targetId = parseInt(req.body.userId || req.body.user_id || req.body.documentId || req.body.kycId || req.body.kyc_id, 10);
      const { reason, remarks } = req.body;
      const adminId = req.admin.admin_id;

      await KYCService.rejectKYC(targetId, adminId, reason, remarks);

      return successResponse(res, 200, 'KYC rejected successfully');
    } catch (error) {
      logger.error('Reject KYC Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Reverify KYC
  async reverifyKYC(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const targetId = parseInt(req.body.userId || req.body.user_id || req.body.documentId || req.body.kycId || req.body.kyc_id, 10);
      const { reason } = req.body;
      const adminId = req.admin.admin_id;

      await KYCService.reverifyKYC(targetId, adminId, reason);

      return successResponse(res, 200, 'KYC moved to reverify successfully');
    } catch (error) {
      logger.error('Reverify KYC Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Update KYC status
  async updateKYCStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const targetId = parseInt(req.body.userId || req.body.user_id || req.body.documentId || req.body.kycId || req.body.kyc_id, 10);
      const { status } = req.body;
      const adminId = req.admin.admin_id;

      await KYCService.updateKYCStatus(targetId, status, adminId);

      return successResponse(res, 200, 'KYC status updated successfully');
    } catch (error) {
      logger.error('Update KYC Status Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Get KYC timeline
  async getKYCTimeline(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const userId = parseInt(req.params.id);

      const timeline = await KYCService.getKYCTimeline(userId);

      return successResponse(res, 200, 'KYC timeline retrieved successfully', { timeline });
    } catch (error) {
      logger.error('Get KYC Timeline Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Download KYC document
  async downloadKYC(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const documentId = parseInt(req.params.id);

      const kyc = await KYCService.getKYCById(documentId);

      if (!kyc || !kyc.document || !kyc.document.documentUrl) {
        return errorResponse(res, 404, 'Document not found or URL missing');
      }

      // If document URL is a full URL (starts with http/https), redirect to it
      if (kyc.document.documentUrl.startsWith('http')) {
        return res.redirect(kyc.document.documentUrl);
      }

      // If it's a local path
      const filePath = path.join(__dirname, '../../uploads', kyc.document.documentUrl);
      
      if (fs.existsSync(filePath)) {
        return res.download(filePath);
      } else {
        return errorResponse(res, 404, 'Document file not found');
      }
    } catch (error) {
      logger.error('Download KYC Controller Error:', error);
      const status = (error.message.includes('not found') || error.message.includes('Not found')) ? 404 : 500;
      return errorResponse(res, status, error.message);
    }
  }

  // Get KYC statistics
  async getKYCStatistics(req, res) {
    try {
      const statistics = await KYCService.getKYCStatistics();

      return successResponse(res, 200, 'KYC statistics retrieved successfully', { statistics });
    } catch (error) {
      logger.error('Get KYC Statistics Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Export KYC
  async exportKYC(req, res) {
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
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await KYCService.exportKYC(fmt, filters);

      if (!result.data || result.data.length === 0) {
        return errorResponse(res, 404, 'No KYC records found matching the filters');
      }

      await exportToFile(res, result.data, fmt, 'kyc');
    } catch (error) {
      logger.error('Export KYC Controller Error:', error);
      // HIGH-1 fix: headers may be partially written for Excel
      if (res.headersSent) return;
      return errorResponse(res, 500, error.message);
    }
  }
}

module.exports = new KYCController();

