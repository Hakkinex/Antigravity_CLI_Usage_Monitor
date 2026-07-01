/**
 * Token manager with automatic refresh
 *
 * Updated for multi-account support - can manage tokens for specific accounts
 * or default to the active account.
 */
/**
 * Token manager class for handling authentication
 * Can work with active account or a specific account email
 */
export declare class TokenManager {
    private tokens;
    private accountEmail;
    constructor(email?: string);
    /**
     * Get the email this manager is for
     */
    getAccountEmail(): string | null;
    /**
     * Check if user is logged in (has tokens)
     */
    isLoggedIn(): boolean;
    /**
     * Get the stored email
     */
    getEmail(): string | undefined;
    /**
     * Get token expiry time
     */
    getExpiresAt(): Date | undefined;
    /**
     * Get stored project ID
     */
    getProjectId(): string | undefined;
    /**
     * Set and persist project ID
     */
    setProjectId(projectId: string): void;
    /**
     * Check if token is expired or about to expire
     */
    isTokenExpired(): boolean;
    /**
     * Get a valid access token, refreshing if necessary
     */
    getValidAccessToken(): Promise<string>;
    /**
     * Refresh the access token with retry logic
     * Retries on transient network errors, fails immediately on permanent errors (invalid_grant)
     */
    refreshToken(): Promise<void>;
    /**
     * Sleep helper for retry delays
     */
    private sleep;
    /**
     * Reload tokens from disk
     */
    reload(): void;
}
/**
 * Get the token manager instance for active account
 */
export declare function getTokenManager(): TokenManager;
/**
 * Get token manager for a specific account
 */
export declare function getTokenManagerForAccount(email: string): TokenManager;
/**
 * Reset the token manager (for testing or after account changes)
 */
export declare function resetTokenManager(): void;
