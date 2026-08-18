const { sendError } = require('../utils/responseWrapper');
const structuredLogger = require('../utils/structuredLogger');

function errorResponse(res, status, message) {
  return sendError(res, status, message);
}

const SUPER_ADMIN_ONLY_PERMISSIONS = new Set([
  'manage_admins',
  'manage_branches',
  'super_admin_only'
]);


const VALID_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

const checkPermission = (allowedList = []) => {
  return (req, res, next) => {
    try {
      const { role } = req.admin;

      if (!role) {
        return errorResponse(res, 403, 'Role not found in token');
      }

      // SUPER_ADMIN bypasses all permission checks
      if (role === 'SUPER_ADMIN') {
        return next();
      }

      // From here: role is ADMIN (or any unknown future role — deny by default)
      if (role !== 'ADMIN') {
        structuredLogger.warn(`Unknown role attempted access: ${role}`, {
          role, required: allowedList.join(', '), path: req.path, requestId: req.requestId
        });
        return errorResponse(res, 403, 'You do not have permission to access this resource');
      }

      // ADMIN access check — must be explicitly allowed
      let adminAllowed = false;

      for (const item of allowedList) {
        if (item === '*') {
          // Wildcard: any role allowed
          adminAllowed = true;
          break;
        }

        if (item === 'ADMIN') {
          // Explicit ADMIN role literal in the list
          adminAllowed = true;
          break;
        }

        if (item === 'SUPER_ADMIN') {
          // Explicit SUPER_ADMIN-only role literal — ADMIN denied
          continue;
        }

        if (SUPER_ADMIN_ONLY_PERMISSIONS.has(item)) {
          // This specific permission is super-admin restricted — skip
          continue;
        }

        if (!VALID_ROLES.has(item)) {
          adminAllowed = true;
          break;
        }
      }

      if (adminAllowed) {
        return next();
      }

      structuredLogger.warn('Permission denied', {
        role, required: allowedList.join(', '), path: req.path, requestId: req.requestId
      });
      return errorResponse(res, 403, 'You do not have permission to access this resource');

    } catch (error) {
      structuredLogger.error('Permission Middleware Error', { error: error.message, requestId: req.requestId });
      return errorResponse(res, 500, 'Permission check failed');
    }
  };
};

module.exports = checkPermission;
