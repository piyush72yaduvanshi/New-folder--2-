const db = require('../../../src/config/db');

// Helper: returns true if the error is a missing-table error
function isMissingTable(err) {
  return err && err.message && err.message.includes("doesn't exist");
}

// Default empty pagination result for rentals
function emptyRentals(page, limit) {
  return { rentals: [], pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 } };
}

class RentalRepository {
  // Get connection helper for transaction orchestration
  async getConnection() {
    return await db.getConnection();
  }

  // ==================== PLAN QUERIES ====================

  async findPlanById(planId, conn = db) {
    const [rows] = await conn.query(
      'SELECT * FROM rental_plans WHERE plan_id = ?',
      [planId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findPlanByVehicleAndDuration(vehicleType, durationType, conn = db) {
    const [rows] = await conn.query(
      'SELECT * FROM rental_plans WHERE vehicle_type = ? AND duration_type = ? AND is_active = 1 LIMIT 1',
      [vehicleType, durationType]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // ==================== VEHICLE & USER QUERIES ====================

  async findVehicleById(vehicleId, conn = db) {
    const [rows] = await conn.query(
      'SELECT * FROM vehicles WHERE vehicle_id = ?',
      [vehicleId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async updateVehicleStatus(vehicleId, status, conn = db) {
    const [result] = await conn.query(
      'UPDATE vehicles SET status = ?, updated_at = NOW() WHERE vehicle_id = ?',
      [status, vehicleId]
    );
    return result.affectedRows > 0;
  }

  async findUserById(userId, conn = db) {
    const [rows] = await conn.query(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findBranchById(branchId, conn = db) {
    const [rows] = await conn.query(
      'SELECT * FROM branches WHERE branch_id = ?',
      [branchId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // ==================== RENTAL CORE QUERIES ====================

  async createRental(rentalData, conn = db) {
    const {
      user_id, vehicle_id,
      plan_id, rental_plan_id,
      pickup_branch_id, branch_id,
      status, payment_status,
      start_date, pickup_at,
      end_date, scheduled_return_at,
      base_amount, security_deposit,
      discount_amount, tax_amount, total_amount,
      pickup_otp
    } = rentalData;

    try {
      const [result] = await conn.query(
        `INSERT INTO rentals (
          user_id, vehicle_id, plan_id, pickup_branch_id,
          status, payment_status, start_date, end_date,
          base_amount, security_deposit, discount_amount, tax_amount, total_amount,
          pickup_otp, pickup_otp_expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW(), NOW())`,
        [
          user_id, vehicle_id,
          plan_id || rental_plan_id || null,
          pickup_branch_id || branch_id || null,
          status || 'CREATED',
          payment_status || 'PENDING',
          start_date || pickup_at,
          end_date || scheduled_return_at,
          base_amount || 0,
          security_deposit || 0,
          discount_amount || 0,
          tax_amount || 0,
          total_amount || 0,
          pickup_otp || null
        ]
      );
      return result.insertId;
    } catch (err) {
      if (isMissingTable(err)) throw new Error('Rental management is not yet available. Please run the rental migration (15_rental_management_tables.sql).');
      throw err;
    }
  }

  async findById(rentalId, conn = db) {
    try {
      const [rows] = await conn.query(
        `SELECT r.*,
                u.full_name as user_name, u.phone as user_phone, u.email as user_email,
                v.registration_number, v.model_name, v.vehicle_type, v.color,
                b.branch_name as pickup_branch_name,
                p.plan_name, p.price as plan_rate, p.duration_days as plan_duration_type
         FROM rentals r
         LEFT JOIN users u ON r.user_id = u.user_id
         LEFT JOIN vehicles v ON r.vehicle_id = v.vehicle_id
         LEFT JOIN branches b ON r.pickup_branch_id = b.branch_id
         LEFT JOIN rental_plans p ON r.plan_id = p.plan_id
         WHERE r.rental_id = ?`,
        [rentalId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      if (isMissingTable(err)) return null;
      throw err;
    }
  }

  async updateRental(rentalId, updateData, conn = db) {
    const validCols = new Set([
      'user_id', 'vehicle_id', 'plan_id', 'pickup_branch_id', 'status',
      'payment_status', 'start_date', 'end_date', 'base_amount',
      'security_deposit', 'discount_amount', 'tax_amount', 'total_amount'
    ]);

    const fields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (validCols.has(key)) {
        fields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    if (fields.length === 0) return true;
    params.push(rentalId);

    try {
      const [result] = await conn.query(
        `UPDATE rentals SET ${fields.join(', ')}, updated_at = NOW() WHERE rental_id = ?`,
        params
      );
      return result.affectedRows > 0;
    } catch (err) {
      if (isMissingTable(err)) return false;
      throw err;
    }
  }

  async getRentals(filters = {}, pagination = {}, conn = db) {
    const {
      search = '',
      status = null,
      branchId = null,
      vehicleId = null,
      userId = null,
      paymentStatus = null,
      startDate = null,
      endDate = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(u.full_name LIKE ? OR u.phone LIKE ? OR v.registration_number LIKE ? OR v.model_name LIKE ?)');
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }

    if (branchId) {
      conditions.push('r.pickup_branch_id = ?');
      params.push(branchId);
    }

    if (vehicleId) {
      conditions.push('r.vehicle_id = ?');
      params.push(vehicleId);
    }

    if (userId) {
      conditions.push('r.user_id = ?');
      params.push(userId);
    }

    if (paymentStatus) {
      conditions.push('r.payment_status = ?');
      params.push(paymentStatus);
    }

    if (startDate) {
      conditions.push('r.start_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('r.end_date <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Validate sort fields to prevent SQL injection
    const allowedSortFields = ['created_at', 'start_date', 'end_date', 'total_amount', 'rental_id'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Get count
    let total = 0;
    let rows = [];
    try {
      const [countResult] = await conn.query(
        `SELECT COUNT(*) as total FROM rentals r 
         LEFT JOIN users u ON r.user_id = u.user_id
         LEFT JOIN vehicles v ON r.vehicle_id = v.vehicle_id
         ${whereClause}`,
        params
      );
      total = countResult[0].total;

      [rows] = await conn.query(
        `SELECT r.*,
                u.full_name as user_name, u.phone as user_phone, u.email as user_email,
                v.registration_number, v.model_name, v.vehicle_type,
                b.branch_name as pickup_branch_name,
                p.plan_name
         FROM rentals r
         LEFT JOIN users u ON r.user_id = u.user_id
         LEFT JOIN vehicles v ON r.vehicle_id = v.vehicle_id
         LEFT JOIN branches b ON r.pickup_branch_id = b.branch_id
         LEFT JOIN rental_plans p ON r.plan_id = p.plan_id
         ${whereClause}
         ORDER BY r.${validSortBy} ${validSortOrder}
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
      );
    } catch (err) {
      if (!isMissingTable(err)) throw err;
      // rentals table not yet migrated — return empty
    }

    return {
      rentals: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // ==================== OVERDUE ENGINE ====================

  async findOverdueRentals(pagination = {}, conn = db) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    try {
      const [countResult] = await conn.query(
        `SELECT COUNT(*) as total FROM rentals 
         WHERE status IN ('ACTIVE', 'EXTENDED') AND end_date < NOW()`
      );
      const total = countResult[0].total;

      const [rows] = await conn.query(
        `SELECT r.*,
                u.full_name as user_name, u.phone as user_phone,
                v.registration_number, v.model_name, v.vehicle_type
         FROM rentals r
         LEFT JOIN users u ON r.user_id = u.user_id
         LEFT JOIN vehicles v ON r.vehicle_id = v.vehicle_id
         WHERE r.status IN ('ACTIVE', 'EXTENDED') AND r.end_date < NOW()
         ORDER BY r.end_date ASC
         LIMIT ? OFFSET ?`,
        [parseInt(limit), parseInt(offset)]
      );

      return {
        rentals: rows,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
      };
    } catch (err) {
      if (isMissingTable(err)) return emptyRentals(page, limit);
      throw err;
    }
  }

  async createExtension(extensionData, conn = db) {
    // rental_extensions table does not exist — no-op
    return null;
  }

  async checkFutureReservations(vehicleId, fromDate, toDate, conn = db) {
    try {
      const [rows] = await conn.query(
        `SELECT COUNT(*) as count FROM rentals 
         WHERE vehicle_id = ? 
           AND status IN ('CONFIRMED', 'RESERVED', 'READY_FOR_PICKUP', 'ACTIVE', 'EXTENDED')
           AND start_date < ? AND end_date > ?`,
        [vehicleId, toDate, fromDate]
      );
      return rows[0].count > 0;
    } catch (err) {
      if (isMissingTable(err)) return false;
      throw err;
    }
  }

  // ==================== SECURITY DEPOSIT (STUBBED) ====================

  async createSecurityDeposit(depositData, conn = db) { return null; }
  async findSecurityDepositByRentalId(rentalId, conn = db) { return null; }
  async updateSecurityDeposit(depositId, updateData, conn = db) { return false; }

  // ==================== INVOICE (STUBBED) ====================

  async createInvoice(invoiceData, conn = db) { return null; }
  async findInvoiceByRentalId(rentalId, conn = db) { return null; }

  // ==================== PAYMENT & REFUND (STUBBED) ====================

  async createPayment(paymentData, conn = db) { return null; }
  async getPaymentsByRentalId(rentalId, conn = db) { return []; }
  async createRefund(refundData, conn = db) { return null; }

  // ==================== PENALTY (STUBBED) ====================

  async createPenalty(penaltyData, conn = db) { return null; }
  async getPenaltiesByRentalId(rentalId, conn = db) { return []; }

  // ==================== DAMAGE REPORT (STUBBED) ====================

  async createDamageReport(reportData, conn = db) { return null; }
  async findDamageReportByRentalId(rentalId, conn = db) { return []; }

  // ==================== INSPECTION & CHECKLIST (STUBBED) ====================

  async createInspection(inspectionData, conn = db) { return null; }
  async createChecklist(checklistData, conn = db) { return null; }
  async createAgreement(agreementData, conn = db) { return null; }

  // ==================== LOGGING (STUBBED) ====================

  async logActivity(rentalId, action, description, performedByType, performedById, conn = db) {
    // rental_activity_logs table does not exist — no-op
  }

  async logStatusChange(rentalId, fromStatus, toStatus, changedByType, changedById, remarks = '', conn = db) {
    // rental_status_history table does not exist — no-op
  }

  async getTimeline(rentalId, conn = db) {
    // rental_status_history and rental_activity_logs tables do not exist
    return [];
  }
}

module.exports = new RentalRepository();

