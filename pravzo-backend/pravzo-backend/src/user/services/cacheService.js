const { redisClient, useRedis } = require("../../../src/config/redis");

const CACHE_PREFIX = process.env.REDIS_PREFIX || "pravzo";

function buildKey(key) {
  return `${CACHE_PREFIX}:${key}`;
}

async function getCache(key) {
  if (!useRedis || !redisClient.isReady) return null;

  try {
    const data = await redisClient.get(buildKey(key));
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn("Redis GET fallback:", error.message);
    return null;
  }
}

async function setCache(key, value, ttl = 600) {
  if (!useRedis || !redisClient.isReady) return false;

  try {
    await redisClient.setEx(buildKey(key), ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Redis SET fallback:", error.message);
    return false;
  }
}

async function deleteCache(key) {
  if (!useRedis || !redisClient.isReady) return false;

  try {
    await redisClient.del(buildKey(key));
    return true;
  } catch (error) {
    console.warn("Redis DEL fallback:", error.message);
    return false;
  }
}

async function deleteByPattern(pattern) {
  if (!useRedis || !redisClient.isReady) return false;

  try {
    let cursor = "0";
    const searchPattern = buildKey(pattern);

    do {
      const result = await redisClient.scan(cursor, {
        MATCH: searchPattern,
        COUNT: 100,
      });

      cursor = result.cursor;
      const keys = result.keys || [];

      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } while (cursor !== "0");

    return true;
  } catch (error) {
    console.warn("Redis pattern delete fallback:", error.message);
    return false;
  }
}

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteByPattern,
  buildKey,
};
