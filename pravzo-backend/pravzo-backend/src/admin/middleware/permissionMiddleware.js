'use strict';

const db = require('../../../src/config/db');
const { sendError } = require('../../../src/utils/responseWrapper');
const logger = require('../../../src/utils/logger');

const VALID_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'SUPPORT']);

const PERMISSION_DOMAIN_MAP = {
  // KYC
  view_kyc: 'users.view',
  manage_kyc: 'users.manage',
  approve_kyc: 'users.manage',
  'kyc.view': 'users.view',
  'kyc.manage': 'users.manage',
  // Users
  view_users: 'users.view',
  manage_users: 'users.manage',
  users: 'users.view',
  'users.view': 'users.view',
  'users.manage': 'users.manage',
  // Riders
  view_riders: 'riders.view',
  manage_riders: 'riders.manage',
  riders: 'riders.view',
  'riders.view': 'riders.view',
  'riders.manage': 'riders.manage',
  // Vehicles
  view_vehicles: 'vehicles.view',
  manage_vehicles: 'vehicles.manage',
  vehicles: 'vehicles.view',
  'vehicles.view': 'vehicles.view',
  'vehicles.manage': 'vehicles.manage',
  // Bookings / Trips
  view_bookings: 'bookings.view',
  manage_bookings: 'bookings.manage',
  bookings: 'bookings.view',
  'bookings.view': 'bookings.view',
  'bookings.manage': 'bookings.manage',
  // Rentals
  view_rentals: 'rentals.view',
  manage_rentals: 'rentals.manage',
  rentals: 'rentals.view',
  'rentals.view': 'rentals.view',
  'rentals.manage': 'rentals.manage',
  // Jobs
  view_jobs: 'jobs.view',
  manage_jobs: 'jobs.manage',
  jobs: 'jobs.view',
  'jobs.view': 'jobs.view',
  'jobs.manage': 'jobs.manage',
  // Reports / Analytics
  view_reports: 'reports.view',
  manage_reports: 'reports.view',
  export_reports: 'reports.view',
  reports: 'reports.view',
  'reports.view': 'reports.view',
  // Payments / Transactions / Finance
  view_payments: 'payments.view',
  manage_payments: 'payments.manage',
  view_transactions: 'payments.view',
  payments: 'payments.view',
  'payments.view': 'payments.view',
  'payments.manage': 'payments.manage',
  // Notifications / Support / Communication
  view_notifications: 'notifications.view',
  send_notifications: 'notifications.manage',
  notifications: 'notifications.view',
  manage_support: 'notifications.manage',
  'notifications.view': 'notifications.view',
  'notifications.manage': 'notifications.manage',
  // Settings
  view_settings: 'settings.view',
  manage_settings: 'settings.manage',
  settings: 'settings.view',
  'settings.view': 'settings.view',
  'settings.manage': 'settings.manage',
  // CMS
  manage_cms: 'landing_cms.manage',
  landing_cms: 'landing_cms.manage',
  'landing_cms.manage': 'landing_cms.manage',
  // Branches
  view_branches: 'branches.view',
  manage_branches: 'branches.manage',
  branches: 'branches.view',
  'branches.view': 'branches.view',
  'branches.manage': 'branches.manage',
  // Admin Management
  manage_admins: 'admin_management.manage',
  admin_management: 'admin_management.view',
  'admin_management.view': 'admin_management.view',
  'admin_management.manage': 'admin_management.manage',
  // Dashboard
  view_dashboard: 'dashboard.view',
  dashboard: 'dashboard.view',
  'dashboard.view': 'dashboard.view'
};

const checkPermission = (allowedList = []) => {
  return async (req, res, next) => {
    try {
      if (!req.admin || !req.admin.role) {
        return sendError(res, 403, 'Authentication required', 'AUTH_REQUIRED', null, req);
      }

      const { role, admin_id } = req.admin;

      if (!VALID_ROLES.has(role)) {
        logger.warn(`Unknown role attempted access: ${role}`, { admin_id, role, path: req.path });
        return sendError(res, 403, 'Permission denied', 'PERMISSION_DENIED', null, req);
      }

      // SUPER_ADMIN bypasses all permission checks
      if (role === 'SUPER_ADMIN') {
        return next();
      }

      // Fetch permission record for ADMIN or SUPPORT from RBAC tables
      const [rows] = await db.query(
        `SELECT p.permission_name
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         JOIN role_permissions rp ON r.role_id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.permission_id
         WHERE u.user_id = ?`,
        [admin_id]
      );

      const perms = {};
      rows.forEach(row => { perms[row.permission_name] = true; });

      let isAllowed = false;

      for (const item of allowedList) {
        if (item === '*') {
          isAllowed = true;
          break;
        }

        if (item === role) {
          isAllowed = true;
          break;
        }

        const domainCol = PERMISSION_DOMAIN_MAP[item] || item;
        if (perms[domainCol] === 1 || perms[domainCol] === true) {
          isAllowed = true;
          break;
        }

        // Check custom_permissions JSON if present
        if (perms.custom_permissions) {
          try {
            const custom = typeof perms.custom_permissions === 'string'
              ? JSON.parse(perms.custom_permissions)
              : perms.custom_permissions;
            if (custom && (custom[item] === true || custom[domainCol] === true)) {
              isAllowed = true;
              break;
            }
          } catch (e) {}
        }
      }

      if (isAllowed) {
        return next();
      }

      logger.warn('Permission check failed for admin', { admin_id, role, required: allowedList });
      return sendError(res, 403, 'You do not have permission to perform this action', 'PERMISSION_DENIED', null, req);
    } catch (error) {
      logger.error('Permission Middleware Error', { error: error.message });
      return sendError(res, 500, 'Permission verification failed', 'PERMISSION_ERROR', null, req);
    }
  };
};

module.exports = checkPermission;

