const logger = require("../../../src/utils/logger");
const LocationRepository = require("../repositories/LocationRepository");
const {
  sendSuccess,
  sendError,
} = require("../../../src/utils/responseWrapper");

// 1. Update Rider's GPS Position in Redis Cache via Repository
exports.updateRiderLocation = async (req, res) => {
  const riderId = Number(req.user.id);
  const { latitude, longitude } = req.body;

  if (
    !Number.isInteger(riderId) ||
    latitude === undefined ||
    longitude === undefined
  ) {
    return sendError(
      res,
      400,
      "Valid latitude and longitude are required",
      "VALIDATION_ERROR",
      null,
      req,
    );
  }

  try {
    const cached = await LocationRepository.updateLocation(
      riderId,
      latitude,
      longitude,
    );

    return res.status(200).json({
      success: true,
      message: cached
        ? `Rider ${riderId} location cached successfully.`
        : `Rider ${riderId} location received; Redis cache is unavailable so this was not persisted.`,
      location: { latitude, longitude },
    });
  } catch (error) {
    logger.error("GeoAdd Error:", error);
    return sendError(res, 500, error.message, "SERVER_ERROR", null, req);
  }
};

// 2. Query Nearby Riders within a radius via Repository
exports.getNearbyRiders = async (req, res) => {
  const { latitude, longitude, radius } = req.query;

  if (latitude === undefined || longitude === undefined) {
    return sendError(
      res,
      400,
      "latitude and longitude are required query parameters",
      "VALIDATION_ERROR",
      null,
      req,
    );
  }

  const queryRadius = radius ? parseFloat(radius) : 5.0; // Default 5 km

  try {
    const nearbyRiders = await LocationRepository.searchNearby(
      latitude,
      longitude,
      queryRadius,
    );

    return sendSuccess(
      res,
      200,
      "Nearby riders fetched",
      {
        radius: queryRadius + " km",
        count: nearbyRiders.length,
        riders: nearbyRiders,
      },
      { req },
    );
  } catch (error) {
    logger.error("GeoSearch Error:", error);
    return sendError(
      res,
      500,
      error.message || "Failed to search nearby riders",
      "SERVER_ERROR",
      null,
      req,
    );
  }
};
