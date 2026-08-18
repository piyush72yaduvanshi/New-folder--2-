'use strict';

const VehicleRepository = require('../repositories/VehicleRepository');
const RiderRepository   = require('../repositories/RiderRepository');
const logger = require('../../../src/utils/logger');

class VehicleService {
  // Get paginated vehicles list
  async getVehicles(filters, pagination) {
    try {
   
      return await VehicleRepository.getVehicles(filters, pagination);
    } catch (error) {
      logger.error('VehicleService - Get Vehicles Error:', error);
      throw new Error('Failed to fetch vehicles');
    }
  }

  // Get vehicle by ID with complete details
  async getVehicleById(vehicleId) {
    try {
      const vehicle = await VehicleRepository.getVehicleDetails(vehicleId);

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      // Get additional data
      const [assignmentHistory, maintenanceHistory, bookingHistory, activityLog] = await Promise.all([
        VehicleRepository.getAssignmentHistory(vehicleId),
        VehicleRepository.getMaintenanceHistory(vehicleId),
        VehicleRepository.getBookingHistory(vehicleId),
        VehicleRepository.getActivityLog(vehicleId)
      ]);

      return {
        vehicle: {
          vehicleId: vehicle.vehicle_id,
          registrationNumber: vehicle.registration_number,
          vehicleType: vehicle.vehicle_type,
          modelName: vehicle.model_name,
          color: vehicle.color,
          status: vehicle.status,
          battery: vehicle.battery,
          fuelType: vehicle.fuel_type,
          yearOfManufacture: vehicle.year_of_manufacture,
          chassisNumber: vehicle.chassis_number,
          engineNumber: vehicle.engine_number,
          assignedCity: vehicle.assigned_city,
          // RC Details
          rcNumber: vehicle.rc_number,
          rcImageUrl: vehicle.rc_image_url,
          // Insurance Details
          insuranceNumber: vehicle.insurance_number,
          insuranceExpiryDate: vehicle.insurance_expiry_date,
          insuranceImageUrl: vehicle.insurance_image_url,
          // Fitness Certificate
          fitnessCertificateNumber: vehicle.fitness_certificate_number,
          fitnessCertificateExpiryDate: vehicle.fitness_certificate_expiry_date,
          fitnessCertificateImageUrl: vehicle.fitness_certificate_image_url,
          // PUC
          pucNumber: vehicle.puc_number,
          pucExpiryDate: vehicle.puc_expiry_date,
          pucImageUrl: vehicle.puc_image_url,
          // Owner Details
          ownerName: vehicle.owner_name,
          ownerPhone: vehicle.owner_phone,
          createdAt: vehicle.created_at,
          updatedAt: vehicle.updated_at
        },
        assignedRider: vehicle.rider_id ? {
          riderId: vehicle.rider_id,
          riderName: vehicle.rider_name,
          riderPhone: vehicle.rider_phone,
          riderEmail: vehicle.rider_email,
          riderCode: vehicle.rider_code,
          status: vehicle.rider_status,
          onlineStatus: vehicle.rider_online_status,
          availability: vehicle.rider_availability,
          rating: parseFloat(vehicle.rider_rating || 0),
          totalTrips: vehicle.total_trips || 0,
          totalDistance: parseFloat(vehicle.total_distance || 0),
          lastTripDate: vehicle.last_trip_date
        } : null,
        currentLocation: vehicle.current_latitude ? {
          latitude: parseFloat(vehicle.current_latitude),
          longitude: parseFloat(vehicle.current_longitude),
          speed: parseFloat(vehicle.current_speed || 0),
          heading: parseFloat(vehicle.current_heading || 0),
          battery: vehicle.current_battery,
          updatedAt: vehicle.location_updated_at
        } : null,
        assignmentHistory: assignmentHistory.map(a => ({
          assignmentId: a.assignment_id,
          riderId: a.rider_id,
          riderName: a.rider_name,
          riderPhone: a.rider_phone,
          riderCode: a.rider_code,
          assignedAt: a.assigned_at,
          removedAt: a.removed_at,
          assignmentReason: a.assignment_reason,
          removalReason: a.removal_reason,
          assignedBy: a.assigned_by_name
        })),
        maintenanceHistory: maintenanceHistory.map(m => ({
          maintenanceId: m.maintenance_id,
          startedAt: m.started_at,
          completedAt: m.completed_at,
          estimatedCost: parseFloat(m.estimated_cost || 0),
          actualCost: parseFloat(m.actual_cost || 0),
          nextServiceDate: m.next_service_date,
          remarks: m.remarks,
          performedBy: m.performed_by_name
        })),
        recentBookings: bookingHistory.slice(0, 10).map(b => ({
          tripId: b.trip_id,
          userId: b.user_id,
          customerName: b.customer_name,
          customerPhone: b.customer_phone,
          riderName: b.rider_name,
          pickupAddress: b.pickup_address,
          dropoffAddress: b.dropoff_address,
          distance: parseFloat(b.distance_km || 0),
          duration: b.duration_minutes,
          fare: parseFloat(b.fare_amount || 0),
          status: b.status,
          paymentMethod: b.payment_method,
          paymentStatus: b.payment_status,
          createdAt: b.created_at,
          completedAt: b.completed_at
        })),
        activityLog: activityLog.slice(0, 20).map(a => ({
          activityId: a.activity_id,
          activityType: a.activity_type,
          description: a.description,
          performedBy: a.performed_by_name,
          createdAt: a.created_at
        }))
      };
    } catch (error) {
      logger.error('VehicleService - Get Vehicle By ID Error:', error);
      throw error;
    }
  }

  // Create new vehicle
  async createVehicle(vehicleData) {
    try {
      // Check if registration number already exists
      const existing = await VehicleRepository.findByRegistrationNumber(vehicleData.registrationNumber);
      if (existing) {
        throw new Error('Vehicle with this registration number already exists');
      }

      const vehicleId = await VehicleRepository.createVehicle(vehicleData);

      return { vehicleId };
    } catch (error) {
      logger.error('VehicleService - Create Vehicle Error:', error);
      throw error;
    }
  }

  // Update vehicle
  async updateVehicle(vehicleId, vehicleData) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      const affectedRows = await VehicleRepository.updateVehicle(vehicleId, vehicleData);

      if (affectedRows === 0) {
        throw new Error('No changes made to vehicle');
      }

      return { success: true };
    } catch (error) {
      logger.error('VehicleService - Update Vehicle Error:', error);
      throw error;
    }
  }

  // Delete vehicle (soft delete)
  async deleteVehicle(vehicleId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      if (vehicle.assigned_rider_id) {
        throw new Error('Cannot delete vehicle that is assigned to a rider. Remove rider first.');
      }

      if (vehicle.status === 'RENTED') {
        throw new Error('Cannot delete vehicle that is currently rented');
      }

      await VehicleRepository.softDeleteVehicle(vehicleId);

      return { success: true };
    } catch (error) {
      logger.error('VehicleService - Delete Vehicle Error:', error);
      throw error;
    }
  }

  // Update vehicle status
  async updateVehicleStatus(vehicleId, status) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      await VehicleRepository.updateVehicleStatus(vehicleId, status);

      return { success: true };
    } catch (error) {
      logger.error('VehicleService - Update Vehicle Status Error:', error);
      throw error;
    }
  }

  // Update maintenance
  async updateMaintenance(vehicleId, maintenanceData, adminId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      if (maintenanceData.maintenanceType === 'STARTED') {
        if (vehicle.status === 'MAINTENANCE') {
          throw new Error('Vehicle is already under maintenance');
        }
      } else if (maintenanceData.maintenanceType === 'COMPLETED') {
        if (vehicle.status !== 'MAINTENANCE') {
          throw new Error('Vehicle is not under maintenance');
        }
      }

      await VehicleRepository.updateMaintenance(vehicleId, maintenanceData, adminId);

      return { success: true };
    } catch (error) {
      logger.error('VehicleService - Update Maintenance Error:', error);
      throw error;
    }
  }

  // Block vehicle
  async blockVehicle(vehicleId, reason, adminId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      if (vehicle.status === 'BLOCKED') {
        throw new Error('Vehicle is already blocked');
      }

      await VehicleRepository.blockVehicle(vehicleId, reason, adminId);

      return { success: true };
    } catch (error) {
      logger.error('VehicleService - Block Vehicle Error:', error);
      throw error;
    }
  }

  // Unblock vehicle
  async unblockVehicle(vehicleId, adminId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      if (vehicle.status !== 'BLOCKED') {
        throw new Error('Vehicle is not blocked');
      }

      await VehicleRepository.unblockVehicle(vehicleId, adminId);

      return { success: true };
    } catch (error) {
      logger.error('VehicleService - Unblock Vehicle Error:', error);
      throw error;
    }
  }

  // Assign rider to vehicle
  async assignRider(vehicleId, riderId, reason, adminId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      if (vehicle.assigned_rider_id) {
        throw new Error('Vehicle is already assigned to another rider');
      }

      if (vehicle.status === 'BLOCKED') {
        throw new Error('Cannot assign rider to blocked vehicle');
      }

      if (vehicle.status === 'MAINTENANCE') {
        throw new Error('Cannot assign rider to vehicle under maintenance');
      }

      // Check if rider exists and is available — use RiderRepository, not raw db.query
      const rider = await RiderRepository.findById(riderId);

      if (!rider) {
        throw new Error('Rider not found');
      }

      if (rider.status !== 'ACTIVE') {
        throw new Error('Rider is not active');
      }

      if (rider.assigned_vehicle_id) {
        throw new Error('Rider is already assigned to another vehicle');
      }

      await VehicleRepository.assignRider(vehicleId, riderId, reason, adminId);

      return { success: true };
    } catch (error) {
      logger.error('VehicleService - Assign Rider Error:', error);
      throw error;
    }
  }

  // Remove rider from vehicle
  async removeRider(vehicleId, reason, adminId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      if (!vehicle.assigned_rider_id) {
        throw new Error('No rider assigned to this vehicle');
      }

      const riderId = vehicle.assigned_rider_id;

      await VehicleRepository.removeRider(vehicleId, riderId, reason, adminId);

      return { success: true };
    } catch (error) {
      logger.error('VehicleService - Remove Rider Error:', error);
      throw error;
    }
  }

  // Get vehicle history
  async getVehicleHistory(vehicleId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      const [assignmentHistory, maintenanceHistory, bookingHistory] = await Promise.all([
        VehicleRepository.getAssignmentHistory(vehicleId),
        VehicleRepository.getMaintenanceHistory(vehicleId),
        VehicleRepository.getBookingHistory(vehicleId)
      ]);

      return {
        assignmentHistory: assignmentHistory.map(a => ({
          assignmentId: a.assignment_id,
          riderId: a.rider_id,
          riderName: a.rider_name,
          riderPhone: a.rider_phone,
          riderCode: a.rider_code,
          assignedAt: a.assigned_at,
          removedAt: a.removed_at,
          assignmentReason: a.assignment_reason,
          removalReason: a.removal_reason,
          assignedBy: a.assigned_by_name
        })),
        maintenanceHistory: maintenanceHistory.map(m => ({
          maintenanceId: m.maintenance_id,
          startedAt: m.started_at,
          completedAt: m.completed_at,
          estimatedCost: parseFloat(m.estimated_cost || 0),
          actualCost: parseFloat(m.actual_cost || 0),
          nextServiceDate: m.next_service_date,
          remarks: m.remarks,
          performedBy: m.performed_by_name
        })),
        bookingHistory: bookingHistory.map(b => ({
          tripId: b.trip_id,
          userId: b.user_id,
          customerName: b.customer_name,
          customerPhone: b.customer_phone,
          riderName: b.rider_name,
          pickupAddress: b.pickup_address,
          dropoffAddress: b.dropoff_address,
          distance: parseFloat(b.distance_km || 0),
          duration: b.duration_minutes,
          fare: parseFloat(b.fare_amount || 0),
          status: b.status,
          paymentMethod: b.payment_method,
          paymentStatus: b.payment_status,
          createdAt: b.created_at,
          completedAt: b.completed_at
        }))
      };
    } catch (error) {
      logger.error('VehicleService - Get Vehicle History Error:', error);
      throw error;
    }
  }

  // Get vehicle statistics
  async getVehicleStatistics() {
    try {
      const stats = await VehicleRepository.getVehicleStatistics();

      // Return both the raw stats (for DTO.toFleetStats) and the camelCase
      // convenience shape. toFleetStats reads the snake_case keys directly.
      return stats;
    } catch (error) {
      logger.error('VehicleService - Get Vehicle Statistics Error:', error);
      throw new Error('Failed to fetch vehicle statistics');
    }
  }

  // ==================== ENTERPRISE METHODS ====================

  async assignBranch(vehicleId, branchId, adminId, notes) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      const assignmentId = await VehicleRepository.assignVehicleToBranch(vehicleId, branchId, adminId, notes);
      logger.info('Vehicle assigned to branch', { vehicleId, branchId, adminId });
      return { assignmentId };
    } catch (error) {
      logger.error('VehicleService - Assign Branch Error:', error);
      throw error;
    }
  }

  async transferBranch(vehicleId, toBranchId, transferReason, adminId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      if (!vehicle.branch_id) throw new Error('Vehicle is not assigned to any branch');
      if (vehicle.branch_id === toBranchId) throw new Error('Vehicle is already in this branch');
      await VehicleRepository.transferVehicleBranch(vehicleId, vehicle.branch_id, toBranchId, transferReason, adminId);
      logger.info('Vehicle branch transferred', { vehicleId, from: vehicle.branch_id, to: toBranchId });
      return true;
    } catch (error) {
      logger.error('VehicleService - Transfer Branch Error:', error);
      throw error;
    }
  }

  async getVehicleBranchHistory(vehicleId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      const history = await VehicleRepository.getVehicleBranchHistory(vehicleId);
      return {
        history: history.map(h => ({
          assignmentId: h.assignment_id,
          branchId: h.branch_id,
          branchName: h.branch_name,
          city: h.city,
          status: h.assignment_status,
          assignedAt: h.assigned_at,
          unassignedAt: h.unassigned_at,
          assignedBy: h.assigned_by_name,
          transferReason: h.transfer_reason,
          notes: h.notes
        }))
      };
    } catch (error) {
      logger.error('VehicleService - Get Branch History Error:', error);
      throw error;
    }
  }

  async startMaintenance(vehicleId, data, adminId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      if (vehicle.status === 'MAINTENANCE') throw new Error('Vehicle is already under maintenance');
      if (vehicle.status === 'RENTED') throw new Error('Cannot start maintenance on a rented vehicle');
      const maintenanceId = await VehicleRepository.startMaintenance(vehicleId, data, adminId);
      logger.info('Vehicle maintenance started', { vehicleId, maintenanceId });
      return { maintenanceId };
    } catch (error) {
      logger.error('VehicleService - Start Maintenance Error:', error);
      throw error;
    }
  }

  async completeMaintenance(vehicleId, maintenanceId, data, adminId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      if (vehicle.status !== 'MAINTENANCE') throw new Error('Vehicle is not under maintenance');
      await VehicleRepository.completeMaintenance(vehicleId, maintenanceId, data, adminId);
      logger.info('Vehicle maintenance completed', { vehicleId, maintenanceId });
      return true;
    } catch (error) {
      logger.error('VehicleService - Complete Maintenance Error:', error);
      throw error;
    }
  }

  async getMaintenanceHistoryEnterprise(vehicleId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      const history = await VehicleRepository.getMaintenanceHistoryEnterprise(vehicleId);
      return {
        history: history.map(m => ({
          maintenanceId: m.maintenance_id,
          maintenanceType: m.maintenance_type,
          status: m.status,
          priority: m.priority,
          startedAt: m.started_at,
          completedAt: m.completed_at,
          scheduledDate: m.scheduled_date,
          estimatedCost: parseFloat(m.estimated_cost || 0),
          actualCost: parseFloat(m.actual_cost || 0),
          serviceCenter: m.service_center,
          serviceAdvisor: m.service_advisor,
          partsReplaced: m.parts_replaced ? JSON.parse(m.parts_replaced) : [],
          nextServiceDate: m.next_service_date,
          invoiceUrl: m.invoice_url,
          remarks: m.remarks,
          performedBy: m.performed_by_name
        }))
      };
    } catch (error) {
      logger.error('VehicleService - Get Maintenance History Error:', error);
      throw error;
    }
  }

  async getServiceHistory(vehicleId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      const history = await VehicleRepository.getServiceHistory(vehicleId);
      return { history };
    } catch (error) {
      logger.error('VehicleService - Get Service History Error:', error);
      throw error;
    }
  }

  async getInspectionHistory(vehicleId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      const history = await VehicleRepository.getInspectionHistory(vehicleId);
      return {
        history: history.map(i => ({
          inspectionId: i.inspection_id,
          inspectionType: i.inspection_type,
          inspectorName: i.inspector_name || i.inspector_name_admin,
          inspectionDate: i.inspection_date,
          overallCondition: i.overall_condition,
          batteryHealth: i.battery_health,
          batteryPercent: i.battery_percent,
          tyreCondition: i.tyre_condition,
          brakeCondition: i.brake_condition,
          motorCondition: i.motor_condition,
          lightsCondition: i.lights_condition,
          odometerReading: parseFloat(i.odometer_reading || 0),
          damageFound: i.damage_found === 1,
          damageDescription: i.damage_description,
          damagePhotos: i.damage_photos ? JSON.parse(i.damage_photos) : [],
          photos: i.photos ? JSON.parse(i.photos) : [],
          remarks: i.remarks
        }))
      };
    } catch (error) {
      logger.error('VehicleService - Get Inspection History Error:', error);
      throw error;
    }
  }

  async getLocationHistory(vehicleId, limit) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      const history = await VehicleRepository.getLocationHistory(vehicleId, limit);
      return {
        history: history.map(l => ({
          latitude: parseFloat(l.latitude),
          longitude: parseFloat(l.longitude),
          speed: parseFloat(l.speed || 0),
          heading: parseFloat(l.heading || 0),
          batteryLevel: l.battery_level,
          tripId: l.trip_id,
          recordedAt: l.recorded_at
        }))
      };
    } catch (error) {
      logger.error('VehicleService - Get Location History Error:', error);
      throw error;
    }
  }

  async getVehicleDocuments(vehicleId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      const docs = await VehicleRepository.getVehicleDocuments(vehicleId);
      return {
        documents: docs.map(d => ({
          documentId: d.document_id,
          documentType: d.document_type,
          documentTitle: d.document_title,
          documentNumber: d.document_number,
          documentUrl: d.document_url,
          mimeType: d.mime_type,
          issueDate: d.issue_date,
          expiryDate: d.expiry_date,
          isExpired: d.is_expired === 1,
          verifiedStatus: d.verified_status,
          verifiedBy: d.verified_by_name,
          verifiedAt: d.verified_at,
          remarks: d.remarks,
          uploadedBy: d.uploaded_by_name,
          createdAt: d.created_at
        }))
      };
    } catch (error) {
      logger.error('VehicleService - Get Documents Error:', error);
      throw error;
    }
  }

  async addVehicleDocument(vehicleId, docData, adminId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      const documentId = await VehicleRepository.addVehicleDocument(vehicleId, docData, adminId);
      return { documentId };
    } catch (error) {
      logger.error('VehicleService - Add Document Error:', error);
      throw error;
    }
  }

  async deleteVehicleDocument(vehicleId, documentId, adminId) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      await VehicleRepository.deleteVehicleDocument(vehicleId, documentId, adminId);
      return true;
    } catch (error) {
      logger.error('VehicleService - Delete Document Error:', error);
      throw error;
    }
  }

  async getEnterpriseActivity(vehicleId, filters) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      const activities = await VehicleRepository.getEnterpriseActivityLog(vehicleId, filters);
      return {
        activities: activities.map(a => ({
          logId: a.log_id,
          activityType: a.activity_type,
          description: a.activity_description,
          referenceType: a.reference_type,
          referenceId: a.reference_id,
          performedByType: a.performed_by_type,
          performedById: a.performed_by_id,
          createdAt: a.created_at
        }))
      };
    } catch (error) {
      logger.error('VehicleService - Get Activity Error:', error);
      throw error;
    }
  }

  async getVehicleExpenses(vehicleId, filters) {
    try {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      const expenses = await VehicleRepository.getVehicleExpenses(vehicleId, filters);
      return {
        expenses: expenses.map(e => ({
          expenseId: e.expense_id,
          expenseType: e.expense_type,
          amount: parseFloat(e.amount),
          description: e.description,
          expenseDate: e.expense_date,
          receiptUrl: e.receipt_url,
          vendorName: e.vendor_name,
          paymentMethod: e.payment_method,
          recordedBy: e.recorded_by_name,
          createdAt: e.created_at
        }))
      };
    } catch (error) {
      logger.error('VehicleService - Get Expenses Error:', error);
      throw error;
    }
  }
}

module.exports = new VehicleService();

