/**
 * Account storage - file-based operations for multi-account
 */
import type { StoredTokens } from '../quota/types.js';
import type { AccountMetadata, CachedQuota } from './types.js';
/**
 * Ensure accounts directory exists
 */
export declare function ensureAccountsDir(): void;
/**
 * Ensure specific account directory exists
 */
export declare function ensureAccountDir(email: string): void;
/**
 * Check if an account exists
 */
export declare function accountExists(email: string): boolean;
/**
 * List all account directories (by email)
 */
export declare function listAccountEmails(): string[];
/**
 * Save tokens for an account
 */
export declare function saveAccountTokens(email: string, tokens: StoredTokens): void;
/**
 * Load tokens for an account
 */
export declare function loadAccountTokens(email: string): StoredTokens | null;
/**
 * Save metadata for an account
 */
export declare function saveAccountMetadata(email: string, metadata: AccountMetadata): void;
/**
 * Load metadata for an account
 */
export declare function loadAccountMetadata(email: string): AccountMetadata | null;
/**
 * Update lastUsed timestamp for an account
 */
export declare function updateLastUsed(email: string): void;
/**
 * Save cached quota for an account
 */
export declare function saveAccountCache(email: string, cache: CachedQuota): void;
/**
 * Load cached quota for an account
 */
export declare function loadAccountCache(email: string): CachedQuota | null;
/**
 * Delete cache for an account
 */
export declare function deleteAccountCache(email: string): void;
/**
 * Delete an account and all its data
 */
export declare function deleteAccount(email: string): boolean;
