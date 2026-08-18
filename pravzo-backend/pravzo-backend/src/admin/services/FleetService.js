const FleetRepository = require('../repositories/FleetRepository');
const logger = require('../../../src/utils/logger');

class FleetService {
  // Get fleet dashboard
  async getFleetDashboard(city = null) {
    try {
      const dashboard = await FleetRepository.getFleetDashboard(city);

      return {
        summary: {
          totalVehicles: dashboard.total_vehicles || 0,
          available: dashboard.available || 0,
          busy: dashboard.busy || 0,
          offline: dashboard.offline || 0,
          maintenance: dashboard.maintenance || 0,
          charging: dashboard.charging || 0,
          blocked: dashboard.blocked || 0
        },
        riders: {
          assigned: dashboard.assigned || 0,
          unassigned: dashboard.unassigned || 0,
          online: dashboard.online_riders || 0,
          available: dashboard.available_riders || 0
        },
        fleet: {
          avgBattery: parseFloat(dashboard.avg_battery || 0),
          lowBatteryVehicles: dashboard.low_battery_vehicles || 0
        }
      };
    } catch (error) {
      logger.error('FleetService - Get Fleet Dashboard Error:', error);
      throw new Error('Failed to fetch fleet dashboard');
    }
  }

  // Get fleet live locations
  async getFleetLiveLocations(filters) {
    try {
      const locations = await FleetRepository.getFleetLiveLocations(filters);

      return locations.map(loc => ({
        vehicle: {
          vehicleId: loc.vehicle_id,
          registrationNumber: loc.registration_number,
          vehicleType: loc.vehicle_type,
          modelName: loc.model_name,
          status: loc.status,
          battery: loc.battery,
          assignedCity: loc.assigned_city
        },
        rider: {
          riderId: loc.rider_id,
          riderName: loc.rider_name,
          riderPhone: loc.rider_phone,
          onlineStatus: loc.online_status,
          availability: loc.availability
        },
        location: loc.latitude && loc.longitude ? {
          latitude: parseFloat(loc.latitude),
          longitude: parseFloat(loc.longitude),
          speed: parseFloat(loc.speed || 0),
          heading: parseFloat(loc.heading || 0),
          battery: loc.rider_battery,
          updatedAt: loc.location_updated_at
        } : null,
        currentTripId: loc.current_trip_id
      }));
    } catch (error) {
      logger.error('FleetService - Get Fleet Live Locations Error:', error);
      throw new Error('Failed to fetch fleet live locations');
    }
  }

  // Get fleet availability
  async getFleetAvailability(filters) {
    try {
      const availability = await FleetRepository.getFleetAvailability(filters);

      return availability.map(item => ({
        vehicleType: item.vehicle_type,
        total: item.total || 0,
        available: item.available || 0,
        busy: item.busy || 0,
        offline: item.offline || 0,
        maintenance: item.maintenance || 0,
        charging: item.charging || 0,
        blocked: item.blocked || 0,
        availabilityRate: item.total > 0 
          ? parseFloat(((item.available / item.total) * 100).toFixed(2)) 
          : 0
      }));
    } catch (error) {
      logger.error('FleetService - Get Fleet Availability Error:', error);
      throw new Error('Failed to fetch fleet availability');
    }
  }

  // Get fleet statistics
  async getFleetStatistics(filters) {
    try {
      // Process date range
      const dateRange = this.getDateRange(filters.period, filters.startDate, filters.endDate);
      const statsFilters = {
        ...filters,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };

      const stats = await FleetRepository.getFleetStatistics(statsFilters);

      return {
        summary: {
          totalVehicles: stats.summary.total_vehicles || 0,
          vehiclesInUse: stats.summary.vehicles_in_use || 0,
          utilizationRate: parseFloat(stats.summary.utilization_rate || 0),
          totalTrips: stats.summary.total_trips || 0,
          avgDistance: parseFloat(stats.summary.avg_distance || 0),
          avgDuration: parseFloat(stats.summary.avg_duration || 0),
          totalDistance: parseFloat(stats.summary.total_distance || 0),
          totalDuration: stats.summary.total_duration || 0
        },
        peakHours: stats.peakHours.map(ph => ({
          hour: ph.hour,
          timeRange: `${ph.hour}:00 - ${ph.hour}:59`,
          tripCount: ph.trip_count || 0
        })),
        topVehicles: stats.topVehicles.map(v => ({
          vehicleId: v.vehicle_id,
          registrationNumber: v.registration_number,
          vehicleType: v.vehicle_type,
          modelName: v.model_name,
          totalTrips: v.total_trips || 0,
          totalDistance: parseFloat(v.total_distance || 0),
          totalRevenue: parseFloat(v.total_revenue || 0),
          riderName: v.rider_name
        })),
        topCities: stats.topCities.map(c => ({
          city: c.assigned_city,
          totalVehicles: c.total_vehicles || 0,
          totalTrips: c.total_trips || 0,
          totalDistance: parseFloat(c.total_distance || 0)
        })),
        period: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          period: filters.period || 'custom'
        }
      };
    } catch (error) {
      logger.error('FleetService - Get Fleet Statistics Error:', error);
      throw new Error('Failed to fetch fleet statistics');
    }
  }

  // Bulk assign riders to vehicles
  async bulkAssignRiders(assignments, adminId) {
    try {
      if (!Array.isArray(assignments) || assignments.length === 0) {
        throw new Error('Assignments array is required');
      }

      if (assignments.length > 50) {
        throw new Error('Maximum 50 assignments allowed per request');
      }

      const results = await FleetRepository.bulkAssignRiders(assignments, adminId);

      return {
        total: assignments.length,
        successful: results.successful.length,
        failed: results.failed.length,
        successfulAssignments: results.successful,
        failedAssignments: results.failed
      };
    } catch (error) {
      logger.error('FleetService - Bulk Assign Riders Error:', error);
      throw error;
    }
  }

  // Bulk remove riders from vehicles
  async bulkRemoveRiders(vehicleIds, reason, adminId) {
    try {
      if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
        throw new Error('Vehicle IDs array is required');
      }

      if (vehicleIds.length > 50) {
        throw new Error('Maximum 50 vehicles allowed per request');
      }

      const results = await FleetRepository.bulkRemoveRiders(vehicleIds, reason, adminId);

      return {
        total: vehicleIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        successfulRemovals: results.successful,
        failedRemovals: results.failed
      };
    } catch (error) {
      logger.error('FleetService - Bulk Remove Riders Error:', error);
      throw error;
    }
  }

  // Helper: Get date range based on period
  getDateRange(period, startDate, endDate) {
    const now = new Date();
    let start, end;

    switch (period) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;

      case 'week':
        start = new Date(now.setDate(now.getDate() - 7));
        end = new Date();
        break;

      case 'month':
        start = new Date(now.setMonth(now.getMonth() - 1));
        end = new Date();
        break;

      case 'year':
        start = new Date(now.setFullYear(now.getFullYear() - 1));
        end = new Date();
        break;

      case 'custom':
        if (!startDate || !endDate) {
          throw new Error('Start date and end date are required for custom period');
        }
        start = new Date(startDate);
        end = new Date(endDate);
        break;

      default:
        // Default to last 30 days
        start = new Date(now.setDate(now.getDate() - 30));
        end = new Date();
    }

    return {
      startDate: start.toISOString().split('T')[0] + ' 00:00:00',
      endDate: end.toISOString().split('T')[0] + ' 23:59:59'
    };
  }
}

module.exports = new FleetService();

