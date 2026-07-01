/**
 * OAuth configuration and flow
 */
import type { OAuthTokenResponse } from '../quota/types.js';
interface OAuthOptions {
    noBrowser?: boolean;
    port?: number;
    manual?: boolean;
}
interface OAuthResult {
    success: boolean;
    email?: string;
    error?: string;
}
interface ProjectIdResult {
    projectId?: string;
    tierId?: string;
}
/**
 * Extract project ID from cloudaicompanionProject field
 * Handles both string and object { id: string } formats
 */
export declare function extractProjectId(value: unknown): string | undefined;
/**
 * Pick the tier ID to use for onboarding
 * Priority: default tier from allowedTiers > first tier from allowedTiers > 'LEGACY' > tierIdFromLoad
 */
export declare function pickOnboardTier(allowedTiers: Array<{
    id?: string;
    isDefault?: boolean;
}> | undefined, tierIdFromLoad?: string): string | undefined;
/**
 * Resolve project ID from Cloud Code API
 * First tries loadCodeAssist, if no projectId then initiates onboarding
 */
export declare function resolveProjectId(accessToken: string): Promise<ProjectIdResult>;
/**
 * Start OAuth login flow
 */
export declare function startOAuthFlow(options?: OAuthOptions): Promise<OAuthResult>;
/**
 * Refresh access token using refresh token
 */
export declare function refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse>;
export {};
