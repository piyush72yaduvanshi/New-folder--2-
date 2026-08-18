const { validationResult } = require('express-validator');
const SuperAdminExtensionService = require('../services/SuperAdminExtensionService');
const { sendSuccess, sendError, sendValidationError } = require('../../../src/utils/responseWrapper');

// Aliases used throughout this controller
const successResponse = (res, status, message, data) => sendSuccess(res, status, message, data);
const errorResponse = (res, status, message, details) => sendError(res, status, message, null, details);
const DTO = require('../../../src/utils/dtoMapper');
const logger = require('../../../src/utils/logger');

class SuperAdminExtensionController {
  // ================= SYSTEM SETTINGS =================
  static async getSystemSettings(req, res) {
    try {
      const { group } = req.query;
      const settings = await SuperAdminExtensionService.getSystemSettings(group);
      return sendSuccess(res, 200, 'System settings fetched successfully', settings);
    } catch (error) {
      logger.error('getSystemSettings Controller Error:', error);
      return sendError(res, 500, error.message || 'Failed to fetch settings');
    }
  }

  static async updateSystemSetting(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const { key, value } = req.body;
      const adminId = req.admin ? req.admin.admin_id : 1;
      const updated = await SuperAdminExtensionService.updateSystemSetting(key, value, adminId);
      return sendSuccess(res, 200, 'System setting updated successfully', updated);
    } catch (error) {
      logger.error('updateSystemSetting Controller Error:', error);
      return sendError(res, 500, error.message || 'Failed to update setting');
    }
  }

  // ================= AUDIT LOGS =================
  static async getAuditLogs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const { module } = req.query;
      const offset = (page - 1) * limit;
      const result = await SuperAdminExtensionService.getAuditLogs({ limit, offset, module });
      return sendSuccess(res, 200, 'Audit logs fetched successfully',
        { logs: result.logs || [], total: result.total || 0 },
        { req, pagination: { page, limit, total: result.total || (result.logs || []).length } }
      );
    } catch (error) {
      logger.error('getAuditLogs Controller Error:', error);
      return sendError(res, 500, error.message || 'Failed to fetch audit logs', 'AUDIT_LOGS_FETCH_FAILED', null, req);
    }
  }

  static async getAuditLogById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const log = await SuperAdminExtensionService.getAuditLogById(id);
      return sendSuccess(res, 200, 'Audit log detail fetched successfully', log, { req });
    } catch (error) {
      logger.error('getAuditLogById Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to fetch audit log', 'AUDIT_LOG_FETCH_FAILED', null, req);
    }
  }

  static async exportAuditLogs(req, res) {
    try {
      const { module, limit } = req.query;
      const logs = await SuperAdminExtensionService.exportAuditLogs({ module, limit });

      const headers = ['Audit ID', 'Admin ID', 'Admin Name', 'Admin Email', 'Action', 'Module', 'IP Address', 'Created At', 'Details'];
      const rows = logs.map(l => [
        l.audit_id,
        l.admin_id || '',
        `"${(l.admin_name || '').replace(/"/g, '""')}"`,
        `"${(l.admin_email || '').replace(/"/g, '""')}"`,
        `"${(l.action || '').replace(/"/g, '""')}"`,
        `"${(l.module || '').replace(/"/g, '""')}"`,
        `"${(l.ip_address || '').replace(/"/g, '""')}"`,
        `"${(l.created_at ? new Date(l.created_at).toISOString() : '')}"`,
        `"${(typeof l.details === 'object' ? JSON.stringify(l.details) : String(l.details || '')).replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit_logs_export.csv"');
      return res.status(200).send(csvContent);
    } catch (error) {
      logger.error('exportAuditLogs Controller Error:', error);
      return sendError(res, 500, error.message || 'Failed to export audit logs', 'AUDIT_EXPORT_FAILED', null, req);
    }
  }

  // ================= MAINTENANCE RECORDS =================
  static async getMaintenanceRecords(req, res) {
    try {
      const { vehicle_id, status } = req.query;
      const records = await SuperAdminExtensionService.getMaintenanceRecords({ vehicle_id, status });
      const rawArr = Array.isArray(records) ? records : records.records || [];
      return sendSuccess(res, 200, 'Maintenance records fetched successfully', rawArr, { req });
    } catch (error) {
      logger.error('getMaintenanceRecords Controller Error:', error);
      return sendError(res, 500, error.message || 'Failed to fetch maintenance records', 'MAINTENANCE_FETCH_FAILED', null, req);
    }
  }

  static async getMaintenanceRecordById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const record = await SuperAdminExtensionService.getMaintenanceRecordById(id);
      return sendSuccess(res, 200, 'Maintenance record fetched successfully', record, { req });
    } catch (error) {
      logger.error('getMaintenanceRecordById Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to fetch maintenance record', 'MAINTENANCE_NOT_FOUND', null, req);
    }
  }

  static async createMaintenanceRecord(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const record = await SuperAdminExtensionService.createMaintenanceRecord(req.body);
      return sendSuccess(res, 201, 'Maintenance record created successfully', record, { req });
    } catch (error) {
      logger.error('createMaintenanceRecord Controller Error:', error);
      return sendError(res, 500, error.message || 'Failed to create maintenance record');
    }
  }

  static async updateMaintenanceRecord(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const record = await SuperAdminExtensionService.updateMaintenanceRecord(id, req.body);
      return sendSuccess(res, 200, 'Maintenance record updated successfully', record, { req });
    } catch (error) {
      logger.error('updateMaintenanceRecord Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to update maintenance record', 'MAINTENANCE_UPDATE_FAILED', null, req);
    }
  }

  static async updateMaintenanceStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const { id } = req.params;
      const { status, completed_date } = req.body;
      const updated = await SuperAdminExtensionService.updateMaintenanceStatus(id, status, completed_date);
      return sendSuccess(res, 200, 'Maintenance status updated successfully', updated, { req });
    } catch (error) {
      logger.error('updateMaintenanceStatus Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to update maintenance status');
    }
  }

  static async deleteMaintenanceRecord(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const result = await SuperAdminExtensionService.deleteMaintenanceRecord(id);
      return sendSuccess(res, 200, 'Maintenance record deleted successfully', result, { req });
    } catch (error) {
      logger.error('deleteMaintenanceRecord Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to delete maintenance record', 'MAINTENANCE_DELETE_FAILED', null, req);
    }
  }

  // ================= INSURANCE POLICIES =================
  static async getInsurancePolicies(req, res) {
    try {
      const { vehicle_id, status } = req.query;
      const policies = await SuperAdminExtensionService.getInsurancePolicies({ vehicle_id, status });
      const rawArr = Array.isArray(policies) ? policies : policies.policies || [];
      return sendSuccess(res, 200, 'Insurance policies fetched successfully', rawArr, { req });
    } catch (error) {
      logger.error('getInsurancePolicies Controller Error:', error);
      return sendError(res, 500, error.message || 'Failed to fetch insurance policies', 'INSURANCE_FETCH_FAILED', null, req);
    }
  }

  static async getInsurancePolicyById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const policy = await SuperAdminExtensionService.getInsurancePolicyById(id);
      return sendSuccess(res, 200, 'Insurance policy fetched successfully', policy, { req });
    } catch (error) {
      logger.error('getInsurancePolicyById Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to fetch insurance policy', 'INSURANCE_NOT_FOUND', null, req);
    }
  }

  static async createInsurancePolicy(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const policy = await SuperAdminExtensionService.createInsurancePolicy(req.body);
      return sendSuccess(res, 201, 'Insurance policy created successfully', policy, { req });
    } catch (error) {
      logger.error('createInsurancePolicy Controller Error:', error);
      return sendError(res, 500, error.message || 'Failed to create insurance policy');
    }
  }

  static async updateInsurancePolicy(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const policy = await SuperAdminExtensionService.updateInsurancePolicy(id, req.body);
      return sendSuccess(res, 200, 'Insurance policy updated successfully', policy, { req });
    } catch (error) {
      logger.error('updateInsurancePolicy Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to update insurance policy', 'INSURANCE_UPDATE_FAILED', null, req);
    }
  }

  static async deleteInsurancePolicy(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const result = await SuperAdminExtensionService.deleteInsurancePolicy(id);
      return sendSuccess(res, 200, 'Insurance policy deleted successfully', result, { req });
    } catch (error) {
      logger.error('deleteInsurancePolicy Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to delete insurance policy', 'INSURANCE_DELETE_FAILED', null, req);
    }
  }

  // ================= SUPPORT TICKETS =================
  static async getSupportTickets(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const { status, priority, category } = req.query;
      const tickets = await SuperAdminExtensionService.getSupportTickets({ status, priority, category, page, limit });

      const ticketsArr = Array.isArray(tickets) ? tickets : tickets.tickets || [];
      return sendSuccess(res, 200, 'Support tickets fetched successfully',
        DTO.toTicketList({ tickets: ticketsArr }),
        { req, pagination: { page, limit, total: tickets.total || ticketsArr.length } }
      );
    } catch (error) {
      logger.error('getSupportTickets Controller Error:', error);
      return sendError(res, 500, error.message || 'Failed to fetch support tickets', 'TICKETS_FETCH_FAILED', null, req);
    }
  }

  static async getSupportTicketById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const ticket = await SuperAdminExtensionService.getSupportTicketById(id);
      return sendSuccess(res, 200, 'Support ticket fetched successfully', ticket, { req });
    } catch (error) {
      logger.error('getSupportTicketById Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to fetch support ticket', 'TICKET_NOT_FOUND', null, req);
    }
  }

  static async createSupportTicket(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const ticket = await SuperAdminExtensionService.createSupportTicket(req.body);
      return sendSuccess(res, 201, 'Support ticket created successfully', ticket, { req });
    } catch (error) {
      logger.error('createSupportTicket Controller Error:', error);
      return sendError(res, 500, error.message || 'Failed to create support ticket');
    }
  }

  static async updateSupportTicket(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const ticket = await SuperAdminExtensionService.updateSupportTicket(id, req.body);
      return sendSuccess(res, 200, 'Support ticket updated successfully', ticket, { req });
    } catch (error) {
      logger.error('updateSupportTicket Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to update ticket', 'TICKET_UPDATE_FAILED', null, req);
    }
  }

  static async updateSupportTicketStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const { id } = req.params;
      const { status, resolution_notes, assigned_admin_id } = req.body;
      const updated = await SuperAdminExtensionService.updateSupportTicketStatus(id, status, resolution_notes, assigned_admin_id);
      return sendSuccess(res, 200, 'Support ticket updated successfully', updated, { req });
    } catch (error) {
      logger.error('updateSupportTicketStatus Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to update ticket');
    }
  }

  static async resolveSupportTicket(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const { resolution_notes } = req.body;
      const adminId = req.admin ? req.admin.admin_id : (req.user ? req.user.user_id : null);
      const updated = await SuperAdminExtensionService.resolveSupportTicket(id, resolution_notes, adminId);
      return sendSuccess(res, 200, 'Support ticket resolved successfully', updated, { req });
    } catch (error) {
      logger.error('resolveSupportTicket Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to resolve support ticket', 'TICKET_RESOLVE_FAILED', null, req);
    }
  }

  // ================= COMMISSION & TAX CONFIG =================
  static async getCommissionRules(req, res) {
    try {
      const rules = await SuperAdminExtensionService.getCommissionRules();
      return sendSuccess(res, 200, 'Commission rules fetched successfully', rules, { req });
    } catch (error) {
      logger.error('getCommissionRules Controller Error:', error);
      return sendError(res, 500, error.message || 'Failed to fetch commission rules');
    }
  }

  static async getCommissionRuleById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const rule = await SuperAdminExtensionService.getCommissionRuleById(id);
      return sendSuccess(res, 200, 'Commission rule fetched successfully', rule, { req });
    } catch (error) {
      logger.error('getCommissionRuleById Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to fetch commission rule', 'COMMISSION_RULE_NOT_FOUND', null, req);
    }
  }

  static async createCommissionRule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const rule = await SuperAdminExtensionService.createCommissionRule(req.body);
      return sendSuccess(res, 201, 'Commission rule created successfully', rule, { req });
    } catch (error) {
      logger.error('createCommissionRule Controller Error:', error);
      return sendError(res, 500, error.message || 'Failed to create commission rule');
    }
  }

  static async updateCommissionRule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const rule = await SuperAdminExtensionService.updateCommissionRule(id, req.body);
      return sendSuccess(res, 200, 'Commission rule updated successfully', rule, { req });
    } catch (error) {
      logger.error('updateCommissionRule Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to update commission rule', 'COMMISSION_RULE_UPDATE_FAILED', null, req);
    }
  }

  static async deleteCommissionRule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const result = await SuperAdminExtensionService.deleteCommissionRule(id);
      return sendSuccess(res, 200, 'Commission rule deleted successfully', result, { req });
    } catch (error) {
      logger.error('deleteCommissionRule Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to delete commission rule', 'COMMISSION_RULE_DELETE_FAILED', null, req);
    }
  }

  static async getTaxConfigs(req, res) {
    try {
      const taxes = await SuperAdminExtensionService.getTaxConfigs();
      return sendSuccess(res, 200, 'Tax configurations fetched successfully', taxes, { req });
    } catch (error) {
      logger.error('getTaxConfigs Controller Error:', error);
      return sendError(res, 500, error.message || 'Failed to fetch tax configs');
    }
  }

  static async getTaxConfigById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const tax = await SuperAdminExtensionService.getTaxConfigById(id);
      return sendSuccess(res, 200, 'Tax configuration fetched successfully', tax, { req });
    } catch (error) {
      logger.error('getTaxConfigById Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to fetch tax configuration', 'TAX_CONFIG_NOT_FOUND', null, req);
    }
  }

  static async createTaxConfig(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const tax = await SuperAdminExtensionService.createTaxConfig(req.body);
      return sendSuccess(res, 201, 'Tax configuration created successfully', tax, { req });
    } catch (error) {
      logger.error('createTaxConfig Controller Error:', error);
      return sendError(res, 500, error.message || 'Failed to create tax config');
    }
  }

  static async updateTaxConfig(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const tax = await SuperAdminExtensionService.updateTaxConfig(id, req.body);
      return sendSuccess(res, 200, 'Tax configuration updated successfully', tax, { req });
    } catch (error) {
      logger.error('updateTaxConfig Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to update tax config', 'TAX_CONFIG_UPDATE_FAILED', null, req);
    }
  }

  static async deleteTaxConfig(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const id = parseInt(req.params.id);
      const result = await SuperAdminExtensionService.deleteTaxConfig(id);
      return sendSuccess(res, 200, 'Tax configuration deleted successfully', result, { req });
    } catch (error) {
      logger.error('deleteTaxConfig Controller Error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'Failed to delete tax config', 'TAX_CONFIG_DELETE_FAILED', null, req);
    }
  }

  // ================= INVOICES =================
  static async getInvoices(req, res) {
    try {
      const { status } = req.query;
      const invoices = await SuperAdminExtensionService.getInvoices({ status });
      return successResponse(res, 200, 'Invoices fetched successfully', invoices);
    } catch (error) {
      logger.error('getInvoices Controller Error:', error);
      return errorResponse(res, 500, error.message || 'Failed to fetch invoices');
    }
  }

  static async createInvoice(req, res) {
    try {
      const invoice = await SuperAdminExtensionService.createInvoice(req.body);
      return successResponse(res, 201, 'Invoice created successfully', invoice);
    } catch (error) {
      logger.error('createInvoice Controller Error:', error);
      return errorResponse(res, 500, error.message || 'Failed to create invoice');
    }
  }

  // ================= INCENTIVES & REWARDS =================
  static async getIncentivesAndRewards(req, res) {
    try {
      const { type } = req.query;
      const items = await SuperAdminExtensionService.getIncentivesAndRewards({ type });
      return successResponse(res, 200, 'Incentives & Rewards fetched successfully', items);
    } catch (error) {
      logger.error('getIncentivesAndRewards Controller Error:', error);
      return errorResponse(res, 500, error.message || 'Failed to fetch items');
    }
  }

  static async createIncentiveReward(req, res) {
    try {
      const item = await SuperAdminExtensionService.createIncentiveReward(req.body);
      return successResponse(res, 201, 'Incentive/Reward created successfully', item);
    } catch (error) {
      logger.error('createIncentiveReward Controller Error:', error);
      return errorResponse(res, 500, error.message || 'Failed to create item');
    }
  }

  // ================= JOB ASSIGNMENTS =================
  static async getJobAssignments(req, res) {
    try {
      const { branch_id, status } = req.query;
      const jobs = await SuperAdminExtensionService.getJobAssignments({ branch_id, status });
      return successResponse(res, 200, 'Job assignments fetched successfully', jobs);
    } catch (error) {
      logger.error('getJobAssignments Controller Error:', error);
      return errorResponse(res, 500, error.message || 'Failed to fetch job assignments');
    }
  }

  static async createJobAssignment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const job = await SuperAdminExtensionService.createJobAssignment(req.body);
      return successResponse(res, 201, 'Job assignment created successfully', job);
    } catch (error) {
      logger.error('createJobAssignment Controller Error:', error);
      return errorResponse(res, 500, error.message || 'Failed to create job assignment');
    }
  }

  static async updateJobStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const { id } = req.params;
      const { status } = req.body;
      const updated = await SuperAdminExtensionService.updateJobStatus(id, status);
      return successResponse(res, 200, 'Job status updated successfully', updated);
    } catch (error) {
      logger.error('updateJobStatus Controller Error:', error);
      return errorResponse(res, 500, error.message || 'Failed to update job status');
    }
  }
}

module.exports = SuperAdminExtensionController;

