import type { ModelQuota, ModelStatus } from '../types.js';
export type RenderQuotaGroup = {
    label: string;
    fiveHour: QuotaSummary;
    week: QuotaSummary;
};
export type QuotaSummary = {
    remainingPercent: number | null;
    resetInText: string | null;
    status: ModelStatus;
};
export declare function buildQuotaGroups(models: ModelQuota[]): RenderQuotaGroup[];
