/**
 * Quota service - orchestrates fetching quota data
 */
import type { QuotaSnapshot } from './types.js';
export type QuotaMethod = 'google' | 'local' | 'auto';
/**
 * Fetch quota using the specified method
 * @param method Method to use: 'auto' (default), 'google', or 'local'
 */
export declare function fetchQuota(method?: QuotaMethod): Promise<QuotaSnapshot>;
