const NodeCache = require("node-cache");

// default stdTTL: 1 hour (3600 seconds), checkperiod: 10 minutes (600 seconds)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

module.exports = {
    /**
     * Get a value from cache
     * @param {string} key 
     */
    get: (key) => cache.get(key),

    /**
     * Set a value in cache
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttl - TTL in seconds (optional)
     */
    set: (key, value, ttl) => {
        if (ttl) {
            return cache.set(key, value, ttl);
        }
        return cache.set(key, value);
    },

    /**
     * Delete a key from cache
     * @param {string} key 
     */
    del: (key) => cache.del(key),

    /**
     * Flush all cache
     */
    flush: () => cache.flushAll(),

    /**
     * Keys list (for debugging)
     */
    keys: () => cache.keys(),

    // TTL Constants
    TTL: {
        STATS: 3600,       // 1 hour
        FEATURED: 1800,    // 30 minutes
        LISTING_ITEM: 3600, // 1 hour
        AI_SUGGESTIONS: 86400, // 24 hours (rarely changes)
        NEARBY_PLACES: 86400,  // 24 hours
    }
};
