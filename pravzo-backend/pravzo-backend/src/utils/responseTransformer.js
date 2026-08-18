
'use strict';

// ─── Month Names (deterministic — no ICU dependency) ─────────────────────────
const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// ─── Date & Time Helpers ──────────────────────────────────────────────────────


function formatDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}


function formatTime(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
}


function formatDateTime(dateInput) {
  if (!dateInput) return '';
  const date = formatDate(dateInput);
  const time = formatTime(dateInput);
  if (!date) return '';
  return time ? `${date} ${time}` : date;
}

// ─── Currency Helpers ─────────────────────────────────────────────────────────


function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === '') return '₹ 0.00';
  const num = parseFloat(amount);
  if (isNaN(num)) return '₹ 0.00';

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Format Indian number style: 1,23,456.00
  const [intPart, decPart = '00'] = absNum.toFixed(2).split('.');
  const lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const formatted = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;

  return isNegative
    ? `-₹ ${formatted}.${decPart.slice(0, 2)}`
    : `₹ ${formatted}.${decPart.slice(0, 2)}`;
}


function parseCurrency(amountStr) {
  if (!amountStr) return 0;
  const cleaned = String(amountStr).replace(/[₹,\s]/g, '').trim();
  const isNeg = cleaned.startsWith('-');
  const num = parseFloat(cleaned.replace('-', '')) || 0;
  return isNeg ? -num : num;
}

// ─── ID Helpers ───────────────────────────────────────────────────────────────


function formatId(id, prefix, padLength = 0) {
  if (id === null || id === undefined || id === '') return '';
  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) return ''; // guard against non-numeric strings
  const idStr = padLength > 0
    ? String(parsed).padStart(padLength, '0')
    : String(parsed);
  return `${prefix}${idStr}`;
}


function buildTransactionId(row, year) {
  if (row.payment_id) {
    return formatId(row.payment_id, `TXN-${year}-`, 5);
  }
  // transaction_id is a gateway reference string — use as-is with prefix only
  if (row.transaction_id) {
    return `TXN-${year}-${row.transaction_id}`;
  }
  return `TXN-${year}-UNKNOWN`;
}

// ─── Avatar Helpers ───────────────────────────────────────────────────────────


function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

// ─── Enum Maps (module scope — not recreated per call) ────────────────────────

const STATUS_MAP = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  BLOCKED: 'Blocked',
  SUSPENDED: 'Suspended',
  PENDING: 'Pending',
  PENDING_VERIFICATION: 'Pending Verification',
  LOCKED: 'Locked'
};

const KYC_STATUS_MAP = {
  APPROVED: 'Verified',
  PENDING: 'Pending',
  REJECTED: 'Rejected',
  NOT_SUBMITTED: 'Not Submitted',
  UNDER_REVIEW: 'Under Review',
  REVERIFY_REQUIRED: 'Re-verify Required'
};

const BOOKING_STATUS_MAP = {
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ACCEPTED: 'Ongoing',
  PICKED_UP: 'Ongoing',
  IN_TRANSIT: 'Ongoing',
  PENDING: 'Pending',
  REJECTED: 'Rejected'
};

const VEHICLE_STATUS_MAP = {
  AVAILABLE: 'Active',
  RENTED: 'Active',
  IN_USE: 'Active',
  ONLINE: 'Active',
  CHARGING: 'Active',
  ASSIGNED: 'Active',
  MAINTENANCE: 'In Maintenance',
  UNDER_MAINTENANCE: 'In Maintenance',
  SERVICE_DUE: 'In Maintenance',
  BLOCKED: 'Out of Service',
  OUT_OF_SERVICE: 'Out of Service',
  OFFLINE: 'Out of Service',
  INACTIVE: 'Out of Service',
  DAMAGED: 'Out of Service',
  UNASSIGNED: 'Unassigned'
};

const PAYMENT_STATUS_MAP = {
  SUCCESS: 'Success',
  FAILED: 'Failed',
  PENDING: 'Pending',
  REFUNDED: 'Refunded',
  PROCESSING: 'Processing',
  CANCELLED: 'Cancelled'
};

const PAYOUT_STATUS_MAP = {
  PAID: 'Completed',
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled'
};

const MAINTENANCE_STATUS_MAP = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled'
};

const INSURANCE_STATUS_MAP = {
  ACTIVE: 'Active',
  EXPIRING_SOON: 'Expiring Soon',
  LAPSED: 'Lapsed',
  CANCELLED: 'Cancelled'
};

const TICKET_STATUS_MAP = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  CLOSED: 'Closed',
  RESOLVED: 'Closed'
};

const TICKET_PRIORITY_MAP = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'High'
};

// ─── Enum Mapper Functions ────────────────────────────────────────────────────

function mapStatus(dbStatus) {
  if (!dbStatus) return 'Unknown';
  return STATUS_MAP[dbStatus] || dbStatus;
}

function mapKycStatus(dbStatus) {
  if (!dbStatus) return 'Not Submitted';
  return KYC_STATUS_MAP[dbStatus] || dbStatus;
}

function mapBookingStatus(dbStatus) {
  if (!dbStatus) return 'Unknown';
  return BOOKING_STATUS_MAP[dbStatus] || dbStatus;
}

function mapVehicleStatus(dbStatus) {
  if (!dbStatus) return 'Unknown';
  return VEHICLE_STATUS_MAP[dbStatus] || dbStatus;
}

function mapPaymentStatus(dbStatus) {
  if (!dbStatus) return 'Unknown';
  return PAYMENT_STATUS_MAP[dbStatus] || dbStatus;
}

function mapPayoutStatus(dbStatus) {
  if (!dbStatus) return 'Unknown';
  return PAYOUT_STATUS_MAP[dbStatus] || dbStatus;
}

// ─── Entity Transformers ──────────────────────────────────────────────────────

function transformUser(row) {
  if (!row) return null;
  // Map DB role enum to frontend display
  const ROLE_DISPLAY_MAP = {
    USER: 'User',
    RIDER: 'Rider',
    RENT_A_VEHICLE: 'Rent A Vehicle',
    VEHICLE_WITH_JOB: 'Vehicle With Job',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin'
  };
  const roleDisplay = ROLE_DISPLAY_MAP[row.role] || row.role || 'Rent A Vehicle';
  const userId = row.user_id || row.id;
  const fullName = row.full_name || row.name || '';
  return {
    id: formatId(userId, 'USR'),
    name: fullName,
    email: row.email || '',
    phone: row.phone_number || row.phone || '',
    role: roleDisplay,
    branch: row.branch_name || row.city || 'N/A',
    status: mapStatus(row.status),
    kyc: mapKycStatus(row.kyc_status),
    joined: formatDate(row.created_at),
    time: formatTime(row.created_at),
    avatar: getInitials(fullName),
    dob: row.date_of_birth || row.dob || null,
    gender: row.gender || null,
    address: row.address || null,
    aadharNumber: row.aadhar_number || row.aadharNumber || null,
    aadharFront: row.aadhar_front_url || row.aadhar_card_photo || row.aadharFront || null,
    aadharBack: row.aadhar_back_url || row.aadhar_card_back_photo || row.aadharBack || null,
    drivingLicenseNumber: row.driving_license_number || row.drivingLicenseNumber || null,
    drivingLicenseFront: row.driving_license_front_url || row.driving_license_photo || row.drivingLicenseFront || null,
    drivingLicenseBack: row.driving_license_back_url || row.driving_license_back_photo || row.drivingLicenseBack || null,
    walletAmount: formatCurrency(row.wallet_balance),
    walletBalance: parseFloat(row.wallet_balance) || 0,
    bankAccountNumber: row.bank_account_number || row.bankAccountNumber || null,
    ifscCode: row.ifsc_code || row.ifscCode || null,
    // Raw fields preserved for backward compat
    user_id: userId,
    full_name: fullName,
    phone_number: row.phone_number || row.phone,
    kyc_status: row.kyc_status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function transformAdmin(row) {
  if (!row) return null;
  return {
    id: formatId(row.admin_id, 'ADM', 3),
    name: row.full_name || '',
    email: row.email || '',
    role: row.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin',
    department: row.department || 'General',
    branch: row.branch_name || 'Unassigned',
    permissions: row.permissions_count || 0,
    status: mapStatus(row.account_status),
    lastLogin: formatDateTime(row.last_login_at),
    avatar: getInitials(row.full_name),
    // Raw fields preserved
    admin_id: row.admin_id,
    full_name: row.full_name,
    account_status: row.account_status,
    last_login_at: row.last_login_at,
    created_at: row.created_at,
    created_by: row.created_by,
    created_by_name: row.created_by_name || null
  };
}

function transformBooking(row) {
  if (!row) return null;
  return {
    id: formatId(row.trip_id, 'BK'),
    partnerId: row.partner_id ? `#B${row.partner_id}` : null,
    userName: row.user_name || '',
    userPhone: row.user_phone || '',
    avatar: getInitials(row.user_name),
    vehicle: row.model_name || '',
    vehicleNumber: row.registration_number || '',
    vehicleType: row.vehicle_type || '',
    branchName: row.branch_name || 'N/A',
    bookingType: row.booking_type || 'Daily',
    date: formatDate(row.created_at),
    time: formatTime(row.created_at),
    endDate: row.completed_at ? formatDate(row.completed_at) : '',
    endTime: row.completed_at ? formatTime(row.completed_at) : '',
    pickupLocation: row.pickup_address || '',
    amount: formatCurrency(row.fare_amount),
    status: mapBookingStatus(row.status),
    paymentStatus: mapPaymentStatus(row.payment_status),
    paymentMethod: row.payment_method || '',
    // Raw fields preserved
    trip_id: row.trip_id,
    rider_id: row.rider_id,
    user_id: row.user_id,
    fare_amount: parseFloat(row.fare_amount) || 0,
    created_at: row.created_at,
    completed_at: row.completed_at,
    cancelled_at: row.cancelled_at
  };
}

function transformVehicle(row) {
  if (!row) return null;
  // Use registration_number as the stable ID — never use year-based generated ID
  return {
    id: row.registration_number || `EV-${String(row.vehicle_id).padStart(5, '0')}`,
    name: row.model_name ? `${row.model_name} ${String(row.vehicle_id).slice(-4)}` : '',
    regNo: row.registration_number || '',
    type: row.vehicle_type || '',
    branch: row.branch_name || row.assigned_city || 'N/A',
    battery: parseFloat(row.battery_level) || 0,
    status: mapVehicleStatus(row.status),
    lastUpdated: formatDate(row.updated_at),
    // Raw fields preserved
    vehicle_id: row.vehicle_id,
    model_name: row.model_name,
    registration_number: row.registration_number,
    vehicle_type: row.vehicle_type,
    battery_level: row.battery_level,
    assigned_rider_id: row.assigned_rider_id,
    rider_name: row.rider_name || null,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function transformBranch(row) {
  if (!row) return null;
  return {
    id: formatId(row.branch_id, 'BR', 3),
    name: row.branch_name || row.name || '',
    city: row.city || '',
    region: row.state || row.region || '',
    manager: row.manager_name || row.manager || '',
    phone: row.phone || row.contact_phone || '',
    email: row.email || row.contact_email || '',
    status: mapStatus(row.status),
    kyc: row.verification_status || 'Pending',
    revenue: formatCurrency(row.monthly_revenue || 0),
    revenueGrowth: row.revenue_growth
      ? `${row.revenue_growth > 0 ? '+' : ''}${row.revenue_growth}%`
      : '0%',
    bookings: parseInt(row.monthly_bookings) || 0,
    bookingsGrowth: row.bookings_growth
      ? `${row.bookings_growth > 0 ? '+' : ''}${row.bookings_growth}%`
      : '0%',
    avatar: getInitials(row.branch_name || row.name),
    // Raw fields preserved
    branch_id: row.branch_id,
    branch_name: row.branch_name || row.name,
    created_at: row.created_at
  };
}

function transformMaintenance(row) {
  if (!row) return null;
  return {
    id: row.registration_number || `EV-${String(row.vehicle_id).padStart(5, '0')}`,
    name: row.model_name || '',
    maintType: row.maintenance_type || row.service_type || '',
    schedDate: row.scheduled_date || row.service_date || '',
    cost: formatCurrency(row.estimated_cost || row.cost || 0),
    status: MAINTENANCE_STATUS_MAP[row.status] || row.status || 'Scheduled',
    branch: row.branch_name || '',
    // Raw fields preserved
    maintenance_id: row.maintenance_id,
    vehicle_id: row.vehicle_id,
    created_at: row.created_at
  };
}

function transformInsurance(row) {
  if (!row) return null;
  return {
    id: row.registration_number || `EV-${String(row.vehicle_id).padStart(5, '0')}`,
    name: row.model_name || '',
    provider: row.provider || '',
    policyNo: row.policy_number || '',
    premium: formatCurrency(row.premium || 0),
    expiry: row.expiry_date || '',
    status: INSURANCE_STATUS_MAP[row.status] || row.status || 'Active',
    branch: row.branch_name || '',
    // Raw fields preserved
    insurance_id: row.insurance_id,
    vehicle_id: row.vehicle_id
  };
}

function transformTransaction(row) {
  if (!row) return null;
  const year = row.created_at
    ? new Date(row.created_at).getFullYear()
    : new Date().getFullYear();

  return {
    // Fixed: use buildTransactionId to handle numeric payment_id vs string transaction_id separately
    id: buildTransactionId(row, year),
    name: row.user_name || row.full_name || '',
    avatar: getInitials(row.user_name || row.full_name),
    role: row.user_role || 'Admin',
    type: row.transaction_type || row.payment_type || row.reference_type || '',
    module: row.module_category || 'Transactions',
    branch: row.branch_name || '',
    detailsTitle: row.description || row.details || '',
    amount: formatCurrency(row.amount),
    status: mapPaymentStatus(row.status),
    joined: formatDate(row.created_at),
    time: formatTime(row.created_at),
    paymentMode: row.payment_method || '',
    paymentProvider: row.payment_provider || '',
    referenceId: row.transaction_id || row.reference_id || '',
    // Raw fields preserved
    payment_id: row.payment_id,
    transaction_id: row.transaction_id,
    raw_amount: parseFloat(row.amount) || 0,
    created_at: row.created_at
  };
}


function transformLedgerEntry(row) {
  if (!row) return null;
  const year = row.created_at
    ? new Date(row.created_at).getFullYear()
    : new Date().getFullYear();

  // Build a stable display ID from entry_id (always numeric in ledger)
  const displayId = formatId(row.entry_id, `LE-${year}-`, 6);

  // entry_type label — DEBIT entries represent outflows, CREDIT represent inflows
  const entryTypeLabel = row.entry_type === 'DEBIT' ? 'Debit' : 'Credit';

  // Ledger entries have no user context — show account name + reference info
  const displayName = row.account_name || row.account_code || `Account #${row.account_id}`;

  return {
    id: displayId,
    name: displayName,
    avatar: getInitials(displayName),
    role: row.holder_type || 'System',
    type: row.reference_type || '',
    entryType: entryTypeLabel,
    module: row.account_type || 'Ledger',
    accountCode: row.account_code || '',
    accountName: row.account_name || '',
    detailsTitle: row.description || '',
    amount: formatCurrency(row.amount),
    // Ledger entries don't have a payment status — use entry_type as status signal
    status: entryTypeLabel,
    joined: formatDate(row.created_at),
    time: formatTime(row.created_at),
    referenceId: row.reference_id || '',
    referenceType: row.reference_type || '',
    // Raw fields preserved
    entry_id: row.entry_id,
    entry_group_id: row.entry_group_id,
    account_id: row.account_id,
    holder_type: row.holder_type,
    holder_id: row.holder_id,
    entry_type: row.entry_type,
    raw_amount: parseFloat(row.amount) || 0,
    created_at: row.created_at
  };
}

function transformPayout(row) {
  if (!row) return null;
  const year = row.created_at
    ? new Date(row.created_at).getFullYear()
    : new Date().getFullYear();

  
  const recipientType = row.recipient_type || '';
  let displayName = '';
  let displayEmail = '';
  let displayBranch = '';
  let displayBranchCode = '';

  if (recipientType === 'RIDER') {
    displayName  = row.rider_name  || row.full_name || `Rider #${row.recipient_id}`;
    displayEmail = row.rider_email || row.email     || '';
  } else if (recipientType === 'BRANCH') {
    displayName      = row.branch_name || `Branch #${row.recipient_id}`;
    displayEmail     = row.branch_email || row.email || '';
    displayBranch    = row.branch_name  || '';
    displayBranchCode = row.branch_code || '';
  } else if (recipientType === 'PARTNER') {
    // No dedicated partner table yet — degrade gracefully
    displayName  = row.full_name  || `Partner #${row.recipient_id}`;
    displayEmail = row.email || '';
  } else {
    displayName = row.rider_name || row.full_name || `Recipient #${row.recipient_id}`;
  }

  // Derive payout type from recipient_type (payout_type column does not exist in settlements table)
  const typeMap = { RIDER: 'Rider Payout', BRANCH: 'Branch Payout', PARTNER: 'Partner Payout' };
  const displayType = typeMap[recipientType] || row.payout_type || 'Payout';

  return {
    id: formatId(row.settlement_id, `PYN-${year}-`, 5),
    name: displayName,
    email: displayEmail,
    avatar: getInitials(displayName),
    partnerId: row.partner_id || null,
    type: displayType,
    branch: displayBranch || row.branch_name || '',
    branchCode: displayBranchCode || row.branch_code || '',
    amount: formatCurrency(row.amount),
    status: mapPayoutStatus(row.status),
    joined: formatDate(row.created_at),
    time: formatTime(row.created_at),
    // Raw fields preserved
    settlement_id: row.settlement_id,
    recipient_type: row.recipient_type,
    recipient_id: row.recipient_id,
    raw_amount: parseFloat(row.amount) || 0,
    created_at: row.created_at
  };
}

function transformAuditLog(row) {
  if (!row) return null;
  return {
    logId: formatId(row.log_id || row.audit_id, 'LOG-'),
    name: row.admin_name || `Admin #${row.admin_id}`,
    email: row.admin_email || '',
    role: row.admin_role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin',
    action: row.action || '',
    module: row.module || 'System',
    details: typeof row.details === 'string'
      ? row.details
      : typeof row.description === 'string'
        ? row.description
        : JSON.stringify(row.details || row.description || {}),
    ip: row.ip_address || '',
    status: row.status || 'Success',
    joined: formatDate(row.created_at),
    time: formatTime(row.created_at),
    // Raw fields preserved
    log_id: row.log_id || row.audit_id,
    admin_id: row.admin_id,
    created_at: row.created_at
  };
}

function transformSupportTicket(row) {
  if (!row) return null;
  const year = row.created_at
    ? new Date(row.created_at).getFullYear()
    : new Date().getFullYear();
  return {
    ticketId: formatId(row.ticket_id, `TKT-${year}-`),
    userType: row.user_type === 'RIDER' ? 'Rider' : 'Customer',
    user: row.user_name || row.full_name || '',
    category: row.category || '',
    date: row.created_at
      ? new Date(row.created_at).toISOString().slice(0, 10)
      : '',
    priority: TICKET_PRIORITY_MAP[row.priority] || row.priority || 'Medium',
    status: TICKET_STATUS_MAP[row.status] || row.status || 'Open',
    // Raw fields preserved
    ticket_id: row.ticket_id,
    created_at: row.created_at
  };
}

function transformDashboardStats(stats, recentBookings = []) {
  return {
    total_users: parseInt(stats.total_users) || 0,
    total_bookings: parseInt(stats.total_bookings) || 0,
    total_revenue: parseFloat(stats.total_revenue) || 0,
    total_revenue_formatted: formatCurrency(stats.total_revenue),
    active_vehicles: parseInt(stats.active_vehicles) || 0,
    total_payouts: parseFloat(stats.total_payouts) || 0,
    total_payouts_formatted: formatCurrency(stats.total_payouts),
    active_branches: parseInt(stats.active_branches) || 0,
    recent_bookings: recentBookings.map(transformBooking)
  };
}

// ─── Collection Helper ────────────────────────────────────────────────────────

function transformList(rows, transformFn) {
  if (!Array.isArray(rows)) return [];
  return rows.map(transformFn).filter(Boolean);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // Helpers
  formatDate,
  formatTime,
  formatDateTime,
  formatCurrency,
  parseCurrency,
  formatId,
  buildTransactionId,
  getInitials,

  // Enum mappers
  mapStatus,
  mapKycStatus,
  mapBookingStatus,
  mapVehicleStatus,
  mapPaymentStatus,
  mapPayoutStatus,

  // Entity transformers
  transformUser,
  transformAdmin,
  transformBooking,
  transformVehicle,
  transformBranch,
  transformMaintenance,
  transformInsurance,
  transformTransaction,
  transformLedgerEntry,
  transformPayout,
  transformAuditLog,
  transformSupportTicket,
  transformDashboardStats,

  // Collection helper
  transformList
};
