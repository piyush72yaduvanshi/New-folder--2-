const fs = require('fs');
const path = require('path');

const routeMapping = [
  { prefix: '/api/admin/dashboard', module: 'Admin Dashboard', file: 'src/admin/routes/dashboardRoutes.js', controller: 'DashboardController', service: 'DashboardService', repo: 'DashboardRepository', auth: 'Admin JWT', rbac: 'ADMIN, SUPER_ADMIN' },
  { prefix: '/api/admin/users', module: 'Admin User Management', file: 'src/admin/routes/userRoutes.js', controller: 'UserController', service: 'UserService', repo: 'UserRepository', auth: 'Admin JWT', rbac: 'ADMIN, SUPER_ADMIN' },
  { prefix: '/api/super-admin/users', module: 'Super Admin User Management', file: 'src/admin/routes/userRoutes.js', controller: 'UserController', service: 'UserService', repo: 'UserRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/admin/kyc', module: 'KYC Management', file: 'src/admin/routes/kycRoutes.js', controller: 'KYCController', service: 'KYCService', repo: 'KYCRepository', auth: 'Admin JWT', rbac: 'ADMIN, SUPER_ADMIN' },
  { prefix: '/api/admin/riders', module: 'Rider Management', file: 'src/admin/routes/riderRoutes.js', controller: 'RiderController', service: 'RiderService', repo: 'RiderRepository', auth: 'Admin JWT', rbac: 'ADMIN, SUPER_ADMIN' },
  { prefix: '/api/admin/bookings', module: 'Booking Management', file: 'src/admin/routes/bookingRoutes.js', controller: 'BookingController', service: 'BookingService', repo: 'BookingRepository', auth: 'Admin JWT', rbac: 'ADMIN, SUPER_ADMIN' },
  { prefix: '/api/admin/vehicles', module: 'Vehicle Management', file: 'src/admin/routes/vehicleRoutes.js', controller: 'VehicleController', service: 'VehicleService', repo: 'VehicleRepository', auth: 'Admin JWT', rbac: 'ADMIN, SUPER_ADMIN' },
  { prefix: '/api/super-admin/vehicles', module: 'Super Admin Vehicles', file: 'src/admin/routes/vehicleRoutes.js', controller: 'VehicleController', service: 'VehicleService', repo: 'VehicleRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/admin/fleet', module: 'Fleet Management', file: 'src/admin/routes/fleetRoutes.js', controller: 'FleetController', service: 'FleetService', repo: 'FleetRepository', auth: 'Admin JWT', rbac: 'ADMIN, SUPER_ADMIN' },
  { prefix: '/api/super-admin/fleet', module: 'Super Admin Fleet', file: 'src/admin/routes/fleetRoutes.js', controller: 'FleetController', service: 'FleetService', repo: 'FleetRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/admin/payments', module: 'Payment Management', file: 'src/admin/routes/paymentRoutes.js', controller: 'PaymentController', service: 'PaymentService', repo: 'PaymentRepository', auth: 'Admin JWT', rbac: 'ADMIN, SUPER_ADMIN' },
  { prefix: '/api/admin/reports', module: 'Report Management', file: 'src/admin/routes/reportRoutes.js', controller: 'ReportController', service: 'ReportService', repo: 'ReportRepository', auth: 'Admin JWT', rbac: 'ADMIN, SUPER_ADMIN' },
  { prefix: '/api/admin/admin-management', module: 'Admin Management', file: 'src/admin/routes/adminManagementRoutes.js', controller: 'AdminManagementController', service: 'AdminManagementService', repo: 'AdminManagementRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/admin/notifications', module: 'Admin Notifications', file: 'src/admin/routes/notificationRoutes.js', controller: 'NotificationController', service: 'NotificationService', repo: 'NotificationRepository', auth: 'Admin JWT', rbac: 'ADMIN, SUPER_ADMIN' },
  { prefix: '/api/admin/landing', module: 'Landing CMS', file: 'src/admin/routes/landingCMSRoutes.js', controller: 'LandingCMSController', service: 'LandingCMSService', repo: 'LandingCMSRepository', auth: 'Admin JWT', rbac: 'ADMIN, SUPER_ADMIN' },
  { prefix: '/api/public/landing', module: 'Public Landing', file: 'src/admin/routes/landingPublicRoutes.js', controller: 'LandingPublicController', service: 'LandingCMSService', repo: 'LandingCMSRepository', auth: 'None', rbac: 'Public' },
  { prefix: '/api/super-admin/branches', module: 'Branch Management', file: 'src/admin/routes/branchRoutes.js', controller: 'BranchController', service: 'BranchService', repo: 'BranchRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/admin/rentals', module: 'Rental Management', file: 'src/admin/routes/rentalRoutes.js', controller: 'RentalController', service: 'RentalService', repo: 'RentalRepository', auth: 'Admin JWT', rbac: 'ADMIN, SUPER_ADMIN' },
  { prefix: '/api/super-admin/rentals', module: 'Super Admin Rentals', file: 'src/admin/routes/rentalRoutes.js', controller: 'RentalController', service: 'RentalService', repo: 'RentalRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/super-admin/wallets', module: 'Enterprise Wallets', file: 'src/admin/routes/financeRoutes.js', controller: 'FinanceController', service: 'WalletService', repo: 'WalletRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/super-admin/finance/payments', module: 'Finance Payments', file: 'src/admin/routes/financeRoutes.js', controller: 'FinanceController', service: 'FinanceService', repo: 'FinanceRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/super-admin/settlements', module: 'Settlements', file: 'src/admin/routes/financeRoutes.js', controller: 'FinanceController', service: 'SettlementService', repo: 'FinanceRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/super-admin/ledger', module: 'General Ledger', file: 'src/admin/routes/financeRoutes.js', controller: 'FinanceController', service: 'LedgerService', repo: 'FinanceRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/super-admin/finance', module: 'Finance Reports', file: 'src/admin/routes/financeRoutes.js', controller: 'FinanceController', service: 'FinanceService', repo: 'FinanceRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/super-admin/notifications', module: 'Communication Notifications', file: 'src/admin/routes/communicationRoutes.js', controller: 'CommunicationController', service: 'CommunicationService', repo: 'CommunicationRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN, ADMIN' },
  { prefix: '/api/super-admin/templates', module: 'Communication Templates', file: 'src/admin/routes/communicationRoutes.js', controller: 'CommunicationController', service: 'CommunicationService', repo: 'CommunicationRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/super-admin/campaigns', module: 'Communication Campaigns', file: 'src/admin/routes/communicationRoutes.js', controller: 'CommunicationController', service: 'CommunicationService', repo: 'CommunicationRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/preferences', module: 'User Preferences', file: 'src/admin/routes/communicationRoutes.js', controller: 'CommunicationController', service: 'CommunicationService', repo: 'CommunicationRepository', auth: 'User/Admin JWT', rbac: 'Authenticated' },
  { prefix: '/api/comm-webhooks', module: 'Communication Webhooks', file: 'src/admin/routes/communicationRoutes.js', controller: 'CommunicationController', service: 'CommunicationService', repo: 'CommunicationRepository', auth: 'Public / Admin JWT', rbac: 'Mixed' },
  { prefix: '/api/super-admin/dashboard', module: 'BI Dashboard', file: 'src/admin/routes/biRoutes.js', controller: 'BIController', service: 'BIService', repo: 'BIRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/super-admin/analytics', module: 'BI Analytics', file: 'src/admin/routes/biRoutes.js', controller: 'BIController', service: 'BIService', repo: 'BIRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/super-admin/reports', module: 'BI Reports', file: 'src/admin/routes/biRoutes.js', controller: 'BIController', service: 'BIService', repo: 'BIRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/super-admin/export', module: 'BI Exports', file: 'src/admin/routes/biRoutes.js', controller: 'BIController', service: 'BIService', repo: 'BIRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/super-admin', module: 'Super Admin Extensions', file: 'src/admin/routes/superAdminExtensionRoutes.js', controller: 'SuperAdminExtensionController', service: 'SuperAdminExtensionService', repo: 'SuperAdminExtensionRepository', auth: 'Admin JWT', rbac: 'SUPER_ADMIN' },
  { prefix: '/api/auth', module: 'User Auth', file: 'src/user/routes/authRoutes.js', controller: 'AuthController', service: 'AuthService', repo: 'UserRepository', auth: 'Public / User JWT', rbac: 'Public / Authenticated' },
  { prefix: '/api/users', module: 'User Profile & Roles', file: 'src/user/routes/userRoutes.js', controller: 'UserController', service: 'UserService', repo: 'UserRepository', auth: 'User JWT', rbac: 'CUSTOMER, RIDER' },
  { prefix: '/api/riders', module: 'Rider Profile', file: 'src/user/routes/riderRoutes.js', controller: 'RiderController', service: 'RiderService', repo: 'RiderRepository', auth: 'User JWT', rbac: 'RIDER' },
  { prefix: '/api/vehicles', module: 'User Vehicles', file: 'src/user/routes/vehicleRoutes.js', controller: 'VehicleController', service: 'VehicleService', repo: 'VehicleRepository', auth: 'User JWT', rbac: 'CUSTOMER, RIDER' },
  { prefix: '/api/bookings', module: 'User Bookings & Invoices', file: 'src/user/routes/bookingRoutes.js', controller: 'BookingController', service: 'BookingService', repo: 'BookingRepository', auth: 'User JWT', rbac: 'CUSTOMER, RIDER' },
  { prefix: '/api/jobs', module: 'User Jobs', file: 'src/user/routes/jobRoutes.js', controller: 'JobController', service: 'JobService', repo: 'JobRepository', auth: 'User JWT', rbac: 'RIDER' },
  { prefix: '/api/notifications', module: 'User Notifications', file: 'src/user/routes/notificationRoutes.js', controller: 'NotificationController', service: 'NotificationService', repo: 'NotificationRepository', auth: 'User JWT', rbac: 'CUSTOMER, RIDER' },
  { prefix: '/api/location', module: 'Location & Tracking', file: 'src/user/routes/locationRoutes.js', controller: 'LocationController', service: 'LocationService', repo: 'LocationRepository', auth: 'User JWT', rbac: 'RIDER' },
  { prefix: '/api/payments', module: 'User Payments', file: 'src/user/routes/paymentRoutes.js', controller: 'PaymentController', service: 'PaymentService', repo: 'PaymentRepository', auth: 'User JWT / Public Webhook', rbac: 'CUSTOMER, RIDER' },
  { prefix: '/api/wallet', module: 'User Wallet', file: 'src/user/routes/walletRoutes.js', controller: 'WalletController', service: 'WalletService', repo: 'WalletRepository', auth: 'User JWT', rbac: 'CUSTOMER, RIDER' },
  { prefix: '/api/history', module: 'User History', file: 'src/user/routes/historyRoutes.js', controller: 'HistoryController', service: 'HistoryService', repo: 'HistoryRepository', auth: 'User JWT', rbac: 'CUSTOMER, RIDER' },
  { prefix: '/api/payouts', module: 'User Payouts', file: 'src/user/routes/payoutRoutes.js', controller: 'PayoutController', service: 'PayoutService', repo: 'PayoutRepository', auth: 'User JWT', rbac: 'RIDER' },
  { prefix: '/api/coupons', module: 'Coupons', file: 'src/user/routes/couponRoutes.js', controller: 'CouponController', service: 'CouponService', repo: 'CouponRepository', auth: 'User JWT', rbac: 'CUSTOMER, RIDER' },
  { prefix: '/api/webhooks', module: 'Webhooks', file: 'src/user/routes/webhookRoutes.js', controller: 'RazorpayWebhookController', service: 'WebhookService', repo: 'WebhookRepository', auth: 'HMAC Signature', rbac: 'Provider Callback' },
  { prefix: '/api/performance', module: 'Rider Performance', file: 'src/user/routes/performanceRoutes.js', controller: 'PerformanceController', service: 'PerformanceService', repo: 'PerformanceRepository', auth: 'User JWT', rbac: 'RIDER' },
  { prefix: '/api', module: 'User Support & Resources', file: 'src/user/routes/supportRoutes.js', controller: 'SupportController', service: 'SupportService', repo: 'SupportRepository', auth: 'User JWT', rbac: 'CUSTOMER, RIDER' }
];

const extracted = JSON.parse(fs.readFileSync('scripts/extracted_routes.json', 'utf8'));

const uniqueRoutes = [];
const seen = new Set();

for (const r of extracted) {
  let cleanedPath = r.path.replace(/\/\(\?\:\(\[\^\/\]\+\?\)\)/g, '/:id');
  cleanedPath = cleanedPath.replace(/\/\(\?\:\/(\?\:([^\)]+))\)/g, '');
  cleanedPath = cleanedPath.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  
  const key = `${r.method} ${cleanedPath}`;
  if (!seen.has(key)) {
    seen.add(key);
    
    // Sort mapping by prefix length descending to match most specific prefix first
    const sortedMapping = [...routeMapping].sort((a, b) => b.prefix.length - a.prefix.length);
    let match = sortedMapping.find(m => cleanedPath.startsWith(m.prefix));
    if (!match) {
      match = { module: 'Core / System', file: 'app.js', controller: 'SystemHandler', service: 'CoreService', repo: 'N/A', auth: 'None', rbac: 'Public' };
    }
    
    uniqueRoutes.push({
      method: r.method,
      path: cleanedPath,
      module: match.module,
      file: match.file,
      controller: match.controller,
      service: match.service,
      repo: match.repo,
      auth: match.auth,
      rbac: match.rbac,
      status: 'ACTIVE'
    });
  }
}

uniqueRoutes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

let md = `# Backend API Route Inventory\n\n`;
md += `**Total Unique Registered Routes:** ${uniqueRoutes.length}\n`;
md += `**Generated Date:** ${new Date().toISOString()}\n\n`;
md += `| METHOD | PATH | MODULE | ROUTE FILE | CONTROLLER | SERVICE | REPOSITORY | AUTH | RBAC | STATUS |\n`;
md += `|---|---|---|---|---|---|---|---|---|---|\n`;

for (const r of uniqueRoutes) {
  md += `| \`${r.method}\` | \`${r.path}\` | ${r.module} | [\`${path.basename(r.file)}\`](file:///${r.file.replace(/\\\\/g, '/')}) | ${r.controller} | ${r.service} | ${r.repo} | ${r.auth} | ${r.rbac} | ${r.status} |\n`;
}

fs.writeFileSync('BACKEND_API_ROUTE_INVENTORY.md', md, 'utf8');
console.log(`Generated BACKEND_API_ROUTE_INVENTORY.md with ${uniqueRoutes.length} routes.`);
