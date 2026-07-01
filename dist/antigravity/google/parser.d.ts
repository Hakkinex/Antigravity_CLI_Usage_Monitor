import type { ModelQuotaInfo, QuotaSnapshot } from '../quota/types.js';
interface RawQuotaInfo {
    remainingFraction?: number;
    tier?: string;
    windowId?: string;
    windowLabel?: string;
    resetTime?: string;
    isExhausted?: boolean;
}
interface RawModelInfo {
    name?: string;
    displayName?: string;
    quotaInfos?: RawQuotaInfo[];
    quotaInfo?: RawQuotaInfo;
}
interface RawResponse {
    models?: Record<string, RawModelInfo> | RawModelInfo[];
}
export declare function parseModelInfo(name: string, raw: RawModelInfo, now?: number): ModelQuotaInfo;
export declare function parseGoogleModels(raw: RawResponse, ctx: {
    email: string;
    now?: number;
}): QuotaSnapshot;
export {};
