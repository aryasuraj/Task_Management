const redis = require('redis');

let redisClient = null;

// Initialize Redis client
const initRedis = async () => {
  try {
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log('Redis Connected');
  } catch (error) {
    console.error('Redis connection failed, continuing without cache:', error);
    redisClient = null;
  }
};



const getCache = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

const setCache = async (key, value, expiration = 3600) => {
  if (!redisClient) return false;
  try {
    await redisClient.setEx(key, expiration, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

const deleteCache = async (pattern) => {
  if (!redisClient) return false;
  try {
    if (pattern.includes('*')) {
      const keys = await redisClient.keys(pattern.replace('*', '.*'));
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } else {
      await redisClient.del(pattern);
    }
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  initRedis
};


