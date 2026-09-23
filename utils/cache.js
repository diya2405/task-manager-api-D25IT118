const NodeCache = require('node-cache');

// Standard TTL: 60 seconds, checkperiod: 120 seconds
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

let hits = 0;
let misses = 0;

function get(key) {
  const val = cache.get(key);
  if (val !== undefined) {
    hits++;
  } else {
    misses++;
  }
  return val;
}

function set(key, val, ttl) {
  if (ttl !== undefined) {
    return cache.set(key, val, ttl);
  }
  return cache.set(key, val);
}

function del(key) {
  return cache.del(key);
}

function getCacheStats() {
  const total = hits + misses;
  const rate = total > 0 ? ((hits / total) * 100).toFixed(1) : '0.0';
  return {
    hits,
    misses,
    totalRequests: total,
    hitRate: `${rate}%`,
    activeKeysCount: cache.keys().length,
    activeKeys: cache.keys(),
    ttlSeconds: 60,
  };
}

function flushAllCache() {
  cache.flushAll();
}

function resetStats() {
  hits = 0;
  misses = 0;
  cache.flushAll();
}

module.exports = {
  cache,
  get,
  set,
  del,
  getCacheStats,
  flushAllCache,
  resetStats,
};
