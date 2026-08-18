'use strict';

const RT = require('./responseTransformer');


function toUserList(result) {
  return {
    users: RT.transformList(result.users || [], RT.transformUser)
    // pagination is in meta.pagination — not duplicated here
  };
}


function toUser(row) {
  return RT.transformUser(row);
}

// ─── Admin Management ─────────────────────────────────────────────────────────

function toAdminList(result) {
  return {
    admins: RT.transformList(result.admins || [], RT.transformAdmin)
  };
}


function toAdmin(row) {
  return RT.transformAdmin(row);
}

// ─── Booking Management ───────────────────────────────────────────────────────


function toBookingList(result) {
  return {
    bookings: RT.transformList(result.bookings || [], RT.transformBooking)
  };
}


function toBooking(row) {
  return RT.transformBooking(row);
}

// ─── Branch Management ────────────────────────────────────────────────────────


function toBranch(row) {
  if (!row) return null;
  return {
    id: RT.formatId(row.branch_id, 'BR', 3),
    name: row.branch_name || '',
    city: row.city || '',
    region: row.state || '',
    manager: row.manager_name || '',
    phone: row.phone_number || row.alternate_phone || '',
    email: row.email || '',
    status: mapBranchStatus(row.branch_status),
    kyc: row.verification_status || 'Pending',
    revenue: RT.formatCurrency(row.monthly_revenue || 0),
    revenueGrowth: formatGrowth(row.revenue_growth),
    bookings: parseInt(row.monthly_bookings) || 0,
    bookingsGrowth: formatGrowth(row.bookings_growth),
    avatar: RT.getInitials(row.branch_name),
    // Raw fields preserved
    branch_id: row.branch_id,
    branch_name: row.branch_name,
    branch_code: row.branch_code || null,
    branch_type: row.branch_type || null,
    branch_status: row.branch_status,
    manager_id: row.manager_id || null,
    created_at: row.created_at
  };
}

function toBranchList(result) {
  return {
    branches: RT.transformList(result.branches || [], toBranch)
  };
}

function mapBranchStatus(dbStatus) {
  const map = { ACTIVE: 'Active', INACTIVE: 'Inactive', MAINTENANCE: 'Under Maintenance', SUSPENDED: 'Suspended' };
  return map[dbStatus] || dbStatus || 'Unknown';
}

function formatGrowth(value) {
  if (value === null || value === undefined) return '0%';
  const num = parseFloat(value);
  if (isNaN(num)) return '0%';
  return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
}

// ─── Vehicle / Fleet ──────────────────────────────────────────────────────────


function toVehicleList(result) {
  return {
    vehicles: RT.transformList(result.vehicles || [], RT.transformVehicle)
  };
}


function toVehicle(row) {
  return RT.transformVehicle(row);
}


function toFleetStats(stats) {
  if (!stats) return { total: 0, active: 0, maintenance: 0, lowBattery: 0, outOfService: 0, sosAlerts: 0 };
  return {
    total: parseInt(stats.total_vehicles) || 0,
    active: (parseInt(stats.available) || 0) + (parseInt(stats.on_trip) || 0) + (parseInt(stats.charging) || 0),
    maintenance: parseInt(stats.maintenance) || 0,
    lowBattery: parseInt(stats.low_battery) || 0,
    outOfService: (parseInt(stats.blocked) || 0) + (parseInt(stats.offline) || 0),
    sosAlerts: parseInt(stats.sos_alerts) || 0,
    // Additional raw fields for internal use
    avg_battery: parseFloat(stats.avg_battery) || 0,
    assigned_riders: parseInt(stats.assigned_riders) || 0,
    unassigned: parseInt(stats.unassigned) || 0
  };
}

// ─── Maintenance ──────────────────────────────────────────────────────────────

function toMaintenanceList(rows) {
  return RT.transformList(Array.isArray(rows) ? rows : [], RT.transformMaintenance);
}

// ─── Insurance ────────────────────────────────────────────────────────────────


function toInsuranceList(rows) {
  return RT.transformList(Array.isArray(rows) ? rows : [], RT.transformInsurance);
}

// ─── Finance / Transactions ───────────────────────────────────────────────────


function toTransactionList(result) {
  return {
    transactions: RT.transformList(result.entries || result.transactions || [], RT.transformTransaction)
  };
}


function toLedgerEntryList(result) {
  return {
    transactions: RT.transformList(result.entries || [], RT.transformLedgerEntry)
  };
}

// ─── Settlements / Payouts ────────────────────────────────────────────────────


function toPayoutList(result) {
  return {
    payouts: RT.transformList(result.settlements || result.payouts || [], RT.transformPayout)
  };
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────


function toAuditLogList(result) {
  const logs = (result?.logs) || (result?.data?.logs) || [];
  return {
    logs: RT.transformList(logs, RT.transformAuditLog)
    // pagination is in meta.pagination — not duplicated here
  };
}

// ─── Support Tickets ──────────────────────────────────────────────────────────

function toTicketList(result) {
  return {
    tickets: RT.transformList(result.tickets || [], RT.transformSupportTicket)
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function toDashboard(stats, recentBookings = []) {
  return RT.transformDashboardStats(stats, recentBookings);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // Users
  toUser,
  toUserList,

  // Admins
  toAdmin,
  toAdminList,

  // Bookings
  toBooking,
  toBookingList,

  // Branches
  toBranch,
  toBranchList,

  // Vehicles / Fleet
  toVehicle,
  toVehicleList,
  toFleetStats,

  // Maintenance / Insurance
  toMaintenanceList,
  toInsuranceList,

  // Finance
  toTransactionList,
  toLedgerEntryList,
  toPayoutList,

  // Audit Logs
  toAuditLogList,

  // Support
  toTicketList,

  // Dashboard
  toDashboard
};
