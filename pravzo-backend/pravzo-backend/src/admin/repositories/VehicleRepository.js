'use strict';

const db = require('../../../src/config/db');

class VehicleRepository {
  // ==================== VEHICLE QUERIES ====================

  async findById(vehicleId) {
    const [rows] = await db.query(
      'SELECT * FROM vehicles WHERE vehicle_id = ? AND deleted_at IS NULL',
      [vehicleId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByRegistrationNumber(registrationNumber) {
    const [rows] = await db.query(
      'SELECT * FROM vehicles WHERE registration_number = ? AND deleted_at IS NULL',
      [registrationNumber]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getVehicles(filters = {}, pagination = {}) {
    const {
      search = '',
      vehicleType = null,
      fuelType = null,
      status = null,
      city = null,
      assignedRider = 'ALL',
      availability = null,
      minBattery = null,
      maxBattery = null,
      startDate = null,
      endDate = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    // SECURITY: Whitelist sortBy/sortOrder — interpolated directly into SQL ORDER BY
    const ALLOWED_SORT_FIELDS = new Set([
      'created_at', 'updated_at', 'registration_number', 'model_name', 'status',
      'battery_level', 'vehicle_type', 'assigned_city'
    ]);
    const ALLOWED_SORT_ORDERS = new Set(['ASC', 'DESC']);
    const safeSortBy    = ALLOWED_SORT_FIELDS.has(sortBy)     ? sortBy                       : 'created_at';
    const safeSortOrder = ALLOWED_SORT_ORDERS.has(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const {
      page = 1,
      limit = 20
    } = pagination;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    // Base condition
    conditions.push('v.deleted_at IS NULL');

    // Search
    if (search) {
      conditions.push('(v.registration_number LIKE ? OR v.model_name LIKE ? OR v.chassis_number LIKE ? OR v.engine_number LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Vehicle type filter
    if (vehicleType) {
      conditions.push('v.vehicle_type = ?');
      params.push(vehicleType);
    }

    // Fuel type filter
    if (fuelType) {
      conditions.push('v.fuel_type = ?');
      params.push(fuelType);
    }

    // Status filter
    if (status) {
      conditions.push('v.status = ?');
      params.push(status);
    }

    // City filter
    if (city) {
      conditions.push('(v.assigned_city = ? OR b.city = ?)');
      params.push(city, city);
    }

    // Assigned rider filter
    if (assignedRider === 'YES') {
      conditions.push('v.assigned_rider_id IS NOT NULL');
    } else if (assignedRider === 'NO') {
      conditions.push('v.assigned_rider_id IS NULL');
    }

    // Availability filter (from rider if assigned)
    if (availability && assignedRider !== 'NO') {
      conditions.push('r.availability = ?');
      params.push(availability);
    }

    // Battery filter
    if (minBattery !== null) {
      conditions.push('v.battery_level >= ?');
      params.push(minBattery);
    }

    if (maxBattery !== null) {
      conditions.push('v.battery_level <= ?');
      params.push(maxBattery);
    }

    // Date filter
    if (startDate) {
      conditions.push('v.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('v.created_at <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM vehicles v
      LEFT JOIN riders r ON v.assigned_rider_id = r.rider_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      ${whereClause}
    `;

    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // Main query with pagination
    const query = `
      SELECT 
        v.*,
        r.rider_id,
        r.rider_code,
        u.full_name AS rider_name,
        u.phone AS rider_phone,
        r.status AS rider_status,
        r.online_status AS rider_online_status,
        r.availability AS rider_availability,
        b.branch_name,
        b.city AS branch_city,
        (SELECT COUNT(*) FROM bookings bk WHERE bk.vehicle_id = v.vehicle_id AND bk.status = 'COMPLETED') AS total_trips,
        (SELECT COUNT(*) FROM bookings bk WHERE bk.vehicle_id = v.vehicle_id AND DATE(bk.created_at) = CURDATE() AND bk.status = 'COMPLETED') AS today_trips
      FROM vehicles v
      LEFT JOIN riders r ON v.assigned_rider_id = r.rider_id
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      ${whereClause}
      ORDER BY v.${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);

    return {
      vehicles: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  async getVehicleDetails(vehicleId) {
    const query = `
      SELECT 
        v.*,
        r.rider_id,
        r.rider_code,
        u.full_name AS rider_name,
        u.phone AS rider_phone,
        u.email AS rider_email,
        r.status AS rider_status,
        r.online_status AS rider_online_status,
        r.availability AS rider_availability,
        r.rating AS rider_rating,
        b.branch_name,
        b.city AS branch_city,
        (SELECT COUNT(*) FROM bookings bk WHERE bk.vehicle_id = v.vehicle_id AND bk.status = 'COMPLETED') AS total_trips,
        (SELECT COALESCE(SUM(total_amount), 0) FROM bookings bk WHERE bk.vehicle_id = v.vehicle_id AND bk.status = 'COMPLETED') AS total_revenue,
        (SELECT MAX(created_at) FROM bookings bk WHERE bk.vehicle_id = v.vehicle_id) AS last_trip_date,
        vl.latitude AS current_latitude,
        vl.longitude AS current_longitude,
        vl.updated_at AS location_updated_at
      FROM vehicles v
      LEFT JOIN riders r ON v.assigned_rider_id = r.rider_id
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      LEFT JOIN vehicle_locations vl ON v.vehicle_id = vl.vehicle_id
      WHERE v.vehicle_id = ? AND v.deleted_at IS NULL
    `;

    const [rows] = await db.query(query, [vehicleId]);
    return rows.length > 0 ? rows[0] : null;
  }

  async createVehicle(vehicleData) {
    const query = `
      INSERT INTO vehicles (
        vehicle_type, model_name, registration_number, color, year_of_manufacture,
        fuel_type, chassis_number, engine_number, battery_number,
        battery_percentage, battery_level, range_remaining_km, estimated_range_km, top_speed_kmh, battery_type,
        rc_number, rc_image_url, insurance_number, insurance_expiry_date, insurance_image_url,
        fitness_certificate_number, fitness_certificate_expiry_date, fitness_certificate_image_url,
        puc_number, puc_expiry_date, puc_image_url,
        owner_name, owner_phone, assigned_hub, assigned_city, assigned_zone, branch_id, price_per_week, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      vehicleData.vehicleType || vehicleData.vehicle_type || 'E_SCOOTER',
      vehicleData.modelName || vehicleData.model_name,
      vehicleData.registrationNumber || vehicleData.registration_number,
      vehicleData.color || null,
      vehicleData.yearOfManufacture || vehicleData.year_of_manufacture || null,
      vehicleData.fuelType || vehicleData.fuel_type || 'ELECTRIC',
      vehicleData.chassisNumber || vehicleData.chassis_number || null,
      vehicleData.engineNumber || vehicleData.engine_number || null,
      vehicleData.batteryNumber || vehicleData.battery_number || null,
      vehicleData.batteryPercentage || vehicleData.battery_percentage || 100,
      vehicleData.batteryLevel || vehicleData.battery_level || 100,
      vehicleData.rangeRemainingKm || vehicleData.range_remaining_km || 100,
      vehicleData.estimatedRangeKm || vehicleData.estimated_range_km || 100,
      vehicleData.topSpeedKmh || vehicleData.top_speed_kmh || 60,
      vehicleData.batteryType || vehicleData.battery_type || 'Exchangeable',
      vehicleData.rcNumber || vehicleData.rc_number || null,
      vehicleData.rcImageUrl || vehicleData.rc_image_url || null,
      vehicleData.insuranceNumber || vehicleData.insurance_number || null,
      vehicleData.insuranceExpiryDate || vehicleData.insurance_expiry_date || null,
      vehicleData.insuranceImageUrl || vehicleData.insurance_image_url || null,
      vehicleData.fitnessCertificateNumber || vehicleData.fitness_certificate_number || null,
      vehicleData.fitnessCertificateExpiryDate || vehicleData.fitness_certificate_expiry_date || null,
      vehicleData.fitnessCertificateImageUrl || vehicleData.fitness_certificate_image_url || null,
      vehicleData.pucNumber || vehicleData.puc_number || null,
      vehicleData.pucExpiryDate || vehicleData.puc_expiry_date || null,
      vehicleData.pucImageUrl || vehicleData.puc_image_url || null,
      vehicleData.ownerName || vehicleData.owner_name || null,
      vehicleData.ownerPhone || vehicleData.owner_phone || null,
      vehicleData.assignedHub || vehicleData.assigned_hub || null,
      vehicleData.assignedCity || vehicleData.assigned_city || null,
      vehicleData.assignedZone || vehicleData.assigned_zone || null,
      vehicleData.branchId || vehicleData.branch_id || null,
      vehicleData.pricePerWeek || vehicleData.price_per_week || 0.00,
      vehicleData.status || 'AVAILABLE'
    ];

    const [result] = await db.query(query, params);
    return result.insertId;
  }

  async updateVehicle(vehicleId, vehicleData) {
    const fields = [];
    const params = [];

    const fieldMap = {
      modelName: 'model_name',
      model_name: 'model_name',
      color: 'color',
      yearOfManufacture: 'year_of_manufacture',
      year_of_manufacture: 'year_of_manufacture',
      fuelType: 'fuel_type',
      fuel_type: 'fuel_type',
      vehicleType: 'vehicle_type',
      vehicle_type: 'vehicle_type',
      chassisNumber: 'chassis_number',
      chassis_number: 'chassis_number',
      engineNumber: 'engine_number',
      engine_number: 'engine_number',
      batteryNumber: 'battery_number',
      battery_number: 'battery_number',
      batteryPercentage: 'battery_percentage',
      battery_percentage: 'battery_percentage',
      batteryLevel: 'battery_level',
      battery_level: 'battery_level',
      rangeRemainingKm: 'range_remaining_km',
      range_remaining_km: 'range_remaining_km',
      estimatedRangeKm: 'estimated_range_km',
      estimated_range_km: 'estimated_range_km',
      topSpeedKmh: 'top_speed_kmh',
      top_speed_kmh: 'top_speed_kmh',
      batteryType: 'battery_type',
      battery_type: 'battery_type',
      rcNumber: 'rc_number',
      rc_number: 'rc_number',
      rcImageUrl: 'rc_image_url',
      rc_image_url: 'rc_image_url',
      insuranceNumber: 'insurance_number',
      insurance_number: 'insurance_number',
      insuranceExpiryDate: 'insurance_expiry_date',
      insurance_expiry_date: 'insurance_expiry_date',
      insuranceImageUrl: 'insurance_image_url',
      insurance_image_url: 'insurance_image_url',
      fitnessCertificateNumber: 'fitness_certificate_number',
      fitness_certificate_number: 'fitness_certificate_number',
      fitnessCertificateExpiryDate: 'fitness_certificate_expiry_date',
      fitness_certificate_expiry_date: 'fitness_certificate_expiry_date',
      fitnessCertificateImageUrl: 'fitness_certificate_image_url',
      fitness_certificate_image_url: 'fitness_certificate_image_url',
      pucNumber: 'puc_number',
      puc_number: 'puc_number',
      pucExpiryDate: 'puc_expiry_date',
      puc_expiry_date: 'puc_expiry_date',
      pucImageUrl: 'puc_image_url',
      puc_image_url: 'puc_image_url',
      ownerName: 'owner_name',
      owner_name: 'owner_name',
      ownerPhone: 'owner_phone',
      owner_phone: 'owner_phone',
      assignedHub: 'assigned_hub',
      assigned_hub: 'assigned_hub',
      assignedCity: 'assigned_city',
      assigned_city: 'assigned_city',
      assignedZone: 'assigned_zone',
      assigned_zone: 'assigned_zone',
      branchId: 'branch_id',
      branch_id: 'branch_id',
      pricePerWeek: 'price_per_week',
      price_per_week: 'price_per_week',
      status: 'status'
    };

    const seenCols = new Set();

    for (const [key, col] of Object.entries(fieldMap)) {
      if (vehicleData[key] !== undefined && !seenCols.has(col)) {
        fields.push(`${col} = ?`);
        params.push(vehicleData[key]);
        seenCols.add(col);
      }
    }

    if (fields.length === 0) {
      return 0;
    }

    fields.push('updated_at = NOW()');
    params.push(vehicleId);

    const query = `UPDATE vehicles SET ${fields.join(', ')} WHERE vehicle_id = ? AND deleted_at IS NULL`;
    const [result] = await db.query(query, params);
    return result.affectedRows;
  }

  async softDeleteVehicle(vehicleId) {
    const query = 'UPDATE vehicles SET deleted_at = NOW(), status = ? WHERE vehicle_id = ? AND deleted_at IS NULL';
    const [result] = await db.query(query, ['INACTIVE', vehicleId]);
    return result.affectedRows;
  }

  async updateVehicleStatus(vehicleId, status) {
    const query = 'UPDATE vehicles SET status = ?, updated_at = NOW() WHERE vehicle_id = ? AND deleted_at IS NULL';
    const [result] = await db.query(query, [status, vehicleId]);
    return result.affectedRows;
  }

  async blockVehicle(vehicleId, reason, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        'UPDATE vehicles SET status = ?, updated_at = NOW() WHERE vehicle_id = ? AND deleted_at IS NULL',
        ['BLOCKED', vehicleId]
      );

      await connection.query(
        'INSERT INTO vehicle_activities (vehicle_id, activity_type, description, performed_by, created_at) VALUES (?, ?, ?, ?, NOW())',
        [vehicleId, 'BLOCKED', `Vehicle blocked: ${reason}`, adminId]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async unblockVehicle(vehicleId, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        'UPDATE vehicles SET status = ?, updated_at = NOW() WHERE vehicle_id = ? AND deleted_at IS NULL',
        ['AVAILABLE', vehicleId]
      );

      await connection.query(
        'INSERT INTO vehicle_activities (vehicle_id, activity_type, description, performed_by, created_at) VALUES (?, ?, ?, ?, NOW())',
        [vehicleId, 'UNBLOCKED', 'Vehicle unblocked by admin', adminId]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async assignRider(vehicleId, riderId, reason, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Update vehicle
      await connection.query(
        'UPDATE vehicles SET assigned_rider_id = ?, status = "ASSIGNED", updated_at = NOW() WHERE vehicle_id = ? AND deleted_at IS NULL',
        [riderId, vehicleId]
      );

      // Update rider
      await connection.query(
        'UPDATE riders SET assigned_vehicle_id = ?, updated_at = NOW() WHERE rider_id = ? AND deleted_at IS NULL',
        [vehicleId, riderId]
      );

      // Log assignment history
      await connection.query(
        `INSERT INTO vehicle_assignments (vehicle_id, rider_id, assigned_by, assigned_at, status, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), 'ACTIVE', NOW(), NOW())`,
        [vehicleId, riderId, adminId]
      );

      // Log activity
      await connection.query(
        'INSERT INTO vehicle_activities (vehicle_id, activity_type, description, performed_by, created_at) VALUES (?, ?, ?, ?, NOW())',
        [vehicleId, 'RIDER_ASSIGNED', `Rider ${riderId} assigned. Reason: ${reason || 'N/A'}`, adminId]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async removeRider(vehicleId, riderId, reason, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Update assignment history
      await connection.query(
        `UPDATE vehicle_assignments 
         SET unassigned_at = NOW(), status = 'COMPLETED', updated_at = NOW() 
         WHERE vehicle_id = ? AND rider_id = ? AND status = 'ACTIVE'`,
        [vehicleId, riderId]
      );

      // Update vehicle
      await connection.query(
        'UPDATE vehicles SET assigned_rider_id = NULL, status = "AVAILABLE", updated_at = NOW() WHERE vehicle_id = ? AND deleted_at IS NULL',
        [vehicleId]
      );

      // Update rider
      await connection.query(
        'UPDATE riders SET assigned_vehicle_id = NULL, updated_at = NOW() WHERE rider_id = ? AND deleted_at IS NULL',
        [riderId]
      );

      // Log activity
      await connection.query(
        'INSERT INTO vehicle_activities (vehicle_id, activity_type, description, performed_by, created_at) VALUES (?, ?, ?, ?, NOW())',
        [vehicleId, 'RIDER_REMOVED', `Rider ${riderId} removed. Reason: ${reason || 'N/A'}`, adminId]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getAssignmentHistory(vehicleId) {
    const query = `
      SELECT 
        va.*,
        u.full_name AS rider_name,
        u.phone AS rider_phone,
        r.rider_code,
        a.full_name AS assigned_by_name
      FROM vehicle_assignments va
      LEFT JOIN riders r ON va.rider_id = r.rider_id
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN users a ON va.assigned_by = a.user_id
      WHERE va.vehicle_id = ?
      ORDER BY va.assigned_at DESC
      LIMIT 50
    `;

    const [rows] = await db.query(query, [vehicleId]);
    return rows;
  }

  async getMaintenanceHistory(vehicleId) {
    const query = `
      SELECT 
        vm.*,
        a.full_name AS performed_by_name
      FROM vehicle_maintenance vm
      LEFT JOIN users a ON vm.performed_by = a.user_id
      WHERE vm.vehicle_id = ?
      ORDER BY vm.created_at DESC
      LIMIT 50
    `;

    const [rows] = await db.query(query, [vehicleId]);
    return rows;
  }

  async getBookingHistory(vehicleId) {
    const query = `
      SELECT 
        b.booking_id AS trip_id,
        b.booking_id,
        b.user_id,
        b.rider_id,
        b.total_amount AS fare_amount,
        b.payment_status,
        b.status,
        b.created_at,
        b.updated_at AS completed_at,
        u.full_name AS customer_name,
        u.phone AS customer_phone,
        ru.full_name AS rider_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.user_id
      LEFT JOIN riders r ON b.rider_id = r.rider_id
      LEFT JOIN users ru ON r.user_id = ru.user_id
      WHERE b.vehicle_id = ?
      ORDER BY b.created_at DESC
      LIMIT 100
    `;

    const [rows] = await db.query(query, [vehicleId]);
    return rows;
  }

  async getActivityLog(vehicleId) {
    const query = `
      SELECT 
        va.*,
        a.full_name AS performed_by_name
      FROM vehicle_activities va
      LEFT JOIN users a ON va.performed_by = a.user_id
      WHERE va.vehicle_id = ?
      ORDER BY va.created_at DESC
      LIMIT 100
    `;

    const [rows] = await db.query(query, [vehicleId]);
    return rows;
  }

  async updateMaintenance(vehicleId, maintenanceData, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      if (maintenanceData.maintenanceType === 'STARTED' || maintenanceData.status === 'IN_PROGRESS') {
        await connection.query(
          `INSERT INTO vehicle_maintenance (vehicle_id, maintenance_type, description, cost, status, scheduled_date, performed_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'IN_PROGRESS', CURDATE(), ?, NOW(), NOW())`,
          [
            vehicleId,
            maintenanceData.maintenanceType || 'Regular Service',
            maintenanceData.remarks || maintenanceData.description || 'Maintenance in progress',
            maintenanceData.estimatedCost || maintenanceData.cost || 0.00,
            adminId
          ]
        );

        await connection.query(
          'UPDATE vehicles SET status = "MAINTENANCE", updated_at = NOW() WHERE vehicle_id = ? AND deleted_at IS NULL',
          [vehicleId]
        );

        await connection.query(
          'INSERT INTO vehicle_activities (vehicle_id, activity_type, description, performed_by, created_at) VALUES (?, ?, ?, ?, NOW())',
          [vehicleId, 'MAINTENANCE_STARTED', `Maintenance started. Cost: ₹${maintenanceData.estimatedCost || 0}. ${maintenanceData.remarks || ''}`, adminId]
        );
      } else {
        await connection.query(
          `UPDATE vehicle_maintenance 
           SET completed_date = CURDATE(), cost = ?, status = 'COMPLETED', updated_at = NOW() 
           WHERE vehicle_id = ? AND status IN ('SCHEDULED', 'IN_PROGRESS') 
           ORDER BY created_at DESC LIMIT 1`,
          [maintenanceData.actualCost || maintenanceData.cost || 0.00, vehicleId]
        );

        await connection.query(
          'UPDATE vehicles SET status = "AVAILABLE", last_service_date = CURDATE(), next_service_date = ?, updated_at = NOW() WHERE vehicle_id = ? AND deleted_at IS NULL',
          [maintenanceData.nextServiceDate || null, vehicleId]
        );

        await connection.query(
          'INSERT INTO vehicle_activities (vehicle_id, activity_type, description, performed_by, created_at) VALUES (?, ?, ?, ?, NOW())',
          [vehicleId, 'MAINTENANCE_COMPLETED', `Maintenance completed. Cost: ₹${maintenanceData.actualCost || 0}. ${maintenanceData.remarks || ''}`, adminId]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getVehicleStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'RENTED' THEN 1 ELSE 0 END) as on_trip,
        SUM(CASE WHEN status = 'BLOCKED' THEN 1 ELSE 0 END) as blocked,
        SUM(CASE WHEN status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance,
        SUM(CASE WHEN status = 'CHARGING' THEN 1 ELSE 0 END) as charging,
        SUM(CASE WHEN status = 'OFFLINE' THEN 1 ELSE 0 END) as offline,
        SUM(CASE WHEN assigned_rider_id IS NOT NULL THEN 1 ELSE 0 END) as assigned_riders,
        SUM(CASE WHEN assigned_rider_id IS NULL THEN 1 ELSE 0 END) as unassigned,
        ROUND(AVG(battery_level), 2) as avg_battery,
        SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as vehicles_added_30_days,
        SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as vehicles_added_7_days,
        SUM(CASE
          WHEN COALESCE(battery_level, 100) <= 20
           AND status NOT IN ('BLOCKED','MAINTENANCE','OFFLINE')
          THEN 1 ELSE 0 END) as low_battery,
        0 as sos_alerts
      FROM vehicles
      WHERE deleted_at IS NULL
    `;

    const [rows] = await db.query(query);
    return rows[0];
  }

  // ==================== BRANCH & LOCATION OPERATIONS ====================

  async assignVehicleToBranch(vehicleId, branchId, assignedBy) {
    await db.query(
      `UPDATE vehicles SET branch_id = ?, updated_at = NOW() WHERE vehicle_id = ?`,
      [branchId, vehicleId]
    );
    return vehicleId;
  }

  async transferVehicleBranch(vehicleId, fromBranchId, toBranchId, transferReason, transferredBy) {
    const [rentals] = await db.query(
      `SELECT COUNT(*) as c FROM bookings WHERE vehicle_id = ? AND status IN ('ACTIVE', 'ASSIGNED')`,
      [vehicleId]
    );
    if (rentals[0].c > 0) throw new Error('Cannot transfer vehicle with active booking');

    await db.query(
      `UPDATE vehicles SET branch_id = ?, updated_at = NOW() WHERE vehicle_id = ?`,
      [toBranchId, vehicleId]
    );
    return true;
  }

  async getVehicleBranchHistory(vehicleId) {
    return [];
  }

  async startMaintenance(vehicleId, data, adminId) {
    return await this.updateMaintenance(vehicleId, { ...data, maintenanceType: 'STARTED' }, adminId);
  }

  async completeMaintenance(vehicleId, maintenanceId, data, adminId) {
    return await this.updateMaintenance(vehicleId, { ...data, maintenanceType: 'COMPLETED' }, adminId);
  }

  async getMaintenanceHistoryEnterprise(vehicleId, limit = 50) {
    return await this.getMaintenanceHistory(vehicleId);
  }

  // ==================== VEHICLE LOCATION QUERIES ====================

  async updateVehicleLocation(vehicleId, latitude, longitude) {
    await db.query(
      `INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, updated_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude), updated_at = NOW()`,
      [vehicleId, latitude, longitude]
    );
    return true;
  }

  async getVehicleLocation(vehicleId) {
    const [rows] = await db.query(
      'SELECT * FROM vehicle_locations WHERE vehicle_id = ?',
      [vehicleId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // ==================== VEHICLE INSURANCE QUERIES ====================

  async getVehicleInsurance(vehicleId) {
    const [rows] = await db.query(
      'SELECT * FROM vehicle_insurance WHERE vehicle_id = ? ORDER BY created_at DESC',
      [vehicleId]
    );
    return rows;
  }

  async addVehicleInsurance(vehicleId, insuranceData) {
    const [result] = await db.query(
      `INSERT INTO vehicle_insurance (
        vehicle_id, policy_number, provider, start_date, expiry_date,
        premium_amount, coverage_details, document_url, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        vehicleId,
        insuranceData.policyNumber || insuranceData.policy_number,
        insuranceData.provider || null,
        insuranceData.startDate || insuranceData.start_date || null,
        insuranceData.expiryDate || insuranceData.expiry_date || null,
        insuranceData.premiumAmount || insuranceData.premium_amount || 0.00,
        insuranceData.coverageDetails || insuranceData.coverage_details || null,
        insuranceData.documentUrl || insuranceData.document_url || null,
        insuranceData.status || 'ACTIVE'
      ]
    );
    return result.insertId;
  }

  // ==================== STUBBED EXTENSIONS ====================

  async addVehicleDocument(vehicleId, docData, adminId) { return null; }
  async getVehicleDocuments(vehicleId) { return []; }
  async deleteVehicleDocument(vehicleId, documentId, adminId) { return false; }
  async getInspectionHistory(vehicleId, limit = 20) { return []; }
  async addInspection(vehicleId, data, adminId) { return null; }
  async getLocationHistory(vehicleId, limit = 100) { return []; }
  async getVehicleExpenses(vehicleId, filters = {}) { return []; }
  async addVehicleExpense(vehicleId, data, adminId) { return null; }
  async getEnterpriseActivityLog(vehicleId, filters = {}) { return await this.getActivityLog(vehicleId); }
  async logActivity(vehicleId, activityType, description, adminId) {
    await db.query(
      'INSERT INTO vehicle_activities (vehicle_id, activity_type, description, performed_by, created_at) VALUES (?, ?, ?, ?, NOW())',
      [vehicleId, activityType, description, adminId]
    );
  }
  async getServiceHistory(vehicleId) {
    const [rows] = await db.query(
      `SELECT vm.*, a.full_name as performed_by_name
       FROM vehicle_maintenance vm 
       LEFT JOIN users a ON vm.performed_by = a.user_id
       WHERE vm.vehicle_id = ? AND vm.status = 'COMPLETED' 
       ORDER BY vm.completed_date DESC LIMIT 50`,
      [vehicleId]
    );
    return rows;
  }
}

module.exports = new VehicleRepository();
