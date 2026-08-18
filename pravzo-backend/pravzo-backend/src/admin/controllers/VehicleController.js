const { validationResult } = require('express-validator');
const VehicleService = require('../services/VehicleService');
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../../../src/utils/responseWrapper');
const DTO = require('../../../src/utils/dtoMapper');
const logger = require('../../../src/utils/logger');
const { exportToFile, validateExportFormat } = require('../../../src/utils/exportHelper');
const { sanitizePagination } = require('../../../src/utils/helpers');

class VehicleController {
  // Get paginated vehicles list
  async getVehicles(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const filters = {
        search: req.query.search,
        vehicleType: req.query.vehicleType,
        fuelType: req.query.fuelType,
        status: req.query.status,
        city: req.query.city,
        assignedRider: req.query.assignedRider || 'ALL',
        availability: req.query.availability,
        minBattery: req.query.minBattery,
        maxBattery: req.query.maxBattery,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const pagination = sanitizePagination(req.query.page, req.query.limit);

      const result = await VehicleService.getVehicles(filters, pagination);

      return sendSuccess(res, 200, 'Vehicles retrieved successfully',
        DTO.toVehicleList(result),
        { req, pagination: result.pagination }
      );
    } catch (error) {
      logger.error('Get Vehicles Controller Error:', error);
      return sendError(res, 500, error.message, 'VEHICLES_FETCH_FAILED', null, req);
    }
  }

  // Get vehicle by ID
  async getVehicleById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array(), req);
      }

      const vehicleId = parseInt(req.params.id);
      const vehicle = await VehicleService.getVehicleById(vehicleId);

      return sendSuccess(res, 200, 'Vehicle details retrieved successfully', DTO.toVehicle(vehicle), { req });
    } catch (error) {
      logger.error('Get Vehicle By ID Controller Error:', error);
      if (error.message === 'Vehicle not found') return sendNotFound(res, 'Vehicle', req);
      return sendError(res, 500, error.message, 'VEHICLE_FETCH_FAILED', null, req);
    }
  }

  // Create new vehicle
  async createVehicle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 400, 'Validation failed', errors.array());
      }

      const vehicleData = {
        vehicleType: req.body.vehicleType,
        modelName: req.body.modelName,
        registrationNumber: req.body.registrationNumber,
        color: req.body.color,
        yearOfManufacture: req.body.yearOfManufacture,
        fuelType: req.body.fuelType,
        chassisNumber: req.body.chassisNumber,
        engineNumber: req.body.engineNumber,
        rcNumber: req.body.rcNumber,
        rcImageUrl: req.body.rcImageUrl,
        insuranceNumber: req.body.insuranceNumber,
        insuranceExpiryDate: req.body.insuranceExpiryDate,
        insuranceImageUrl: req.body.insuranceImageUrl,
        fitnessCertificateNumber: req.body.fitnessCertificateNumber,
        fitnessCertificateExpiryDate: req.body.fitnessCertificateExpiryDate,
        fitnessCertificateImageUrl: req.body.fitnessCertificateImageUrl,
        pucNumber: req.body.pucNumber,
        pucExpiryDate: req.body.pucExpiryDate,
        pucImageUrl: req.body.pucImageUrl,
        ownerName: req.body.ownerName,
        ownerPhone: req.body.ownerPhone,
        assignedCity: req.body.assignedCity
      };

      const result = await VehicleService.createVehicle(vehicleData);

      return sendSuccess(res, 201, 'Vehicle registered successfully', result);
    } catch (error) {
      logger.error('Create Vehicle Controller Error:', error);
      return sendError(res, 400, error.message);
    }
  }

  // Update vehicle
  async updateVehicle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 400, 'Validation failed', errors.array());
      }

      const vehicleId = parseInt(req.params.id);
      const vehicleData = req.body;

      await VehicleService.updateVehicle(vehicleId, vehicleData);

      return sendSuccess(res, 200, 'Vehicle updated successfully');
    } catch (error) {
      logger.error('Update Vehicle Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 400, error.message);
    }
  }

  // Delete vehicle
  async deleteVehicle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 400, 'Validation failed', errors.array());
      }

      const vehicleId = parseInt(req.params.id);

      await VehicleService.deleteVehicle(vehicleId);

      return sendSuccess(res, 200, 'Vehicle deleted successfully');
    } catch (error) {
      logger.error('Delete Vehicle Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 400, error.message);
    }
  }

  // Update vehicle status
  async updateVehicleStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 400, 'Validation failed', errors.array());
      }

      const vehicleId = parseInt(req.params.id);
      const { status } = req.body;

      await VehicleService.updateVehicleStatus(vehicleId, status);

      return sendSuccess(res, 200, 'Vehicle status updated successfully');
    } catch (error) {
      logger.error('Update Vehicle Status Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 400, error.message);
    }
  }

  // Update maintenance
  async updateMaintenance(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 400, 'Validation failed', errors.array());
      }

      const vehicleId = parseInt(req.params.id);
      const maintenanceData = {
        maintenanceType: req.body.maintenanceType,
        estimatedCost: req.body.estimatedCost,
        actualCost: req.body.actualCost,
        remarks: req.body.remarks,
        nextServiceDate: req.body.nextServiceDate
      };
      const adminId = req.admin.admin_id;

      await VehicleService.updateMaintenance(vehicleId, maintenanceData, adminId);

      const message = maintenanceData.maintenanceType === 'STARTED' 
        ? 'Maintenance started successfully' 
        : 'Maintenance completed successfully';

      return sendSuccess(res, 200, message);
    } catch (error) {
      logger.error('Update Maintenance Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 400, error.message);
    }
  }

  // Block vehicle
  async blockVehicle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 400, 'Validation failed', errors.array());
      }

      const vehicleId = parseInt(req.params.id);
      const { reason } = req.body;
      const adminId = req.admin.admin_id;

      await VehicleService.blockVehicle(vehicleId, reason, adminId);

      return sendSuccess(res, 200, 'Vehicle blocked successfully');
    } catch (error) {
      logger.error('Block Vehicle Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 400, error.message);
    }
  }

  // Unblock vehicle
  async unblockVehicle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 400, 'Validation failed', errors.array());
      }

      const vehicleId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;

      await VehicleService.unblockVehicle(vehicleId, adminId);

      return sendSuccess(res, 200, 'Vehicle unblocked successfully');
    } catch (error) {
      logger.error('Unblock Vehicle Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 400, error.message);
    }
  }

  // Assign rider to vehicle
  async assignRider(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 400, 'Validation failed', errors.array());
      }

      const vehicleId = parseInt(req.params.id);
      const { riderId, reason } = req.body;
      const adminId = req.admin.admin_id;

      await VehicleService.assignRider(vehicleId, riderId, reason, adminId);

      return sendSuccess(res, 200, 'Rider assigned successfully');
    } catch (error) {
      logger.error('Assign Rider Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 400, error.message);
    }
  }

  // Remove rider from vehicle
  async removeRider(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 400, 'Validation failed', errors.array());
      }

      const vehicleId = parseInt(req.params.id);
      const { reason } = req.body;
      const adminId = req.admin.admin_id;

      await VehicleService.removeRider(vehicleId, reason, adminId);

      return sendSuccess(res, 200, 'Rider removed successfully');
    } catch (error) {
      logger.error('Remove Rider Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 400, error.message);
    }
  }

  // Get vehicle history
  async getVehicleHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 400, 'Validation failed', errors.array());
      }

      const vehicleId = parseInt(req.params.id);

      const history = await VehicleService.getVehicleHistory(vehicleId);

      return sendSuccess(res, 200, 'Vehicle history retrieved successfully', history);
    } catch (error) {
      logger.error('Get Vehicle History Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 500, error.message);
    }
  }

  // Get vehicle statistics
  async getVehicleStatistics(req, res) {
    try {
      const statistics = await VehicleService.getVehicleStatistics();
      // Apply fleet stats DTO — maps raw DB stat fields to frontend Fleet Overview card shape
      return sendSuccess(res, 200, 'Vehicle statistics retrieved successfully', DTO.toFleetStats(statistics));
    } catch (error) {
      logger.error('Get Vehicle Statistics Controller Error:', error);
      return sendError(res, 500, error.message);
    }
  }

  // Export vehicles
  async exportVehicles(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 400, 'Validation failed', errors.array());
      }

      const { valid, fmt, error: fmtError } = validateExportFormat(req.query.format);
      if (!valid) {
        return sendError(res, 400, fmtError, 'INVALID_EXPORT_FORMAT', null, req);
      }

      const filters = {
        search: req.query.search,
        vehicleType: req.query.vehicleType,
        fuelType: req.query.fuelType,
        status: req.query.status,
        city: req.query.city,
        assignedRider: req.query.assignedRider || 'ALL',
        availability: req.query.availability,
        minBattery: req.query.minBattery,
        maxBattery: req.query.maxBattery,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const pagination = {
        page: 1,
        limit: 10000 // Export all vehicles
      };

      const result = await VehicleService.getVehicles(filters, pagination);

      if (!result.vehicles || result.vehicles.length === 0) {
        return sendError(res, 404, 'No vehicles found to export');
      }

      // Prepare data for export — VehicleService now returns raw DB rows (snake_case)
      const exportData = result.vehicles.map(vehicle => ({
        'Vehicle ID': vehicle.vehicle_id,
        'Registration Number': vehicle.registration_number,
        'Vehicle Type': vehicle.vehicle_type,
        'Model': vehicle.model_name,
        'Color': vehicle.color || 'N/A',
        'Year': vehicle.year_of_manufacture || 'N/A',
        'Fuel Type': vehicle.fuel_type || 'N/A',
        'Status': vehicle.status,
        'Battery %': vehicle.battery_level || 0,
        'City': vehicle.assigned_city || 'N/A',
        'Assigned Rider': vehicle.rider_name || 'Unassigned',
        'Rider Phone': vehicle.rider_phone || 'N/A',
        'Rider Status': vehicle.rider_status || 'N/A',
        'Total Trips': vehicle.total_trips || 0,
        'Today Trips': vehicle.today_trips || 0,
        'Created At': vehicle.created_at,
        'Updated At': vehicle.updated_at
      }));

      await exportToFile(res, exportData, fmt, 'vehicles');
    } catch (error) {
      logger.error('Export Vehicles Controller Error:', error);
      if (res.headersSent) return;
      return sendError(res, 500, error.message);
    }
  }

  // ==================== ENTERPRISE CONTROLLERS ====================

  async assignBranch(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());
      const vehicleId = parseInt(req.params.id);
      const { branchId, notes } = req.body;
      const adminId = req.admin.admin_id;
      const result = await VehicleService.assignBranch(vehicleId, branchId, adminId, notes);
      return sendSuccess(res, 200, 'Vehicle assigned to branch successfully', result);
    } catch (error) {
      logger.error('Assign Branch Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 400, error.message);
    }
  }

  async transferBranch(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());
      const vehicleId = parseInt(req.params.id);
      const { toBranchId, transferReason } = req.body;
      const adminId = req.admin.admin_id;
      await VehicleService.transferBranch(vehicleId, toBranchId, transferReason, adminId);
      return sendSuccess(res, 200, 'Vehicle transferred to new branch successfully');
    } catch (error) {
      logger.error('Transfer Branch Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 400, error.message);
    }
  }

  async getVehicleBranchHistory(req, res) {
    try {
      const vehicleId = parseInt(req.params.id);
      const result = await VehicleService.getVehicleBranchHistory(vehicleId);
      return sendSuccess(res, 200, 'Branch history retrieved successfully', result);
    } catch (error) {
      logger.error('Get Branch History Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 500, error.message);
    }
  }

  async startMaintenance(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());
      const vehicleId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;
      const result = await VehicleService.startMaintenance(vehicleId, req.body, adminId);
      return sendSuccess(res, 200, 'Maintenance started successfully', result);
    } catch (error) {
      logger.error('Start Maintenance Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 400, error.message);
    }
  }

  async completeMaintenance(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());
      const vehicleId = parseInt(req.params.id);
      const { maintenanceId, ...data } = req.body;
      const adminId = req.admin.admin_id;
      await VehicleService.completeMaintenance(vehicleId, maintenanceId, data, adminId);
      return sendSuccess(res, 200, 'Maintenance completed successfully');
    } catch (error) {
      logger.error('Complete Maintenance Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 400, error.message);
    }
  }

  async getMaintenanceHistory(req, res) {
    try {
      const vehicleId = parseInt(req.params.id);
      const result = await VehicleService.getMaintenanceHistoryEnterprise(vehicleId);
      return sendSuccess(res, 200, 'Maintenance history retrieved successfully', result);
    } catch (error) {
      logger.error('Get Maintenance History Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 500, error.message);
    }
  }

  async getServiceHistory(req, res) {
    try {
      const vehicleId = parseInt(req.params.id);
      const result = await VehicleService.getServiceHistory(vehicleId);
      return sendSuccess(res, 200, 'Service history retrieved successfully', result);
    } catch (error) {
      logger.error('Get Service History Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 500, error.message);
    }
  }

  async getInspectionHistory(req, res) {
    try {
      const vehicleId = parseInt(req.params.id);
      const result = await VehicleService.getInspectionHistory(vehicleId);
      return sendSuccess(res, 200, 'Inspection history retrieved successfully', result);
    } catch (error) {
      logger.error('Get Inspection History Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 500, error.message);
    }
  }

  async getLocationHistory(req, res) {
    try {
      const vehicleId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit) || 100;
      const result = await VehicleService.getLocationHistory(vehicleId, limit);
      return sendSuccess(res, 200, 'Location history retrieved successfully', result);
    } catch (error) {
      logger.error('Get Location History Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 500, error.message);
    }
  }

  async getDocuments(req, res) {
    try {
      const vehicleId = parseInt(req.params.id);
      const result = await VehicleService.getVehicleDocuments(vehicleId);
      return sendSuccess(res, 200, 'Documents retrieved successfully', result);
    } catch (error) {
      logger.error('Get Documents Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 500, error.message);
    }
  }

  async addDocument(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());
      const vehicleId = parseInt(req.params.id);
      const adminId = req.admin.admin_id;
      const result = await VehicleService.addVehicleDocument(vehicleId, req.body, adminId);
      return sendSuccess(res, 201, 'Document added successfully', result);
    } catch (error) {
      logger.error('Add Document Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 400, error.message);
    }
  }

  async deleteDocument(req, res) {
    try {
      const vehicleId = parseInt(req.params.id);
      const documentId = parseInt(req.params.documentId);
      const adminId = req.admin.admin_id;
      await VehicleService.deleteVehicleDocument(vehicleId, documentId, adminId);
      return sendSuccess(res, 200, 'Document deleted successfully');
    } catch (error) {
      logger.error('Delete Document Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 400, error.message);
    }
  }

  async getActivity(req, res) {
    try {
      const vehicleId = parseInt(req.params.id);
      const filters = { activityType: req.query.activityType, limit: parseInt(req.query.limit) || 50 };
      const result = await VehicleService.getEnterpriseActivity(vehicleId, filters);
      return sendSuccess(res, 200, 'Activity log retrieved successfully', result);
    } catch (error) {
      logger.error('Get Activity Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 500, error.message);
    }
  }

  async getExpenses(req, res) {
    try {
      const vehicleId = parseInt(req.params.id);
      const filters = {
        expenseType: req.query.expenseType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 50
      };
      const result = await VehicleService.getVehicleExpenses(vehicleId, filters);
      return sendSuccess(res, 200, 'Expenses retrieved successfully', result);
    } catch (error) {
      logger.error('Get Expenses Controller Error:', error);
      return sendError(res, error.message === 'Vehicle not found' ? 404 : 500, error.message);
    }
  }
}

module.exports = new VehicleController();

