/**
 * Quota output formatting
 */
import type { QuotaSnapshot } from './types.js';
/**
 * Options for quota formatting
 */
export interface FormatOptions {
    allModels?: boolean;
}
/**
 * Print quota as a formatted table
 */
export declare function printQuotaTable(snapshot: QuotaSnapshot, options?: FormatOptions): void;
/**
 * Print quota as JSON
 */
export declare function printQuotaJson(snapshot: QuotaSnapshot): void;
