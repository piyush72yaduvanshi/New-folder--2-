const express = require('express');
const BIController = require('../controllers/BIController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const {
  getDashboardValidation,
  widgetCrudValidation,
  generateReportValidation,
  scheduleReportValidation,
  exportValidation
} = require('../validations/biValidation');

// ------------------------------------------------------------
// DASHBOARD ROUTER
// ------------------------------------------------------------
const dashboardRouter = express.Router();

dashboardRouter.use(authMiddleware);
dashboardRouter.use(permissionMiddleware(['SUPER_ADMIN']));

// Get consolidated dashboard KPIs
dashboardRouter.get(
  '/',
  getDashboardValidation,
  BIController.getDashboardKPIs
);

// Get widgets configuration list
dashboardRouter.get(
  '/widgets',
  BIController.getWidgets
);

// Create new widget
dashboardRouter.post(
  '/widgets',
  widgetCrudValidation,
  BIController.createWidget
);

// Update widget detail configuration
dashboardRouter.put(
  '/widgets/:id',
  widgetCrudValidation,
  BIController.updateWidget
);

// Delete dashboard widget
dashboardRouter.delete(
  '/widgets/:id',
  BIController.deleteWidget
);

// ------------------------------------------------------------
// ANALYTICS ROUTER
// ------------------------------------------------------------
const analyticsRouter = express.Router();

analyticsRouter.use(authMiddleware);
analyticsRouter.use(permissionMiddleware(['SUPER_ADMIN']));

// Get master central diagnostics
analyticsRouter.get('/', BIController.getAnalytics);

// Revenue analytics
analyticsRouter.get('/revenue', BIController.getRevenueAnalytics);

// Rentals analytics
analyticsRouter.get('/rentals', BIController.getRentalAnalytics);

// Bookings analytics
analyticsRouter.get('/bookings', BIController.getBookingAnalytics);

// Jobs analytics
analyticsRouter.get('/jobs', BIController.getJobAnalytics);

// System usage statistics
analyticsRouter.get('/users', BIController.getSystemAnalytics);

// Riders performance stats
analyticsRouter.get('/riders', BIController.getRiderAnalytics);

// Fleet vehicle analytics
analyticsRouter.get('/fleet', BIController.getVehicleAnalytics);

// Payments analytics (shared)
analyticsRouter.get('/payments', BIController.getRevenueAnalytics);

// Hub branches analytics
analyticsRouter.get('/branches', BIController.getBranchAnalytics);

// ------------------------------------------------------------
// REPORTS ROUTER
// ------------------------------------------------------------
const reportsRouter = express.Router();

reportsRouter.use(authMiddleware);
reportsRouter.use(permissionMiddleware(['SUPER_ADMIN']));

// Trigger report generation job
reportsRouter.post(
  '/generate',
  generateReportValidation,
  BIController.generateReport
);

// Get list of generated reports
reportsRouter.get(
  '/',
  BIController.getReports
);

// Get report details by ID
reportsRouter.get(
  '/:id',
  BIController.getReportById
);

// Register scheduled report execution
reportsRouter.post(
  '/schedule',
  scheduleReportValidation,
  BIController.scheduleReport
);

// Trigger run execution on report schedule
reportsRouter.patch(
  '/:id/run',
  BIController.generateReport
);

// Delete report log
reportsRouter.delete(
  '/:id',
  BIController.deleteReport
);

// ------------------------------------------------------------
// EXPORTS ROUTER
// ------------------------------------------------------------
const exportRouter = express.Router();

exportRouter.use(authMiddleware);
exportRouter.use(permissionMiddleware(['SUPER_ADMIN']));

// Export dataset to CSV
exportRouter.post(
  '/csv',
  exportValidation,
  BIController.exportCSV
);

// Export dataset to Excel workbook
exportRouter.post(
  '/excel',
  exportValidation,
  BIController.exportExcel
);

// Export dataset to PDF
exportRouter.post(
  '/pdf',
  exportValidation,
  BIController.exportPDF
);

module.exports = {
  dashboardRouter,
  analyticsRouter,
  reportsRouter,
  exportRouter
};

