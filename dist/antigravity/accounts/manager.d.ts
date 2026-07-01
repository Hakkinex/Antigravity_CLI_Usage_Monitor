/**
 * Account manager - orchestrates multi-account operations
 */
import type { StoredTokens } from '../quota/types.js';
import type { AccountInfo, AccountStatus, AccountSummary } from './types.js';
/**
 * Account Manager - singleton class for managing multiple accounts
 */
export declare class AccountManager {
    private static instance;
    private constructor();
    static getInstance(): AccountManager;
    /**
     * Reset instance (for testing)
     */
    static resetInstance(): void;
    /**
     * Get all account emails
     */
    getAccountEmails(): string[];
    /**
     * Get active account email
     */
    getActiveEmail(): string | null;
    /**
     * Set active account
     */
    setActiveAccount(email: string): boolean;
    /**
     * Check if an account exists
     */
    hasAccount(email: string): boolean;
    /**
     * Get account status
     */
    getAccountStatus(email: string): AccountStatus;
    /**
     * Get detailed account info
     */
    getAccountInfo(email: string): AccountInfo | null;
    /**
     * Get account summaries for list display
     */
    getAccountSummaries(): AccountSummary[];
    /**
     * Add a new account after successful OAuth
     */
    addAccount(tokens: StoredTokens, email: string): void;
    /**
     * Update tokens for existing account
     */
    updateTokens(email: string, tokens: StoredTokens): void;
    /**
     * Remove an account
     */
    removeAccount(email: string): boolean;
    /**
     * Remove all accounts
     */
    removeAllAccounts(): number;
    /**
     * Get tokens for an account
     */
    getTokens(email: string): StoredTokens | null;
    /**
     * Get tokens for active account
     */
    getActiveTokens(): StoredTokens | null;
    /**
     * Check if cache is valid for an account
     */
    isCacheValid(email: string): boolean;
    /**
     * Get cache age in seconds
     */
    getCacheAge(email: string): number | null;
}
/**
 * Get account manager instance
 */
export declare function getAccountManager(): AccountManager;
