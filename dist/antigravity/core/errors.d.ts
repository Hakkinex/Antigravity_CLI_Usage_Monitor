/**
 * Custom error classes for the internal Antigravity provider
 */
export declare class NotLoggedInError extends Error {
    constructor(message?: string);
}
export declare class AuthenticationError extends Error {
    constructor(message?: string);
}
export declare class NetworkError extends Error {
    constructor(message?: string);
}
export declare class RateLimitError extends Error {
    retryAfterMs?: number;
    constructor(message?: string, retryAfterMs?: number);
}
export declare class APIError extends Error {
    statusCode?: number;
    constructor(message: string, statusCode?: number);
}
export declare class TokenRefreshError extends Error {
    /** Original error that caused the refresh failure */
    cause?: Error;
    /** HTTP status code if available */
    statusCode?: number;
    /** Whether the error is retryable (network issues) vs permanent (invalid token) */
    isRetryable: boolean;
    constructor(message?: string, options?: {
        cause?: Error;
        statusCode?: number;
        isRetryable?: boolean;
    });
    /** Get detailed error message including cause */
    getDetailedMessage(): string;
}
export declare class AntigravityNotRunningError extends Error {
    constructor(message?: string);
}
export declare class LocalConnectionError extends Error {
    constructor(message?: string);
}
export declare class PortDetectionError extends Error {
    constructor(message?: string);
}
export declare class NoAuthMethodAvailableError extends Error {
    constructor(message?: string);
}
