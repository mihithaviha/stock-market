const { createClient } = require('redis');

let redisClient;
let useRedis = false;
let fallbackCache = {};

async function initRedis() {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({ 
      url: redisUrl,
      socket: {
        reconnectStrategy: false
      }
    });
    
    redisClient.on('error', (err) => {
      // Intentionally omitting continuous console logs to prevent flooding
    });
    
    await redisClient.connect();
    useRedis = true;
    console.log("Connected to Redis Cache.");
  } catch (e) {
    console.log("Redis not available, defaulting to in-memory caching mapping.");
    useRedis = false;
  }
}

async function getCache(key) {
  if (useRedis) return await redisClient.get(key);
  return fallbackCache[key];
}

async function setCache(key, value, expirySeconds = 60) {
  if (useRedis) {
    await redisClient.set(key, value, { EX: expirySeconds });
  } else {
    fallbackCache[key] = value;
    setTimeout(() => {
      delete fallbackCache[key];
    }, expirySeconds * 1000);
  }
}

initRedis();

module.exports = { getCache, setCache };
