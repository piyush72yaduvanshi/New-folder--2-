const db = require('../../../src/config/db');

class SuperAdminExtensionRepository {
  // ================= SYSTEM SETTINGS =================
  async getSystemSettings(group = null) {
    let sql = 'SELECT * FROM system_settings';
    const params = [];
    if (group) {
      sql += ' WHERE group_name = ?';
      params.push(group);
    }
    sql += ' ORDER BY group_name, setting_key';
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async findSystemSettingByKey(key) {
    const [rows] = await db.query('SELECT * FROM system_settings WHERE setting_key = ?', [key]);
    return rows.length > 0 ? rows[0] : null;
  }

  async upsertSystemSetting(key, value, adminId) {
    const sql = `
      INSERT INTO system_settings (setting_key, setting_value, updated_by)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)
    `;
    await db.query(sql, [key, value, adminId]);
    return this.findSystemSettingByKey(key);
  }

  // ================= AUDIT LOGS =================
  async getAuditLogs({ limit = 50, offset = 0, module = null }) {
    let sql = `
      SELECT
        al.audit_id,
        al.admin_id,
        al.action,
        al.module,
        al.details,
        al.ip_address,
        al.created_at,
        a.full_name   AS admin_name,
        a.email       AS admin_email,
        r.role_name   AS admin_role
      FROM audit_logs al
      LEFT JOIN users a ON al.admin_id = a.user_id
      LEFT JOIN roles r ON a.role_id = r.role_id
    `;
    const conditions = [];
    const params = [];

    if (module) {
      conditions.push('al.module = ?');
      params.push(module);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY al.audit_id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(sql, params);
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM audit_logs');
    return { logs: rows, total };
  }

  async findAuditLogById(audit_id) {
    const sql = `
      SELECT
        al.audit_id,
        al.admin_id,
        al.action,
        al.module,
        al.details,
        al.ip_address,
        al.user_agent,
        al.created_at,
        a.full_name   AS admin_name,
        a.email       AS admin_email,
        r.role_name   AS admin_role
      FROM audit_logs al
      LEFT JOIN users a ON al.admin_id = a.user_id
      LEFT JOIN roles r ON a.role_id = r.role_id
      WHERE al.audit_id = ?
    `;
    const [rows] = await db.query(sql, [audit_id]);
    return rows.length > 0 ? rows[0] : null;
  }

  async exportAuditLogs({ module = null, limit = 5000 }) {
    let sql = `
      SELECT
        al.audit_id,
        al.admin_id,
        al.action,
        al.module,
        al.details,
        al.ip_address,
        al.created_at,
        a.full_name   AS admin_name,
        a.email       AS admin_email
      FROM audit_logs al
      LEFT JOIN users a ON al.admin_id = a.user_id
    `;
    const params = [];
    if (module) {
      sql += ' WHERE al.module = ?';
      params.push(module);
    }
    sql += ' ORDER BY al.audit_id DESC LIMIT ?';
    params.push(Math.min(parseInt(limit) || 5000, 10000));
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async createAuditLog({ admin_id, user_id, action, module, details, ip_address, user_agent }) {
    const sql = `
      INSERT INTO audit_logs (admin_id, user_id, action, module, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      admin_id || null, user_id || null, action, module,
      JSON.stringify(details || {}), ip_address || null, user_agent || null
    ]);
    return result.insertId;
  }

  // ================= MAINTENANCE RECORDS =================
  async getMaintenanceRecords({ vehicle_id, status }) {
    let sql = `
      SELECT
        vm.maintenance_id,
        vm.vehicle_id,
        vm.maintenance_type,
        vm.description,
        vm.cost,
        vm.status,
        vm.scheduled_date,
        vm.completed_date,
        vm.performed_by,
        vm.created_at,
        vm.updated_at,
        v.registration_number,
        v.model_name,
        v.branch_id,
        b.branch_name,
        u.full_name AS performed_by_name
      FROM vehicle_maintenance vm
      JOIN vehicles v ON vm.vehicle_id = v.vehicle_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      LEFT JOIN users u ON vm.performed_by = u.user_id
    `;
    const conditions = [];
    const params = [];

    if (vehicle_id) {
      conditions.push('vm.vehicle_id = ?');
      params.push(vehicle_id);
    }
    if (status) {
      conditions.push('vm.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY vm.maintenance_id DESC LIMIT 200';

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async findMaintenanceRecordById(maintenance_id) {
    const sql = `
      SELECT
        vm.maintenance_id,
        vm.vehicle_id,
        vm.maintenance_type,
        vm.description,
        vm.cost,
        vm.status,
        vm.scheduled_date,
        vm.completed_date,
        vm.performed_by,
        vm.created_at,
        vm.updated_at,
        v.registration_number,
        v.model_name,
        v.branch_id,
        b.branch_name,
        u.full_name AS performed_by_name
      FROM vehicle_maintenance vm
      JOIN vehicles v ON vm.vehicle_id = v.vehicle_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      LEFT JOIN users u ON vm.performed_by = u.user_id
      WHERE vm.maintenance_id = ?
    `;
    const [rows] = await db.query(sql, [maintenance_id]);
    return rows.length > 0 ? rows[0] : null;
  }

  async createMaintenanceRecord(data) {
    const sql = `
      INSERT INTO vehicle_maintenance
        (vehicle_id, maintenance_type, description, cost, status, scheduled_date, completed_date, performed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      data.vehicle_id,
      data.maintenance_type || data.service_type || 'GENERAL',
      data.description || data.remarks || data.notes || null,
      data.cost || data.estimated_cost || 0,
      data.status || 'SCHEDULED',
      data.scheduled_date || data.service_date || null,
      data.completed_date || null,
      data.performed_by || null
    ]);
    return result.insertId;
  }

  async updateMaintenanceStatus(maintenance_id, status, completed_date = null) {
    const sql = `
      UPDATE vehicle_maintenance
      SET status = ?, completed_date = CASE WHEN ? = 'COMPLETED' THEN COALESCE(?, NOW()) ELSE completed_date END
      WHERE maintenance_id = ?
    `;
    await db.query(sql, [status, status, completed_date || null, maintenance_id]);
    return true;
  }

  async updateMaintenanceRecord(maintenance_id, data) {
    const fields = [];
    const params = [];

    if (data.cost !== undefined || data.estimated_cost !== undefined) {
      fields.push('cost = ?');
      params.push(data.cost !== undefined ? data.cost : data.estimated_cost);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      params.push(data.status);
    }
    if (data.scheduled_date !== undefined) {
      fields.push('scheduled_date = ?');
      params.push(data.scheduled_date);
    }
    if (data.completed_date !== undefined) {
      fields.push('completed_date = ?');
      params.push(data.completed_date);
    }
    if (data.performed_by !== undefined) {
      fields.push('performed_by = ?');
      params.push(data.performed_by);
    }
    if (data.remarks !== undefined || data.description !== undefined) {
      fields.push('description = ?');
      params.push(data.description !== undefined ? data.description : data.remarks);
    }
    if (data.maintenance_type !== undefined || data.service_type !== undefined) {
      fields.push('maintenance_type = ?');
      params.push(data.maintenance_type !== undefined ? data.maintenance_type : data.service_type);
    }

    if (fields.length === 0) return false;

    params.push(maintenance_id);
    const sql = `UPDATE vehicle_maintenance SET ${fields.join(', ')} WHERE maintenance_id = ?`;
    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  async deleteMaintenanceRecord(maintenance_id) {
    const [result] = await db.query('DELETE FROM vehicle_maintenance WHERE maintenance_id = ?', [maintenance_id]);
    return result.affectedRows > 0;
  }

  // ================= INSURANCE POLICIES =================
  async getInsurancePolicies({ vehicle_id, status }) {
    let sql = `
      SELECT
        vi.insurance_id,
        vi.vehicle_id,
        vi.provider,
        vi.policy_number,
        vi.premium_amount,
        vi.start_date,
        vi.expiry_date,
        vi.status,
        vi.document_url,
        vi.coverage_details,
        v.registration_number,
        v.model_name,
        b.branch_name
      FROM vehicle_insurance vi
      JOIN vehicles v ON vi.vehicle_id = v.vehicle_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
    `;
    const conditions = [];
    const params = [];

    if (vehicle_id) {
      conditions.push('vi.vehicle_id = ?');
      params.push(vehicle_id);
    }
    if (status) {
      conditions.push('vi.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY vi.expiry_date ASC';

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async findInsurancePolicyById(insurance_id) {
    const sql = `
      SELECT
        vi.insurance_id,
        vi.vehicle_id,
        vi.policy_number,
        vi.provider,
        vi.start_date,
        vi.expiry_date,
        vi.premium_amount,
        vi.coverage_details,
        vi.document_url,
        vi.status,
        vi.created_at,
        vi.updated_at,
        v.registration_number,
        v.model_name,
        b.branch_name
      FROM vehicle_insurance vi
      JOIN vehicles v ON vi.vehicle_id = v.vehicle_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      WHERE vi.insurance_id = ?
    `;
    const [rows] = await db.query(sql, [insurance_id]);
    return rows.length > 0 ? rows[0] : null;
  }

  async createInsurancePolicy(data) {
    const sql = `
      INSERT INTO vehicle_insurance
        (vehicle_id, provider, policy_number, premium_amount, start_date, expiry_date, status, document_url, coverage_details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      data.vehicle_id,
      data.provider || data.provider_name,
      data.policy_number,
      data.premium_amount || data.premium || 0,
      data.start_date,
      data.expiry_date,
      data.status || 'ACTIVE',
      data.document_url || null,
      data.coverage_details || data.coverage_amount ? String(data.coverage_details || data.coverage_amount) : null
    ]);
    return result.insertId;
  }

  async updateInsurancePolicy(insurance_id, data) {
    const fields = [];
    const params = [];

    if (data.policy_number !== undefined) {
      fields.push('policy_number = ?');
      params.push(data.policy_number);
    }
    if (data.provider !== undefined || data.provider_name !== undefined) {
      fields.push('provider = ?');
      params.push(data.provider !== undefined ? data.provider : data.provider_name);
    }
    if (data.start_date !== undefined) {
      fields.push('start_date = ?');
      params.push(data.start_date);
    }
    if (data.expiry_date !== undefined) {
      fields.push('expiry_date = ?');
      params.push(data.expiry_date);
    }
    if (data.premium_amount !== undefined || data.premium !== undefined) {
      fields.push('premium_amount = ?');
      params.push(data.premium_amount !== undefined ? data.premium_amount : data.premium);
    }
    if (data.coverage_details !== undefined || data.coverage_amount !== undefined) {
      fields.push('coverage_details = ?');
      params.push(data.coverage_details !== undefined ? data.coverage_details : String(data.coverage_amount));
    }
    if (data.document_url !== undefined) {
      fields.push('document_url = ?');
      params.push(data.document_url);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      params.push(data.status);
    }

    if (fields.length === 0) return false;

    params.push(insurance_id);
    const sql = `UPDATE vehicle_insurance SET ${fields.join(', ')} WHERE insurance_id = ?`;
    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  async deleteInsurancePolicy(insurance_id) {
    const [result] = await db.query('DELETE FROM vehicle_insurance WHERE insurance_id = ?', [insurance_id]);
    return result.affectedRows > 0;
  }

  // ================= SUPPORT TICKETS =================
  async getSupportTickets({ status, priority, category, page = 1, limit = 20 }) {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let sql = `
      SELECT t.*, u.full_name as user_name, u.email as user_email, a.full_name as admin_name 
      FROM support_tickets t 
      LEFT JOIN users u ON t.user_id = u.user_id 
      LEFT JOIN users a ON t.assigned_admin_id = a.user_id
    `;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('t.priority = ?');
      params.push(priority);
    }
    if (category) {
      conditions.push('t.category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY t.ticket_id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async findSupportTicketById(ticket_id) {
    const sql = `
      SELECT t.*, u.full_name as user_name, u.email as user_email, a.full_name as admin_name
      FROM support_tickets t
      LEFT JOIN users u ON t.user_id = u.user_id
      LEFT JOIN users a ON t.assigned_admin_id = a.user_id
      WHERE t.ticket_id = ?
    `;
    const [rows] = await db.query(sql, [ticket_id]);
    return rows.length > 0 ? rows[0] : null;
  }

  async createSupportTicket(data) {
    const sql = `
      INSERT INTO support_tickets (ticket_code, user_id, category, priority, status, subject, description)
      VALUES (?, ?, ?, ?, 'OPEN', ?, ?)
    `;
    const [result] = await db.query(sql, [
      data.ticket_code, data.user_id, data.category || 'GENERAL', data.priority || 'MEDIUM', data.subject, data.description
    ]);
    return result.insertId;
  }

  async updateSupportTicket(ticket_id, data) {
    const fields = [];
    const params = [];

    if (data.category !== undefined) {
      fields.push('category = ?');
      params.push(data.category);
    }
    if (data.priority !== undefined) {
      fields.push('priority = ?');
      params.push(data.priority);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      params.push(data.status);
    }
    if (data.subject !== undefined) {
      fields.push('subject = ?');
      params.push(data.subject);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      params.push(data.description);
    }
    if (data.resolution_notes !== undefined) {
      fields.push('resolution_notes = ?');
      params.push(data.resolution_notes);
    }
    if (data.assigned_admin_id !== undefined) {
      fields.push('assigned_admin_id = ?');
      params.push(data.assigned_admin_id);
    }

    if (fields.length === 0) return false;

    params.push(ticket_id);
    const sql = `UPDATE support_tickets SET ${fields.join(', ')} WHERE ticket_id = ?`;
    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  async updateSupportTicketStatus(ticket_id, status, resolution_notes = null, assigned_admin_id = null) {
    let sql = 'UPDATE support_tickets SET status = ?';
    const params = [status];

    if (resolution_notes) {
      sql += ', resolution_notes = ?';
      params.push(resolution_notes);
    }
    if (assigned_admin_id) {
      sql += ', assigned_admin_id = ?';
      params.push(assigned_admin_id);
    }

    sql += ' WHERE ticket_id = ?';
    params.push(ticket_id);

    await db.query(sql, params);
    return true;
  }

  async resolveSupportTicket(ticket_id, resolution_notes = null, assigned_admin_id = null) {
    let sql = "UPDATE support_tickets SET status = 'RESOLVED'";
    const params = [];

    if (resolution_notes) {
      sql += ', resolution_notes = ?';
      params.push(resolution_notes);
    }
    if (assigned_admin_id) {
      sql += ', assigned_admin_id = ?';
      params.push(assigned_admin_id);
    }

    sql += ' WHERE ticket_id = ?';
    params.push(ticket_id);

    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  // ================= COMMISSION RULES =================
  async getCommissionRules() {
    const [rows] = await db.query(`
      SELECT * FROM commission_rules ORDER BY priority ASC, rule_id DESC
    `);
    return rows;
  }

  async findCommissionRuleById(rule_id) {
    const [rows] = await db.query('SELECT * FROM commission_rules WHERE rule_id = ?', [rule_id]);
    return rows.length > 0 ? rows[0] : null;
  }

  async createCommissionRule(data) {
    const sql = `
      INSERT INTO commission_rules (rule_name, vehicle_type, city, commission_percentage, min_commission, max_commission, is_active, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      data.rule_name,
      data.vehicle_type || data.vehicle_category || null,
      data.city || null,
      data.commission_percentage !== undefined ? data.commission_percentage : (data.commission_rate || 0),
      data.min_commission || 0,
      data.max_commission || null,
      data.is_active ?? 1,
      data.priority || 0
    ]);
    return result.insertId;
  }

  async updateCommissionRule(rule_id, data) {
    const fields = [];
    const params = [];

    if (data.rule_name !== undefined) {
      fields.push('rule_name = ?');
      params.push(data.rule_name);
    }
    if (data.vehicle_type !== undefined || data.vehicle_category !== undefined) {
      fields.push('vehicle_type = ?');
      params.push(data.vehicle_type !== undefined ? data.vehicle_type : data.vehicle_category);
    }
    if (data.city !== undefined) {
      fields.push('city = ?');
      params.push(data.city);
    }
    if (data.commission_percentage !== undefined || data.commission_rate !== undefined) {
      fields.push('commission_percentage = ?');
      params.push(data.commission_percentage !== undefined ? data.commission_percentage : data.commission_rate);
    }
    if (data.min_commission !== undefined) {
      fields.push('min_commission = ?');
      params.push(data.min_commission);
    }
    if (data.max_commission !== undefined) {
      fields.push('max_commission = ?');
      params.push(data.max_commission);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      params.push(data.is_active);
    }
    if (data.priority !== undefined) {
      fields.push('priority = ?');
      params.push(data.priority);
    }

    if (fields.length === 0) return false;

    params.push(rule_id);
    const sql = `UPDATE commission_rules SET ${fields.join(', ')} WHERE rule_id = ?`;
    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  async deleteCommissionRule(rule_id) {
    const [result] = await db.query('DELETE FROM commission_rules WHERE rule_id = ?', [rule_id]);
    return result.affectedRows > 0;
  }

  // ================= TAX CONFIGURATIONS =================
  async getTaxConfigs() {
    const [rows] = await db.query('SELECT * FROM tax_configurations ORDER BY tax_id DESC');
    return rows;
  }

  async findTaxConfigById(tax_id) {
    const [rows] = await db.query('SELECT * FROM tax_configurations WHERE tax_id = ?', [tax_id]);
    return rows.length > 0 ? rows[0] : null;
  }

  async createTaxConfig(data) {
    const sql = `
      INSERT INTO tax_configurations (tax_name, rate_percentage, hsn_sac_code, state_code, is_active)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      data.tax_name, data.rate_percentage, data.hsn_sac_code || '996601', data.state_code || 'ALL', data.is_active ?? 1
    ]);
    return result.insertId;
  }

  async updateTaxConfig(tax_id, data) {
    const fields = [];
    const params = [];

    if (data.tax_name !== undefined) {
      fields.push('tax_name = ?');
      params.push(data.tax_name);
    }
    if (data.rate_percentage !== undefined) {
      fields.push('rate_percentage = ?');
      params.push(data.rate_percentage);
    }
    if (data.hsn_sac_code !== undefined) {
      fields.push('hsn_sac_code = ?');
      params.push(data.hsn_sac_code);
    }
    if (data.state_code !== undefined) {
      fields.push('state_code = ?');
      params.push(data.state_code);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      params.push(data.is_active);
    }

    if (fields.length === 0) return false;

    params.push(tax_id);
    const sql = `UPDATE tax_configurations SET ${fields.join(', ')} WHERE tax_id = ?`;
    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  async deleteTaxConfig(tax_id) {
    const [result] = await db.query('DELETE FROM tax_configurations WHERE tax_id = ?', [tax_id]);
    return result.affectedRows > 0;
  }

  // ================= INVOICES =================
  async getInvoices({ status }) {
    let sql = 'SELECT i.*, u.full_name as user_name FROM invoices i LEFT JOIN users u ON i.user_id = u.user_id';
    const params = [];
    if (status) {
      sql += ' WHERE i.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY i.invoice_id DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async createInvoice(data) {
    const sql = `
      INSERT INTO invoices (invoice_number, booking_id, user_id, branch_id, subtotal, tax_amount, total_amount, status, pdf_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      data.invoice_number, data.booking_id || null, data.user_id, data.branch_id || null, data.subtotal || 0, data.tax_amount || 0, data.total_amount || 0, data.status || 'UNPAID', data.pdf_url || null
    ]);
    return result.insertId;
  }

  // ================= INCENTIVES & REWARDS =================
  async getIncentivesAndRewards({ type }) {
    let sql = 'SELECT * FROM incentives_rewards';
    const params = [];
    if (type) {
      sql += ' WHERE type = ?';
      params.push(type);
    }
    sql += ' ORDER BY reward_id DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async createIncentiveReward(data) {
    const sql = `
      INSERT INTO incentives_rewards (title, type, target_trips, bonus_amount, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      data.title, data.type || 'INCENTIVE', data.target_trips || 0, data.bonus_amount || 0, data.start_date || null, data.end_date || null, data.status || 'ACTIVE'
    ]);
    return result.insertId;
  }

  // ================= JOB ASSIGNMENTS =================
  async getJobAssignments({ branch_id, status }) {
    let sql = `
      SELECT j.assignment_id, j.job_id, j.job_title, j.assigned_to, j.branch_id, j.vehicle_id,
             j.status, j.priority, j.notes, j.created_at, j.updated_at,
             b.branch_name, v.registration_number, u.full_name AS assigned_user_name, u.phone AS assigned_user_phone
      FROM job_assignments j 
      LEFT JOIN branches b ON j.branch_id = b.branch_id 
      LEFT JOIN vehicles v ON j.vehicle_id = v.vehicle_id 
      LEFT JOIN users u ON j.assigned_to = u.user_id
    `;
    const conditions = [];
    const params = [];

    if (branch_id) {
      conditions.push('j.branch_id = ?');
      params.push(branch_id);
    }
    if (status) {
      conditions.push('j.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY j.assignment_id DESC';

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async createJobAssignment(data) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      let jobId = data.job_id || data.jobId;
      const targetUserId = data.assigned_to || null;

      // Find rider_id if assigned_to is a user_id
      let riderId = null;
      if (targetUserId) {
        const [rRows] = await connection.query(
          'SELECT rider_id FROM riders WHERE user_id = ? OR rider_id = ? LIMIT 1',
          [targetUserId, targetUserId]
        );
        if (rRows.length > 0) {
          riderId = rRows[0].rider_id;
        }
      }

      const statusMap = {
        ACTIVE: 'IN_PROGRESS',
        OPEN: 'PENDING',
        ASSIGNED: 'IN_PROGRESS',
        PENDING: 'PENDING',
        IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED',
        FAILED: 'CANCELLED',
        TERMINATED: 'CANCELLED'
      };

      const jobStatus = statusMap[String(data.status || 'PENDING').toUpperCase()] || 'PENDING';
      const priorityMap = { LOW: 'LOW', NORMAL: 'NORMAL', HIGH: 'HIGH', URGENT: 'URGENT' };
      const priority = priorityMap[String(data.priority || 'NORMAL').toUpperCase()] || 'NORMAL';

      if (!jobId) {
        const [jobRes] = await connection.query(
          `INSERT INTO jobs (job_title, client_name, status, assigned_rider_id, assigned_vehicle_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [data.job_title, data.companyName || data.notes || null, jobStatus, riderId, data.vehicle_id || null]
        );
        jobId = jobRes.insertId;
      }

      const sql = `
        INSERT INTO job_assignments (job_id, job_title, assigned_to, branch_id, vehicle_id, status, priority, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      const [result] = await connection.query(sql, [
        jobId,
        data.job_title,
        targetUserId,
        data.branch_id || null,
        data.vehicle_id || null,
        jobStatus,
        priority,
        data.notes || ''
      ]);

      await connection.commit();
      return {
        assignment_id: result.insertId,
        job_id: jobId
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async updateJobStatus(assignmentOrJobId, status) {
    const statusMap = {
      ACTIVE: 'IN_PROGRESS',
      OPEN: 'PENDING',
      ASSIGNED: 'IN_PROGRESS',
      PENDING: 'PENDING',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      FAILED: 'CANCELLED',
      TERMINATED: 'CANCELLED'
    };
    const jobStatus = statusMap[String(status).toUpperCase()] || 'PENDING';

    await db.query(
      `UPDATE job_assignments SET status = ?, updated_at = NOW() WHERE assignment_id = ? OR job_id = ?`,
      [jobStatus, assignmentOrJobId, assignmentOrJobId]
    );

    await db.query(
      `UPDATE jobs SET status = ?, updated_at = NOW() WHERE job_id = ?`,
      [jobStatus, assignmentOrJobId]
    ).catch(() => {});

    return true;
  }
}

module.exports = SuperAdminExtensionRepository;

