/**
 * Quota command - fetch and display quota information
 */
import { type QuotaMethod } from '../quota/service.js';
interface QuotaOptions {
    json?: boolean;
    method?: QuotaMethod;
    all?: boolean;
    account?: string;
    refresh?: boolean;
    allModels?: boolean;
}
export declare function quotaCommand(options: QuotaOptions): Promise<void>;
export {};
