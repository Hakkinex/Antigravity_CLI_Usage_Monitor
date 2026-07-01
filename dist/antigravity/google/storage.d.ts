/**
 * Token storage - file-based implementation
 *
 * This module provides backward-compatible token storage.
 * It routes to the active account in the new multi-account structure.
 */
import type { StoredTokens } from '../quota/types.js';
/**
 * Save tokens to disk
 * Routes to active account in multi-account structure
 */
export declare function saveTokens(tokens: StoredTokens): void;
/**
 * Load tokens from disk
 * First tries active account, then falls back to legacy path
 */
export declare function loadTokens(): StoredTokens | null;
/**
 * Delete stored tokens
 * Removes active account in multi-account structure
 */
export declare function deleteTokens(): boolean;
/**
 * Check if tokens exist
 */
export declare function hasTokens(): boolean;
/**
 * Get config directory info for doctor command
 */
export declare function getStorageInfo(): {
    configDir: string;
    tokensPath: string;
    exists: boolean;
};
