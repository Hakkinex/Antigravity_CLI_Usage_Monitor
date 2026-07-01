/**
 * Cache management for quota data
 */
import { loadAccountCache, saveAccountCache, deleteAccountCache } from './storage.js';
import { getCacheTTL } from './config.js';
import { debug } from '../core/logger.js';
/**
 * Check if cache is valid for an account
 */
export function isCacheValid(email) {
    const cache = loadAccountCache(email);
    if (!cache || !cache.data) {
        debug('cache', `No valid cache for ${email}`);
        return false;
    }
    if (!supportsWeeklyAwareSchema(cache.data)) {
        debug('cache', `Cache for ${email} is missing weekly-aware schema, ignoring`);
        return false;
    }
    const cachedAt = new Date(cache.cachedAt).getTime();
    const ttlMs = cache.ttl * 1000;
    const now = Date.now();
    const isValid = (now - cachedAt) < ttlMs;
    debug('cache', `Cache for ${email} is ${isValid ? 'valid' : 'stale'}`);
    return isValid;
}
function supportsWeeklyAwareSchema(data) {
    if (data.schemaVersion === 2)
        return true;
    return data.models.some((model) => {
        const legacyWeekly = model.weeklyRemainingPercentage;
        return Boolean(model.windows?.weekly || legacyWeekly !== undefined);
    });
}
/**
 * Get cache age in seconds
 */
export function getCacheAge(email) {
    const cache = loadAccountCache(email);
    if (!cache) {
        return null;
    }
    const cachedAt = new Date(cache.cachedAt).getTime();
    return Math.floor((Date.now() - cachedAt) / 1000);
}
/**
 * Save quota data to cache
 */
export function saveCache(email, data) {
    const ttl = getCacheTTL();
    const cache = {
        cachedAt: new Date().toISOString(),
        ttl,
        data
    };
    saveAccountCache(email, cache);
    debug('cache', `Cached quota for ${email}, TTL: ${ttl}s`);
}
/**
 * Load cached quota data
 */
export function loadCache(email) {
    const cache = loadAccountCache(email);
    return cache?.data || null;
}
/**
 * Load cache with metadata
 */
export function loadCacheWithMeta(email) {
    return loadAccountCache(email);
}
/**
 * Invalidate cache for an account
 */
export function invalidateCache(email) {
    deleteAccountCache(email);
    debug('cache', `Invalidated cache for ${email}`);
}
//# sourceMappingURL=cache.js.map