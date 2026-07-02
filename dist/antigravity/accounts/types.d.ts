/**
 * Type definitions for multi-account support
 */
import type { StoredTokens, QuotaSnapshot } from '../quota/types.js';
/**
 * Global configuration stored in config.json
 */
export interface GlobalConfig {
    version: string;
    activeAccount: string | null;
    preferences: ConfigPreferences;
}
/**
 * User preferences
 */
export interface ConfigPreferences {
    cacheTTL: number;
}
/**
 * Default configuration values
 */
export declare const DEFAULT_CONFIG: GlobalConfig;
/**
 * Per-account metadata stored in metadata.json
 */
export interface AccountMetadata {
    email: string;
    addedAt: string;
    lastUsed: string;
}
/**
 * Cached quota data stored in cache.json
 */
export interface CachedQuota {
    cachedAt: string;
    ttl: number;
    method: QuotaSnapshot['method'];
    source?: QuotaSnapshot['source'];
    data: QuotaSnapshot | null;
}
/**
 * Account info returned by account manager
 */
export interface AccountInfo {
    email: string;
    isActive: boolean;
    metadata: AccountMetadata | null;
    tokens: StoredTokens | null;
    cache: CachedQuota | null;
    status: AccountStatus;
}
/**
 * Account status for display
 */
export type AccountStatus = 'valid' | 'expired' | 'invalid';
/**
 * Account summary for list display
 */
export interface AccountSummary {
    email: string;
    isActive: boolean;
    status: AccountStatus;
    lastUsed: string | null;
    cachedCredits?: {
        used: number;
        limit: number;
    } | null;
}
