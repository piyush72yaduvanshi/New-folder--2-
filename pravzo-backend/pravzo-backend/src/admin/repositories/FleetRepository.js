'use strict';

const db = require('../../../src/config/db');

class FleetRepository {
  // ==================== FLEET QUERIES ====================

  async getFleetDashboard(city = null) {
    const cityCondition = city ? 'AND (v.assigned_city = ? OR b.city = ?)' : '';
    const params = city ? [city, city] : [];

    const query = `
      SELECT 
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN v.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN v.status = 'RENTED' THEN 1 ELSE 0 END) as busy,
        SUM(CASE WHEN v.status = 'OFFLINE' THEN 1 ELSE 0 END) as offline,
        SUM(CASE WHEN v.status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance,
        SUM(CASE WHEN v.status = 'CHARGING' THEN 1 ELSE 0 END) as charging,
        SUM(CASE WHEN v.status = 'BLOCKED' THEN 1 ELSE 0 END) as blocked,
        SUM(CASE WHEN v.assigned_rider_id IS NOT NULL THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN v.assigned_rider_id IS NULL THEN 1 ELSE 0 END) as unassigned,
        SUM(CASE WHEN r.online_status = 'ONLINE' THEN 1 ELSE 0 END) as online_riders,
        SUM(CASE WHEN r.availability = 'AVAILABLE' THEN 1 ELSE 0 END) as available_riders,
        ROUND(AVG(v.battery_level), 2) as avg_battery,
        SUM(CASE WHEN v.battery_level < 20 THEN 1 ELSE 0 END) as low_battery_vehicles
      FROM vehicles v
      LEFT JOIN riders r ON v.assigned_rider_id = r.rider_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      WHERE v.deleted_at IS NULL ${cityCondition}
    `;

    const [rows] = await db.query(query, params);
    return rows[0];
  }

  async getFleetLiveLocations(filters = {}) {
    const { city = null, vehicleType = null, status = null } = filters;
    const conditions = ['v.deleted_at IS NULL'];
    const params = [];

    if (city) {
      conditions.push('(v.assigned_city = ? OR b.city = ?)');
      params.push(city, city);
    }

    if (vehicleType) {
      conditions.push('v.vehicle_type = ?');
      params.push(vehicleType);
    }

    if (status) {
      conditions.push('v.status = ?');
      params.push(status);
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT 
        v.vehicle_id,
        v.registration_number,
        v.vehicle_type,
        v.model_name,
        v.status,
        v.battery_level,
        v.assigned_city,
        b.branch_name,
        r.rider_id,
        r.rider_code,
        u.full_name AS rider_name,
        u.phone AS rider_phone,
        r.online_status,
        r.availability,
        vl.latitude,
        vl.longitude,
        vl.updated_at AS location_updated_at,
        (SELECT bk.booking_id FROM bookings bk WHERE bk.vehicle_id = v.vehicle_id AND bk.status = 'ACTIVE' ORDER BY bk.created_at DESC LIMIT 1) AS current_trip_id
      FROM vehicles v
      LEFT JOIN riders r ON v.assigned_rider_id = r.rider_id
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      LEFT JOIN vehicle_locations vl ON v.vehicle_id = vl.vehicle_id
      WHERE ${whereClause}
      ORDER BY r.online_status DESC, r.availability ASC
    `;

    const [rows] = await db.query(query, params);
    return rows;
  }

  async getFleetAvailability(filters = {}) {
    const { city = null, vehicleType = null } = filters;
    const conditions = ['v.deleted_at IS NULL'];
    const params = [];

    if (city) {
      conditions.push('(v.assigned_city = ? OR b.city = ?)');
      params.push(city, city);
    }

    if (vehicleType) {
      conditions.push('v.vehicle_type = ?');
      params.push(vehicleType);
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT 
        v.vehicle_type,
        COUNT(*) as total,
        SUM(CASE WHEN v.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN v.status = 'RENTED' THEN 1 ELSE 0 END) as busy,
        SUM(CASE WHEN v.status = 'OFFLINE' OR v.assigned_rider_id IS NULL THEN 1 ELSE 0 END) as offline,
        SUM(CASE WHEN v.status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance,
        SUM(CASE WHEN v.status = 'CHARGING' THEN 1 ELSE 0 END) as charging,
        SUM(CASE WHEN v.status = 'BLOCKED' THEN 1 ELSE 0 END) as blocked
      FROM vehicles v
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      WHERE ${whereClause}
      GROUP BY v.vehicle_type
      ORDER BY total DESC
    `;

    const [rows] = await db.query(query, params);
    return rows;
  }

  async getFleetStatistics(filters = {}) {
    const { startDate = null, endDate = null, city = null } = filters;
    const conditions = ['v.deleted_at IS NULL'];
    const params = [];

    if (city) {
      conditions.push('(v.assigned_city = ? OR b.city = ?)');
      params.push(city, city);
    }

    const whereClause = conditions.join(' AND ');

    const bookingDateConditions = [];
    const bookingParams = [];

    if (startDate) {
      bookingDateConditions.push('bk.created_at >= ?');
      bookingParams.push(startDate);
    }

    if (endDate) {
      bookingDateConditions.push('bk.created_at <= ?');
      bookingParams.push(endDate);
    }

    const bookingWhereClause = bookingDateConditions.length > 0 ? `AND ${bookingDateConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COUNT(DISTINCT v.vehicle_id) as total_vehicles,
        COUNT(DISTINCT CASE WHEN v.assigned_rider_id IS NOT NULL THEN v.vehicle_id END) as vehicles_in_use,
        ROUND(COUNT(DISTINCT CASE WHEN v.assigned_rider_id IS NOT NULL THEN v.vehicle_id END) * 100.0 / NULLIF(COUNT(DISTINCT v.vehicle_id), 0), 2) as utilization_rate,
        COUNT(DISTINCT bk.booking_id) as total_trips,
        ROUND(AVG(bk.total_amount), 2) as avg_booking_amount,
        ROUND(SUM(bk.total_amount), 2) as total_revenue
      FROM vehicles v
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      LEFT JOIN bookings bk ON v.vehicle_id = bk.vehicle_id AND bk.status = 'COMPLETED' ${bookingWhereClause}
      WHERE ${whereClause}
    `;

    const allParams = [...params, ...bookingParams];
    const [rows] = await db.query(query, allParams);

    // Get top performing vehicles
    const topVehiclesQuery = `
      SELECT 
        v.vehicle_id,
        v.registration_number,
        v.vehicle_type,
        v.model_name,
        COUNT(bk.booking_id) as total_trips,
        ROUND(SUM(bk.total_amount), 2) as total_revenue,
        u.full_name as rider_name
      FROM vehicles v
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      LEFT JOIN riders r ON v.assigned_rider_id = r.rider_id
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN bookings bk ON v.vehicle_id = bk.vehicle_id AND bk.status = 'COMPLETED' ${bookingWhereClause}
      WHERE ${whereClause}
      GROUP BY v.vehicle_id, u.full_name
      ORDER BY total_trips DESC
      LIMIT 10
    `;

    const [topVehicles] = await db.query(topVehiclesQuery, allParams);

    // Get top cities
    const topCitiesQuery = `
      SELECT 
        COALESCE(v.assigned_city, b.city, 'Unknown') as assigned_city,
        COUNT(DISTINCT v.vehicle_id) as total_vehicles,
        COUNT(bk.booking_id) as total_trips,
        ROUND(SUM(bk.total_amount), 2) as total_revenue
      FROM vehicles v
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      LEFT JOIN bookings bk ON v.vehicle_id = bk.vehicle_id AND bk.status = 'COMPLETED' ${bookingWhereClause}
      WHERE v.deleted_at IS NULL
      GROUP BY COALESCE(v.assigned_city, b.city, 'Unknown')
      ORDER BY total_trips DESC
      LIMIT 10
    `;

    const [topCities] = await db.query(topCitiesQuery, bookingParams);

    return {
      summary: rows[0] || {},
      peakHours: [],
      topVehicles,
      topCities
    };
  }

  async bulkAssignRiders(assignments, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const results = {
        successful: [],
        failed: []
      };

      for (const assignment of assignments) {
        const { vehicleId, riderId } = assignment;

        try {
          const [vehicle] = await connection.query(
            'SELECT vehicle_id, status, assigned_rider_id FROM vehicles WHERE vehicle_id = ? AND deleted_at IS NULL',
            [vehicleId]
          );

          if (vehicle.length === 0) {
            results.failed.push({ vehicleId, riderId, reason: 'Vehicle not found' });
            continue;
          }

          if (vehicle[0].assigned_rider_id !== null) {
            results.failed.push({ vehicleId, riderId, reason: 'Vehicle already assigned to another rider' });
            continue;
          }

          const [rider] = await connection.query(
            'SELECT rider_id, status, assigned_vehicle_id FROM riders WHERE rider_id = ? AND deleted_at IS NULL',
            [riderId]
          );

          if (rider.length === 0) {
            results.failed.push({ vehicleId, riderId, reason: 'Rider not found' });
            continue;
          }

          if (rider[0].assigned_vehicle_id !== null) {
            results.failed.push({ vehicleId, riderId, reason: 'Rider already assigned to another vehicle' });
            continue;
          }

          if (rider[0].status !== 'ACTIVE') {
            results.failed.push({ vehicleId, riderId, reason: 'Rider is not active' });
            continue;
          }

          await connection.query(
            'UPDATE vehicles SET assigned_rider_id = ?, status = "ASSIGNED", updated_at = NOW() WHERE vehicle_id = ?',
            [riderId, vehicleId]
          );

          await connection.query(
            'UPDATE riders SET assigned_vehicle_id = ?, updated_at = NOW() WHERE rider_id = ?',
            [vehicleId, riderId]
          );

          await connection.query(
            `INSERT INTO vehicle_assignments (vehicle_id, rider_id, assigned_by, assigned_at, status, created_at, updated_at)
             VALUES (?, ?, ?, NOW(), 'ACTIVE', NOW(), NOW())`,
            [vehicleId, riderId, adminId]
          );

          await connection.query(
            'INSERT INTO vehicle_activities (vehicle_id, activity_type, description, performed_by, created_at) VALUES (?, ?, ?, ?, NOW())',
            [vehicleId, 'RIDER_ASSIGNED', `Rider ${riderId} assigned via bulk operation`, adminId]
          );

          results.successful.push({ vehicleId, riderId });
        } catch (error) {
          results.failed.push({ vehicleId, riderId, reason: error.message });
        }
      }

      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async bulkRemoveRiders(vehicleIds, reason, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const results = {
        successful: [],
        failed: []
      };

      for (const vehicleId of vehicleIds) {
        try {
          const [vehicle] = await connection.query(
            'SELECT vehicle_id, assigned_rider_id FROM vehicles WHERE vehicle_id = ? AND deleted_at IS NULL',
            [vehicleId]
          );

          if (vehicle.length === 0) {
            results.failed.push({ vehicleId, reason: 'Vehicle not found' });
            continue;
          }

          const riderId = vehicle[0].assigned_rider_id;

          if (riderId === null) {
            results.failed.push({ vehicleId, reason: 'No rider assigned' });
            continue;
          }

          await connection.query(
            `UPDATE vehicle_assignments 
             SET unassigned_at = NOW(), status = 'COMPLETED', updated_at = NOW() 
             WHERE vehicle_id = ? AND rider_id = ? AND status = 'ACTIVE'`,
            [vehicleId, riderId]
          );

          await connection.query(
            'UPDATE vehicles SET assigned_rider_id = NULL, status = "AVAILABLE", updated_at = NOW() WHERE vehicle_id = ?',
            [vehicleId]
          );

          await connection.query(
            'UPDATE riders SET assigned_vehicle_id = NULL, updated_at = NOW() WHERE rider_id = ?',
            [riderId]
          );

          await connection.query(
            'INSERT INTO vehicle_activities (vehicle_id, activity_type, description, performed_by, created_at) VALUES (?, ?, ?, ?, NOW())',
            [vehicleId, 'RIDER_REMOVED', `Rider ${riderId} removed via bulk operation. ${reason || ''}`, adminId]
          );

          results.successful.push({ vehicleId, riderId });
        } catch (error) {
          results.failed.push({ vehicleId, reason: error.message });
        }
      }

      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new FleetRepository();
