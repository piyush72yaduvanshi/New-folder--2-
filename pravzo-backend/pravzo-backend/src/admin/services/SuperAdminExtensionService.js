const SuperAdminExtensionRepository = require('../repositories/SuperAdminExtensionRepository');
const logger = require('../../../src/utils/logger');

class SuperAdminExtensionService {
  constructor() {
    this.repository = new SuperAdminExtensionRepository();
  }

  // ================= SYSTEM SETTINGS =================
  async getSystemSettings(group = null) {
    return await this.repository.getSystemSettings(group);
  }

  async updateSystemSetting(key, value, adminId) {
    if (!key) {
      throw new Error('Setting key is required');
    }
    return await this.repository.upsertSystemSetting(key, value, adminId);
  }

  // ================= AUDIT LOGS =================
  async getAuditLogs(params) {
    return await this.repository.getAuditLogs(params);
  }

  async getAuditLogById(id) {
    const log = await this.repository.findAuditLogById(id);
    if (!log) {
      const error = new Error('Audit log not found');
      error.statusCode = 404;
      throw error;
    }
    return log;
  }

  async exportAuditLogs(params) {
    return await this.repository.exportAuditLogs(params);
  }

  async logAuditAction(logData) {
    return await this.repository.createAuditLog(logData);
  }

  // ================= MAINTENANCE RECORDS =================
  async getMaintenanceRecords(filters) {
    return await this.repository.getMaintenanceRecords(filters);
  }

  async getMaintenanceRecordById(id) {
    const record = await this.repository.findMaintenanceRecordById(id);
    if (!record) {
      const error = new Error('Maintenance record not found');
      error.statusCode = 404;
      throw error;
    }
    return record;
  }

  async createMaintenanceRecord(data) {
    if (!data.vehicle_id) {
      throw new Error('Vehicle ID is required');
    }
    const insertId = await this.repository.createMaintenanceRecord(data);
    return await this.repository.findMaintenanceRecordById(insertId) || { maintenance_id: insertId, ...data };
  }

  async updateMaintenanceRecord(id, data) {
    const existing = await this.repository.findMaintenanceRecordById(id);
    if (!existing) {
      const error = new Error('Maintenance record not found');
      error.statusCode = 404;
      throw error;
    }
    await this.repository.updateMaintenanceRecord(id, data);
    return await this.repository.findMaintenanceRecordById(id);
  }

  async updateMaintenanceStatus(id, status, completedDate = null) {
    const existing = await this.repository.findMaintenanceRecordById(id);
    if (!existing) {
      const error = new Error('Maintenance record not found');
      error.statusCode = 404;
      throw error;
    }
    await this.repository.updateMaintenanceStatus(id, status, completedDate);
    return await this.repository.findMaintenanceRecordById(id);
  }

  async deleteMaintenanceRecord(id) {
    const existing = await this.repository.findMaintenanceRecordById(id);
    if (!existing) {
      const error = new Error('Maintenance record not found');
      error.statusCode = 404;
      throw error;
    }
    await this.repository.deleteMaintenanceRecord(id);
    return { success: true, message: 'Maintenance record deleted successfully' };
  }

  // ================= INSURANCE POLICIES =================
  async getInsurancePolicies(filters) {
    return await this.repository.getInsurancePolicies(filters);
  }

  async getInsurancePolicyById(id) {
    const policy = await this.repository.findInsurancePolicyById(id);
    if (!policy) {
      const error = new Error('Insurance policy not found');
      error.statusCode = 404;
      throw error;
    }
    return policy;
  }

  async createInsurancePolicy(data) {
    if (!data.vehicle_id || !data.policy_number || !(data.provider || data.provider_name)) {
      throw new Error('Vehicle ID, Policy Number, and Provider Name are required');
    }
    const insertId = await this.repository.createInsurancePolicy(data);
    return await this.repository.findInsurancePolicyById(insertId) || { insurance_id: insertId, ...data };
  }

  async updateInsurancePolicy(id, data) {
    const existing = await this.repository.findInsurancePolicyById(id);
    if (!existing) {
      const error = new Error('Insurance policy not found');
      error.statusCode = 404;
      throw error;
    }
    await this.repository.updateInsurancePolicy(id, data);
    return await this.repository.findInsurancePolicyById(id);
  }

  async deleteInsurancePolicy(id) {
    const existing = await this.repository.findInsurancePolicyById(id);
    if (!existing) {
      const error = new Error('Insurance policy not found');
      error.statusCode = 404;
      throw error;
    }
    await this.repository.deleteInsurancePolicy(id);
    return { success: true, message: 'Insurance policy deleted successfully' };
  }

  // ================= SUPPORT TICKETS =================
  async getSupportTickets(filters) {
    return await this.repository.getSupportTickets(filters);
  }

  async getSupportTicketById(id) {
    const ticket = await this.repository.findSupportTicketById(id);
    if (!ticket) {
      const error = new Error('Support ticket not found');
      error.statusCode = 404;
      throw error;
    }
    return ticket;
  }

  async createSupportTicket(data) {
    if (!data.user_id || !data.subject || !data.description) {
      throw new Error('User ID, Subject, and Description are required');
    }
    const ticketCode = 'TKT-' + Date.now().toString().slice(-6);
    const insertId = await this.repository.createSupportTicket({ ...data, ticket_code: ticketCode });
    return await this.repository.findSupportTicketById(insertId) || { ticket_id: insertId, ticket_code: ticketCode, ...data };
  }

  async updateSupportTicket(id, data) {
    const existing = await this.repository.findSupportTicketById(id);
    if (!existing) {
      const error = new Error('Support ticket not found');
      error.statusCode = 404;
      throw error;
    }
    await this.repository.updateSupportTicket(id, data);
    return await this.repository.findSupportTicketById(id);
  }

  async updateSupportTicketStatus(id, status, resolutionNotes = null, assignedAdminId = null) {
    const existing = await this.repository.findSupportTicketById(id);
    if (!existing) {
      const error = new Error('Support ticket not found');
      error.statusCode = 404;
      throw error;
    }
    await this.repository.updateSupportTicketStatus(id, status, resolutionNotes, assignedAdminId);
    return await this.repository.findSupportTicketById(id);
  }

  async resolveSupportTicket(id, resolutionNotes = null, assignedAdminId = null) {
    const existing = await this.repository.findSupportTicketById(id);
    if (!existing) {
      const error = new Error('Support ticket not found');
      error.statusCode = 404;
      throw error;
    }
    await this.repository.resolveSupportTicket(id, resolutionNotes, assignedAdminId);
    return await this.repository.findSupportTicketById(id);
  }

  // ================= COMMISSION RULES & TAX CONFIGS =================
  async getCommissionRules() {
    return await this.repository.getCommissionRules();
  }

  async getCommissionRuleById(id) {
    const rule = await this.repository.findCommissionRuleById(id);
    if (!rule) {
      const error = new Error('Commission rule not found');
      error.statusCode = 404;
      throw error;
    }
    return rule;
  }

  async createCommissionRule(data) {
    if (!data.rule_name || (data.commission_percentage === undefined && data.commission_rate === undefined)) {
      throw new Error('Rule Name and Commission Percentage are required');
    }
    const insertId = await this.repository.createCommissionRule(data);
    return await this.repository.findCommissionRuleById(insertId) || { rule_id: insertId, ...data };
  }

  async updateCommissionRule(id, data) {
    const existing = await this.repository.findCommissionRuleById(id);
    if (!existing) {
      const error = new Error('Commission rule not found');
      error.statusCode = 404;
      throw error;
    }
    await this.repository.updateCommissionRule(id, data);
    return await this.repository.findCommissionRuleById(id);
  }

  async deleteCommissionRule(id) {
    const existing = await this.repository.findCommissionRuleById(id);
    if (!existing) {
      const error = new Error('Commission rule not found');
      error.statusCode = 404;
      throw error;
    }
    await this.repository.deleteCommissionRule(id);
    return { success: true, message: 'Commission rule deleted successfully' };
  }

  async getTaxConfigs() {
    return await this.repository.getTaxConfigs();
  }

  async getTaxConfigById(id) {
    const tax = await this.repository.findTaxConfigById(id);
    if (!tax) {
      const error = new Error('Tax configuration not found');
      error.statusCode = 404;
      throw error;
    }
    return tax;
  }

  async createTaxConfig(data) {
    if (!data.tax_name || data.rate_percentage === undefined) {
      throw new Error('Tax Name and Rate Percentage are required');
    }
    const insertId = await this.repository.createTaxConfig(data);
    return await this.repository.findTaxConfigById(insertId) || { tax_id: insertId, ...data };
  }

  async updateTaxConfig(id, data) {
    const existing = await this.repository.findTaxConfigById(id);
    if (!existing) {
      const error = new Error('Tax configuration not found');
      error.statusCode = 404;
      throw error;
    }
    await this.repository.updateTaxConfig(id, data);
    return await this.repository.findTaxConfigById(id);
  }

  async deleteTaxConfig(id) {
    const existing = await this.repository.findTaxConfigById(id);
    if (!existing) {
      const error = new Error('Tax configuration not found');
      error.statusCode = 404;
      throw error;
    }
    await this.repository.deleteTaxConfig(id);
    return { success: true, message: 'Tax configuration deleted successfully' };
  }

  // ================= INVOICES =================
  async getInvoices(filters) {
    return await this.repository.getInvoices(filters);
  }

  async createInvoice(data) {
    if (!data.user_id) {
      throw new Error('User ID is required for invoice creation');
    }
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-8);
    const insertId = await this.repository.createInvoice({ ...data, invoice_number: invoiceNumber });
    return { invoice_id: insertId, invoice_number: invoiceNumber, ...data };
  }

  // ================= INCENTIVES & REWARDS =================
  async getIncentivesAndRewards(filters) {
    return await this.repository.getIncentivesAndRewards(filters);
  }

  async createIncentiveReward(data) {
    if (!data.title) {
      throw new Error('Incentive/Reward Title is required');
    }
    const insertId = await this.repository.createIncentiveReward(data);
    return { reward_id: insertId, ...data };
  }

  // ================= JOB ASSIGNMENTS =================
  async getJobAssignments(filters) {
    return await this.repository.getJobAssignments(filters);
  }

  async createJobAssignment(data) {
    const payload = {
      job_title: data.job_title || data.jobTitle || data.title,
      assigned_to: data.assigned_to || data.assignedTo || data.userId || data.user_id || data.riderId || data.rider_id,
      branch_id: data.branch_id || data.branchId || 1,
      vehicle_id: data.vehicle_id || data.vehicleId || null,
      status: (data.status || 'PENDING').toUpperCase(),
      priority: (data.priority || 'NORMAL').toUpperCase(),
      notes: data.notes || data.description || ''
    };

    if (!payload.job_title || !payload.assigned_to) {
      throw new Error('Job Title and Assigned User are required');
    }
    const insertId = await this.repository.createJobAssignment(payload);
    return { job_id: insertId, ...payload };
  }

  async updateJobStatus(id, status) {
    if (!id || !status) {
      throw new Error('Job ID and Status are required');
    }
    const normalizedStatus = String(status).toUpperCase();
    await this.repository.updateJobStatus(id, normalizedStatus);
    return { job_id: id, status: normalizedStatus };
  }
}

module.exports = new SuperAdminExtensionService();

