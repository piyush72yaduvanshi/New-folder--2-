const { getCache } = require("../services/cacheService");

module.exports = async function cacheProfile(req, res, next) {
  const { id } = req.params;

  if (!id) {
    return next();
  }

  try {
    const cachedData = await getCache(`user_profile:${id}`);

    if (cachedData) {
      console.log(`[Redis Cache Hit] Serving user profile for user ID: ${id}`);
      return res.status(200).json({
        success: true,
        user: cachedData,
        cached: true,
      });
    }

    console.log(`[Redis Cache Miss] Querying database for user ID: ${id}`);
    return next();
  } catch (err) {
    console.warn("[Redis Cache Middleware Error] Bypassing cache:", err.message || err);
    return next();
  }
};