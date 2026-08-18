const express = require('express');
const router = express.Router();
const SuperAdminExtensionController = require('../controllers/SuperAdminExtensionController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const {
  updateSystemSettingValidation,
  createMaintenanceValidation,
  updateMaintenanceStatusValidation,
  maintenanceIdValidation,
  updateMaintenanceValidation,
  createInsuranceValidation,
  insuranceIdValidation,
  updateInsuranceValidation,
  createSupportTicketValidation,
  updateSupportTicketValidation,
  ticketIdValidation,
  updateTicketFullValidation,
  resolveTicketValidation,
  createCommissionRuleValidation,
  commissionRuleIdValidation,
  updateCommissionRuleValidation,
  createTaxConfigValidation,
  taxConfigIdValidation,
  updateTaxConfigValidation,
  createJobAssignmentValidation,
  updateJobStatusValidation,
  auditLogIdValidation,
  exportAuditLogsValidation
} = require('../validations/superAdminExtensionValidation');

// All routes require authentication & SUPER_ADMIN permissions
router.use(authMiddleware);
router.use(permissionMiddleware(['SUPER_ADMIN']));

// 1. System Settings Routes
router.get('/settings', SuperAdminExtensionController.getSystemSettings);
router.put('/settings', updateSystemSettingValidation, SuperAdminExtensionController.updateSystemSetting);

// 2. Audit Logs Routes
router.get('/audit-logs/export', exportAuditLogsValidation, SuperAdminExtensionController.exportAuditLogs);
router.get('/audit-logs/:id', auditLogIdValidation, SuperAdminExtensionController.getAuditLogById);
router.get('/audit-logs', SuperAdminExtensionController.getAuditLogs);

// 3. Maintenance Records Routes
router.get('/maintenance', SuperAdminExtensionController.getMaintenanceRecords);
router.post('/maintenance', createMaintenanceValidation, SuperAdminExtensionController.createMaintenanceRecord);
router.get('/maintenance/:id', maintenanceIdValidation, SuperAdminExtensionController.getMaintenanceRecordById);
router.put('/maintenance/:id', updateMaintenanceValidation, SuperAdminExtensionController.updateMaintenanceRecord);
router.patch('/maintenance/:id', updateMaintenanceValidation, SuperAdminExtensionController.updateMaintenanceRecord);
router.patch('/maintenance/:id/status', updateMaintenanceStatusValidation, SuperAdminExtensionController.updateMaintenanceStatus);
router.delete('/maintenance/:id', maintenanceIdValidation, SuperAdminExtensionController.deleteMaintenanceRecord);

// 4. Insurance Policies Routes
router.get('/insurance', SuperAdminExtensionController.getInsurancePolicies);
router.post('/insurance', createInsuranceValidation, SuperAdminExtensionController.createInsurancePolicy);
router.get('/insurance/:id', insuranceIdValidation, SuperAdminExtensionController.getInsurancePolicyById);
router.put('/insurance/:id', updateInsuranceValidation, SuperAdminExtensionController.updateInsurancePolicy);
router.patch('/insurance/:id', updateInsuranceValidation, SuperAdminExtensionController.updateInsurancePolicy);
router.delete('/insurance/:id', insuranceIdValidation, SuperAdminExtensionController.deleteInsurancePolicy);

// 5. Support Tickets Routes
router.get('/support/tickets', SuperAdminExtensionController.getSupportTickets);
router.post('/support/tickets', createSupportTicketValidation, SuperAdminExtensionController.createSupportTicket);
router.get('/support/tickets/:id', ticketIdValidation, SuperAdminExtensionController.getSupportTicketById);
router.put('/support/tickets/:id', updateTicketFullValidation, SuperAdminExtensionController.updateSupportTicket);
router.patch('/support/tickets/:id', updateTicketFullValidation, SuperAdminExtensionController.updateSupportTicket);
router.patch('/support/tickets/:id/status', updateSupportTicketValidation, SuperAdminExtensionController.updateSupportTicketStatus);
router.post('/support/tickets/:id/resolve', resolveTicketValidation, SuperAdminExtensionController.resolveSupportTicket);
router.patch('/support/tickets/:id/resolve', resolveTicketValidation, SuperAdminExtensionController.resolveSupportTicket);

// 6. Commission & Tax Routes
router.get('/commissions/rules', SuperAdminExtensionController.getCommissionRules);
router.post('/commissions/rules', createCommissionRuleValidation, SuperAdminExtensionController.createCommissionRule);
router.get('/commissions/rules/:id', commissionRuleIdValidation, SuperAdminExtensionController.getCommissionRuleById);
router.put('/commissions/rules/:id', updateCommissionRuleValidation, SuperAdminExtensionController.updateCommissionRule);
router.patch('/commissions/rules/:id', updateCommissionRuleValidation, SuperAdminExtensionController.updateCommissionRule);
router.delete('/commissions/rules/:id', commissionRuleIdValidation, SuperAdminExtensionController.deleteCommissionRule);

router.get('/taxes/config', SuperAdminExtensionController.getTaxConfigs);
router.post('/taxes/config', createTaxConfigValidation, SuperAdminExtensionController.createTaxConfig);
router.get('/taxes/config/:id', taxConfigIdValidation, SuperAdminExtensionController.getTaxConfigById);
router.put('/taxes/config/:id', updateTaxConfigValidation, SuperAdminExtensionController.updateTaxConfig);
router.patch('/taxes/config/:id', updateTaxConfigValidation, SuperAdminExtensionController.updateTaxConfig);
router.delete('/taxes/config/:id', taxConfigIdValidation, SuperAdminExtensionController.deleteTaxConfig);

// 7. Invoices Routes
router.get('/invoices', SuperAdminExtensionController.getInvoices);
router.post('/invoices', SuperAdminExtensionController.createInvoice);

// 8. Incentives & Rewards Routes
router.get('/incentives', SuperAdminExtensionController.getIncentivesAndRewards);
router.post('/incentives', SuperAdminExtensionController.createIncentiveReward);

// 9. Job Assignments Routes
router.get('/jobs', SuperAdminExtensionController.getJobAssignments);
router.post('/jobs', createJobAssignmentValidation, SuperAdminExtensionController.createJobAssignment);
router.patch('/jobs/:id/status', updateJobStatusValidation, SuperAdminExtensionController.updateJobStatus);

module.exports = router;

