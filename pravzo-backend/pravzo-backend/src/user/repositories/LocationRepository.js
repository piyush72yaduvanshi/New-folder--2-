const { redisClient, isRedisReady } = require("../../../src/config/redis");

class LocationRepository {
  isReady() {
    return isRedisReady();
  }

  async updateLocation(riderId, latitude, longitude) {
    if (!this.isReady()) {
      return false;
    }

    await redisClient.geoAdd("active_riders", {
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      member: riderId.toString(),
    });

    return true;
  }

  async searchNearby(latitude, longitude, radiusKm) {
    if (!this.isReady()) {
      return [];
    }

    return await redisClient.geoSearch(
      "active_riders",
      { longitude: parseFloat(longitude), latitude: parseFloat(latitude) },
      { radius: radiusKm, unit: "km" },
    );
  }
}

module.exports = new LocationRepository();
