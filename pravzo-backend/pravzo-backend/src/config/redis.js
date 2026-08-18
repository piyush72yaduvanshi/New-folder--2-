"use strict";
const { createClient } = require("redis");
require("dotenv").config();

const useRedis = process.env.USE_REDIS !== "false"; // enabled by default

let redisClient;

function isRedisReady() {
  if (!useRedis || !redisClient) return false;
  return Boolean(
    redisClient.isReady || redisClient.isOpen || redisClient.status === "ready",
  );
}

if (!useRedis) {
  console.log("[Redis] Disabled (USE_REDIS=false) — running without cache.");
  redisClient = {
    isReady: false,
    isOpen: false,
    status: "end",
    connect: async () => {},
    quit: async () => {},
    get: async () => null,
    setEx: async () => {},
    del: async () => 0,
    geoAdd: async () => {},
    geoSearch: async () => [],
    scan: async () => ({ cursor: "0", keys: [] }),
    sendCommand: async () => null,
    on: () => {},
  };
} else {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT) || 6379,
      reconnectStrategy: (retries) => {
        if (retries >= 5) {
          console.warn("[Redis] Max retries reached.");
          return false;
        }
        return Math.min(retries * 1000, 3000);
      },
    },
    password: process.env.REDIS_PASSWORD || undefined,
    disableOfflineQueue: true,
  });

  redisClient.on("error", (err) => {
    redisClient.isReady = false;
    redisClient.isOpen = false;
    console.warn("[Redis] Error:", err.message);
  });
  redisClient.on("ready", () => {
    redisClient.isReady = true;
    redisClient.isOpen = true;
    redisClient.status = "ready";
    console.log("[Redis] Connected and ready.");
  });
  redisClient.on("reconnecting", () => {
    redisClient.isReady = false;
    redisClient.isOpen = false;
    redisClient.status = "reconnecting";
    console.log("[Redis] Reconnecting...");
  });
}

async function connectRedis() {
  if (!useRedis || isRedisReady()) return;
  try {
    await redisClient.connect();
  } catch (err) {
    // redisClient.isReady = false;
    // redisClient.isOpen = false;
    console.warn("[Redis] Connection failed — app continues without cache.");
  }
}

module.exports = { redisClient, connectRedis, useRedis, isRedisReady };
