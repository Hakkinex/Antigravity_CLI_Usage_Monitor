/**
 * Account resolver for auto wake-up
 * Resolves which accounts to use for triggering based on config and availability
 */
/**
 * Resolve which accounts to use for triggering
 * @param selectedAccounts Explicitly selected accounts from config (may be undefined)
 * @returns Array of valid account emails to use for triggering
 */
export declare function resolveAccounts(selectedAccounts?: string[]): string[];
/**
 * Check if any accounts are available for triggering
 */
export declare function hasValidAccounts(selectedAccounts?: string[]): boolean;
/**
 * Get a friendly description of account resolution state
 */
export declare function getAccountResolutionStatus(selectedAccounts?: string[]): string;
