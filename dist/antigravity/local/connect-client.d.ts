/**
 * Connect client - client for Antigravity Connect API
 */
export interface ConnectUserStatus {
    isAuthenticated?: boolean;
    email?: string;
    quota?: {
        promptCredits?: {
            used?: number;
            limit?: number;
            remaining?: number;
        };
        models?: Array<{
            modelId: string;
            displayName?: string;
            label?: string;
            quota?: {
                remaining?: number;
                limit?: number;
                usedPercentage?: number;
                remainingPercentage?: number;
                resetTime?: string;
                timeUntilResetMs?: number;
            };
            isExhausted?: boolean;
        }>;
    };
    raw?: unknown;
}
export interface ConnectModelInfo {
    modelId: string;
    displayName?: string;
    label?: string;
    quota?: {
        remaining?: number;
        limit?: number;
        usedPercentage?: number;
        remainingPercentage?: number;
        resetTime?: string;
        timeUntilResetMs?: number;
    };
    isExhausted?: boolean;
}
export declare class ConnectClient {
    private baseUrl;
    private csrfToken;
    private isHttps;
    constructor(baseUrl: string, csrfToken?: string);
    /**
     * Get user status including quota information
     * Uses Connect RPC protocol to communicate with Antigravity language server
     */
    getUserStatus(): Promise<ConnectUserStatus>;
    /**
     * Make an HTTP(S) request to the Connect API
     */
    private request;
    /**
     * Parse raw API response into ConnectUserStatus
     */
    private parseUserStatus;
    /**
     * Extract quota information from response
     */
    private extractQuota;
    /**
     * Parse a single model from the response
     */
    private parseModel;
    /**
     * Parse reset time to milliseconds until reset
     */
    private parseResetTime;
}
