const logger = require("../../../src/utils/logger");
const VehicleRepository = require("../repositories/VehicleRepository");
const db = require("../../../src/config/db");

exports.getAllVehicles = async (req, res) => {
  try {
    const {
      limit = 20, offset = 0, category, availability, search
    } = req.query;

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    let query = "SELECT * FROM vehicles WHERE 1=1";
    const params = [];

    if (availability) {
      query += " AND status = ?";
      params.push(availability.toUpperCase());
    }
    if (search) {
      query += " AND (model_name LIKE ? OR registration_number LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += " AND battery_type = ?";
      params.push(category.toUpperCase());
    }

    query += " ORDER BY price_per_week ASC LIMIT ? OFFSET ?";
    params.push(safeLimit, safeOffset);

    const [rows] = await db.query(query, params);

    const [countRows] = await db.query(
      "SELECT COUNT(*) AS total FROM vehicles WHERE 1=1" +
      (availability ? " AND status = ?" : "") +
      (search ? " AND (model_name LIKE ? OR registration_number LIKE ?)" : "") +
      (category ? " AND battery_type = ?" : ""),
      params.slice(0, params.length - 2)
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: countRows[0].total,
        limit: safeLimit,
        offset: safeOffset,
      },
    });
  } catch (error) {
    logger.error("Get All Vehicles Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch vehicles",
    });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);

    if (!vehicleId) {
      return res.status(400).json({
        success: false,
        message: "Valid vehicle id is required",
      });
    }

    const vehicle = await VehicleRepository.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    logger.error("Get Vehicle By Id Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch vehicle",
    });
  }
};

// GET /api/vehicles/categories
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT battery_type AS category, COUNT(*) AS count FROM vehicles GROUP BY battery_type"
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    logger.error("Get Categories Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};

// GET /api/vehicles/featured
exports.getFeaturedVehicles = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const [rows] = await db.query(
      "SELECT * FROM vehicles WHERE status = 'AVAILABLE' ORDER BY price_per_week ASC LIMIT ?",
      [limit]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    logger.error("Get Featured Vehicles Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch featured vehicles" });
  }
};

// GET /api/vehicles/nearby
exports.getNearbyVehicles = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: "latitude and longitude are required" });
    }
    // Haversine formula to find vehicles within radius km
    const [rows] = await db.query(
      `SELECT v.*,
        (6371 * ACOS(
          COS(RADIANS(?)) * COS(RADIANS(COALESCE(l.latitude, 0))) *
          COS(RADIANS(COALESCE(l.longitude, 0)) - RADIANS(?)) +
          SIN(RADIANS(?)) * SIN(RADIANS(COALESCE(l.latitude, 0)))
        )) AS distance_km
       FROM vehicles v
       LEFT JOIN locations l ON l.entity_id = v.vehicle_id AND l.entity_type = 'VEHICLE'
       WHERE v.status = 'AVAILABLE'
       HAVING distance_km <= ? OR distance_km IS NULL
       ORDER BY distance_km ASC
       LIMIT 20`,
      [latitude, longitude, latitude, Number(radius)]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    logger.error("Get Nearby Vehicles Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch nearby vehicles" });
  }
};

// GET /api/vehicles/location/:locationId
exports.getVehiclesByLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const [rows] = await db.query(
      "SELECT * FROM vehicles WHERE assigned_hub = ? AND status = 'AVAILABLE' LIMIT ? OFFSET ?",
      [locationId, limit, offset]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    logger.error("Get Vehicles By Location Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch vehicles" });
  }
};

// GET /api/vehicles/:id/availability
exports.checkAvailability = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);
    const { start_date, end_date } = req.query;

    if (!vehicleId) {
      return res.status(400).json({ success: false, message: "Valid vehicle id is required" });
    }

    const vehicle = await VehicleRepository.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    let isAvailable = vehicle.status === "AVAILABLE";
    let conflictingBookings = [];

    if (start_date && end_date) {
      const [conflicts] = await db.query(
        `SELECT booking_id, start_date, end_date, status
         FROM bookings
         WHERE vehicle_id = ?
           AND status NOT IN ('CANCELLED', 'COMPLETED')
           AND NOT (end_date < ? OR start_date > ?)`,
        [vehicleId, start_date, end_date]
      );
      conflictingBookings = conflicts;
      isAvailable = isAvailable && conflicts.length === 0;
    }

    return res.status(200).json({
      success: true,
      data: {
        vehicle_id: vehicleId,
        is_available: isAvailable,
        current_status: vehicle.status,
        conflicting_bookings: conflictingBookings,
        checked_from: start_date || null,
        checked_to: end_date || null,
      },
    });
  } catch (error) {
    logger.error("Check Availability Error:", error);
    return res.status(500).json({ success: false, message: "Failed to check availability" });
  }
};

// GET /api/vehicles/:id/pricing
exports.getVehiclePricing = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);
    const { hours, days } = req.query;

    if (!vehicleId) {
      return res.status(400).json({ success: false, message: "Valid vehicle id is required" });
    }

    const vehicle = await VehicleRepository.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    const pricePerWeek = Number(vehicle.price_per_week || 0);
    const pricePerDay = Number((pricePerWeek / 7).toFixed(2));
    const pricePerHour = Number((pricePerDay / 24).toFixed(2));

    const pricing = {
      vehicle_id: vehicleId,
      price_per_week: pricePerWeek,
      price_per_day: pricePerDay,
      price_per_hour: pricePerHour,
      currency: "INR",
      security_deposit: Number((pricePerWeek * 0.5).toFixed(2)),
    };

    if (days) {
      pricing.estimated_total_for_days = Number((pricePerDay * Number(days)).toFixed(2));
      pricing.requested_days = Number(days);
    }

    if (hours) {
      pricing.estimated_total_for_hours = Number((pricePerHour * Number(hours)).toFixed(2));
      pricing.requested_hours = Number(hours);
    }

    return res.status(200).json({ success: true, data: pricing });
  } catch (error) {
    logger.error("Get Vehicle Pricing Error:", error);
    return res.status(500).json({ success: false, message: "Failed to get pricing" });
  }
};

// GET /api/vehicles/:id/reviews
exports.getVehicleReviews = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    if (!vehicleId) {
      return res.status(400).json({ success: false, message: "Valid vehicle id is required" });
    }

    // Try to get from a reviews table if it exists, otherwise return empty
    let reviews = [];
    try {
      const [rows] = await db.query(
        `SELECT r.*, u.first_name, u.last_name
         FROM reviews r
         LEFT JOIN users u ON r.user_id = u.user_id
         WHERE r.vehicle_id = ?
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [vehicleId, limit, offset]
      );
      reviews = rows;
    } catch {
      // reviews table may not exist yet
      reviews = [];
    }

    return res.status(200).json({
      success: true,
      data: reviews,
      pagination: { limit, offset, count: reviews.length },
    });
  } catch (error) {
    logger.error("Get Vehicle Reviews Error:", error);
    return res.status(500).json({ success: false, message: "Failed to get reviews" });
  }
};

// GET /api/vehicles/:id/specs
exports.getVehicleSpecs = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);

    if (!vehicleId) {
      return res.status(400).json({ success: false, message: "Valid vehicle id is required" });
    }

    const vehicle = await VehicleRepository.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    const specs = {
      vehicle_id: vehicleId,
      model_name: vehicle.model_name,
      battery_type: vehicle.battery_type,
      battery_percentage: vehicle.battery_percentage,
      estimated_range_km: vehicle.estimated_range_km,
      range_remaining_km: vehicle.range_remaining_km,
      top_speed_kmh: vehicle.top_speed_kmh,
      registration_number: vehicle.registration_number,
      status: vehicle.status,
    };

    return res.status(200).json({ success: true, data: specs });
  } catch (error) {
    logger.error("Get Vehicle Specs Error:", error);
    return res.status(500).json({ success: false, message: "Failed to get specs" });
  }
};
