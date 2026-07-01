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
    label?: string;
    modelId?: string;
    remainingPercentage?: number;
    isExhausted: boolean;
    resetTime?: string;
    timeUntilResetMs?: number;
    isAutocompleteOnly?: boolean;
    windows?: {
        fiveHour?: QuotaWindow;
        weekly?: QuotaWindow;
        [key: string]: QuotaWindow | undefined;
    };
}
export interface PromptCreditsInfo {
    available: number;
    monthly: number;
    usedPercentage: number;
    remainingPercentage: number;
}
export interface QuotaSnapshot {
    schemaVersion?: 2;
    timestamp: string | number;
    method: 'google' | 'local';
    email?: string;
    source?: QuotaSource;
    planType?: string;
    promptCredits?: PromptCreditsInfo;
    models: ModelQuotaInfo[];
    quotaResetTime?: string | null;
    raw?: unknown;
}
export interface StoredTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    email?: string;
    projectId?: string;
}
export interface OAuthTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope?: string;
}
export interface GoogleUserInfo {
    email: string;
    name?: string;
    picture?: string;
}
