const ROLE_MAP = {
  RENT_A_VEHICLE: "CUSTOMER",
  USER: "CUSTOMER",
  CUSTOMER: "CUSTOMER",
  VEHICLE: "CUSTOMER",
  RIDER: "RIDER",
  VEHICLE_WITH_JOB: "RIDER",
  VEHICLEWITHJOB: "RIDER",
  SUPERVISOR: "SUPERVISOR",
  DISPATCHER: "DISPATCHER",
  BRANCH_ADMIN: "BRANCH_ADMIN",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  FINANCE: "FINANCE",
};

const ROLE_LEVELS = {
  CUSTOMER: 1,
  RIDER: 2,
  SUPERVISOR: 3,
  DISPATCHER: 3,
  BRANCH_ADMIN: 4,
  FINANCE: 4,
  ADMIN: 5,
  SUPER_ADMIN: 6,
};

function normalizeRole(role) {
  if (!role) return null;
  const upper = String(role).trim().toUpperCase();
  return ROLE_MAP[upper] || upper;
}

function authorizeRoles(...allowedRoles) {
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userRole = normalizeRole(req.user.role);

    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: "Invalid user role",
      });
    }

    const hasDirectRole = normalizedAllowedRoles.includes(userRole);

    const hasHierarchyAccess = normalizedAllowedRoles.some((role) => {
      return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[role] || 0);
    });

    if (!hasDirectRole && !hasHierarchyAccess) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions for this resource",
      });
    }

    return next();
  };
}

module.exports = { authorizeRoles, normalizeRole };
