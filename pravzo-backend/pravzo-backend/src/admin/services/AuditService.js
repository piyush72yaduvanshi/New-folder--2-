
'use strict';

const db = require('../../../src/config/db');
const structuredLogger = require('../../../src/utils/structuredLogger');

class AuditService {

  async log(opts) {
    const {
      req,
      action,
      module,
      entityType = null,
      entityId = null,
      description = null,
      oldValue = null,
      newValue = null,
      reason = null,
      status = 'SUCCESS'
    } = opts;

    const adminId   = req?.admin?.admin_id || null;
    const ipAddress = req?.ip || null;
    const userAgent = req?.headers?.['user-agent']?.substring(0, 255) || null;
    const requestId = req?.requestId || null;

    try {
      await db.query(
        `INSERT INTO audit_logs
          (admin_id, action, module, details, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          adminId,
          action,
          module || 'SYSTEM',
          JSON.stringify({
            entity_type: entityType,
            entity_id: entityId,
            description,
            old_value: oldValue,
            new_value: newValue,
            reason,
            status,          // Store status inside JSON details — not a separate column
            request_id: requestId
          }),
          ipAddress,
          userAgent
        ]
      );

      structuredLogger.audit(action, {
        adminId, module, entityType, entityId,
        description, status, requestId, ipAddress
      });

    } catch (error) {
      // Audit log failure must NEVER crash the main operation
      structuredLogger.error('[AuditService] Failed to write audit log', {
        error: error.message, action, module, adminId
      });
    }
  }

  /**
   * Convenience method — log a successful action.
   */
  async success(req, action, module, opts = {}) {
    return this.log({ req, action, module, status: 'SUCCESS', ...opts });
  }

  /**
   * Convenience method — log a failed action.
   */
  async failure(req, action, module, opts = {}) {
    return this.log({ req, action, module, status: 'FAILED', ...opts });
  }

  async security(req, event, opts = {}) {
    // Write to DB audit trail
    await this.log({ req, action: event, module: 'SECURITY', status: 'SUCCESS', ...opts });
  
    structuredLogger.security(event, {
      adminId: req?.admin?.admin_id,
      ip: req?.ip,
      requestId: req?.requestId,
      ...opts
    });
  }
}

module.exports = new AuditService();

