import { type QuotaMethod } from './quota/service.js';
import type { QuotaSnapshot } from './quota/types.js';
export type { ModelQuotaInfo, QuotaMethod, QuotaSnapshot, QuotaWindow } from './quota/types.js';
export type AccountQuotaResult = {
    email: string;
    isActive: boolean;
    status: 'success';
    snapshot: QuotaSnapshot;
} | {
    email: string;
    isActive: boolean;
    status: 'cached';
    snapshot: QuotaSnapshot;
    cacheAge: number;
    fallbackError?: string;
} | {
    email: string;
    isActive: boolean;
    status: 'error';
    error: string;
};
export type FetchQuotaOptions = {
    method?: QuotaMethod;
    accountEmail?: string;
    refresh?: boolean;
};
export declare function fetchQuotaSnapshot(options?: FetchQuotaOptions): Promise<QuotaSnapshot>;
export declare function fetchAllQuotaSnapshots(options?: FetchQuotaOptions): Promise<AccountQuotaResult[]>;
