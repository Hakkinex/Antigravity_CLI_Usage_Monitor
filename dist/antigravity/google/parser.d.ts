import type { ModelQuotaInfo, QuotaSnapshot } from '../quota/types.js';
import type { RetrieveUserQuotaSummaryResponse } from './cloudcode.js';
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
interface CodeAssistResponse {
    planInfo?: {
        planType?: string;
        monthlyPromptCredits?: number;
    };
    availablePromptCredits?: number;
}
export declare function parsePromptCredits(response: CodeAssistResponse): {
    available: number;
    monthly: number;
    usedPercentage: number;
    remainingPercentage: number;
} | undefined;
export declare function parseQuotaSnapshot(codeAssistResponse: CodeAssistResponse, modelsResponse: RawResponse, email?: string): QuotaSnapshot;
export declare function parseQuotaSummary(summary: RetrieveUserQuotaSummaryResponse, email?: string, now?: number): QuotaSnapshot | null;
export {};
