const { validationResult } = require('express-validator');
const FleetService = require('../services/FleetService');
const { successResponse, errorResponse } = require('../../../src/utils/response');
const logger = require('../../../src/utils/logger');

class FleetController {
  // Get fleet dashboard
  async getFleetDashboard(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const city = req.query.city || null;

      const dashboard = await FleetService.getFleetDashboard(city);

      return successResponse(res, 200, 'Fleet dashboard retrieved successfully', dashboard);
    } catch (error) {
      logger.error('Get Fleet Dashboard Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get fleet live locations
  async getFleetLiveLocations(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        city: req.query.city,
        vehicleType: req.query.vehicleType,
        status: req.query.status
      };

      const locations = await FleetService.getFleetLiveLocations(filters);

      return successResponse(res, 200, 'Fleet live locations retrieved successfully', { vehicles: locations });
    } catch (error) {
      logger.error('Get Fleet Live Locations Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get fleet availability
  async getFleetAvailability(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        city: req.query.city,
        vehicleType: req.query.vehicleType
      };

      const availability = await FleetService.getFleetAvailability(filters);

      return successResponse(res, 200, 'Fleet availability retrieved successfully', { availability });
    } catch (error) {
      logger.error('Get Fleet Availability Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Get fleet statistics
  async getFleetStatistics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const filters = {
        period: req.query.period || 'month',
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        city: req.query.city
      };

      const statistics = await FleetService.getFleetStatistics(filters);

      return successResponse(res, 200, 'Fleet statistics retrieved successfully', statistics);
    } catch (error) {
      logger.error('Get Fleet Statistics Controller Error:', error);
      return errorResponse(res, 500, error.message);
    }
  }

  // Bulk assign riders to vehicles
  async bulkAssignRiders(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const { assignments } = req.body;
      const adminId = req.admin.admin_id;

      const results = await FleetService.bulkAssignRiders(assignments, adminId);

      return successResponse(res, 200, 'Bulk assignment completed', results);
    } catch (error) {
      logger.error('Bulk Assign Riders Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }

  // Bulk remove riders from vehicles
  async bulkRemoveRiders(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
      }

      const { vehicleIds, reason } = req.body;
      const adminId = req.admin.admin_id;

      const results = await FleetService.bulkRemoveRiders(vehicleIds, reason, adminId);

      return successResponse(res, 200, 'Bulk removal completed', results);
    } catch (error) {
      logger.error('Bulk Remove Riders Controller Error:', error);
      return errorResponse(res, 400, error.message);
    }
  }
}

module.exports = new FleetController();

