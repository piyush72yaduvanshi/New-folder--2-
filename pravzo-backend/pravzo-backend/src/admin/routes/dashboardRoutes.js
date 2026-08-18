const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const { chartValidation, recentActivitiesValidation } = require('../validations/dashboardValidation');

// All dashboard routes require authentication and dashboard permission
// Only SUPER_ADMIN, ADMIN, and REPORT_ADMIN can access dashboard
const dashboardPermission = checkPermission(['view_dashboard', '*']);

// Dashboard Stats
router.get('/stats', authMiddleware, dashboardPermission, DashboardController.getStats);

// Dashboard Revenue
router.get('/revenue', authMiddleware, dashboardPermission, DashboardController.getRevenue);

// Dashboard Bookings
router.get('/bookings', authMiddleware, dashboardPermission, DashboardController.getBookings);

// Dashboard Vehicles
router.get('/vehicles', authMiddleware, dashboardPermission, DashboardController.getVehicles);

// Dashboard Support
router.get('/support', authMiddleware, dashboardPermission, DashboardController.getSupport);

// Dashboard System Alerts
router.get('/system-alerts', authMiddleware, dashboardPermission, DashboardController.getSystemAlerts);

// Dashboard Charts (with validation)
router.get('/charts', authMiddleware, dashboardPermission, chartValidation, DashboardController.getCharts);

// Dashboard Analytics
router.get('/analytics', authMiddleware, dashboardPermission, DashboardController.getAnalytics);

// Recent Activities (with validation)
router.get('/recent-activities', authMiddleware, dashboardPermission, recentActivitiesValidation, DashboardController.getRecentActivities);

// Dashboard Overview (all data at once)
router.get('/overview', authMiddleware, dashboardPermission, DashboardController.getOverview);

module.exports = router;

