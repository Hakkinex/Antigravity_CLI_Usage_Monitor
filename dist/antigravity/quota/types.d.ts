export type QuotaMethod = 'google' | 'local' | 'auto';
export type QuotaSource = 'google' | 'local';
export interface QuotaWindow {
    id: string;
    label?: string;
    remainingPercentage?: number;
    isExhausted: boolean;
    resetTime?: string;
    timeUntilResetMs?: number;
}
export interface ModelQuotaInfo {
    name: string;
    displayName?: string;
    remainingPercentage?: number;
    isExhausted: boolean;
    resetTime?: string;
    timeUntilResetMs?: number;
    windows?: {
        fiveHour?: QuotaWindow;
        weekly?: QuotaWindow;
        [key: string]: QuotaWindow | undefined;
    };
}
export interface QuotaSnapshot {
    schemaVersion: 2;
    email: string;
    source: QuotaSource;
    timestamp: number;
    models: ModelQuotaInfo[];
    quotaResetTime?: string | null;
}
