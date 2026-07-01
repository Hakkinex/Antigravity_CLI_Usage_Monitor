/**
 * Table rendering utilities for multi-account displays
 */
import type { AccountSummary } from '../accounts/types.js';
import type { QuotaSnapshot } from '../quota/types.js';
/**
 * Render accounts list as a table
 */
export declare function renderAccountsTable(accounts: AccountSummary[]): void;
/**
 * Quota result for all accounts display
 */
export interface AllAccountsQuotaResult {
    email: string;
    isActive: boolean;
    status: 'success' | 'error' | 'cached';
    error?: string;
    snapshot?: QuotaSnapshot;
    cacheAge?: number;
}
/**
 * Options for quota rendering
 */
export interface RenderOptions {
    allModels?: boolean;
}
/**
 * Render quota for all accounts as a table
 */
export declare function renderAllQuotaTable(results: AllAccountsQuotaResult[], options?: RenderOptions): void;
