/**
 * Token masking utility
 */
/**
 * Mask a token for display, showing first 6 and last 4 characters
 * @example maskToken('abc123xyz789secret') => 'abc123...cret'
 */
export declare function maskToken(token: string): string;
/**
 * Mask an email for display
 * @example maskEmail('user@example.com') => 'us**@example.com'
 */
export declare function maskEmail(email: string): string;
