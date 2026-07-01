/**
 * Cache management for quota data
 */
import type { QuotaSnapshot } from '../quota/types.js';
import type { CachedQuota } from './types.js';
/**
 * Check if cache is valid for an account
 */
export declare function isCacheValid(email: string): boolean;
/**
 * Get cache age in seconds
 */
export declare function getCacheAge(email: string): number | null;
/**
 * Save quota data to cache
 */
export declare function saveCache(email: string, data: QuotaSnapshot): void;
/**
 * Load cached quota data
 */
export declare function loadCache(email: string): QuotaSnapshot | null;
/**
 * Load cache with metadata
 */
export declare function loadCacheWithMeta(email: string): CachedQuota | null;
/**
 * Invalidate cache for an account
 */
export declare function invalidateCache(email: string): void;
