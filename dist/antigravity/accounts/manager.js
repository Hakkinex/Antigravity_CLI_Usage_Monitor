/**
 * Account manager - orchestrates multi-account operations
 */
import { debug } from '../core/logger.js';
import { listAccountEmails, loadAccountTokens, saveAccountTokens, loadAccountMetadata, saveAccountMetadata, accountExists, deleteAccount as deleteAccountDir, updateLastUsed } from './storage.js';
import { getActiveAccountEmail, setActiveAccountEmail } from './config.js';
import { isCacheValid, loadCacheWithMeta, getCacheAge } from './cache.js';
// Refresh token 5 minutes before expiry
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;
/**
 * Account Manager - singleton class for managing multiple accounts
 */
export class AccountManager {
    static instance = null;
    constructor() { }
    static getInstance() {
        if (!AccountManager.instance) {
            AccountManager.instance = new AccountManager();
        }
        return AccountManager.instance;
    }
    /**
     * Reset instance (for testing)
     */
    static resetInstance() {
        AccountManager.instance = null;
    }
    /**
     * Get all account emails
     */
    getAccountEmails() {
        return listAccountEmails();
    }
    /**
     * Get active account email
     */
    getActiveEmail() {
        return getActiveAccountEmail();
    }
    /**
     * Set active account
     */
    setActiveAccount(email) {
        if (!accountExists(email)) {
            debug('account-manager', `Account ${email} does not exist`);
            return false;
        }
        setActiveAccountEmail(email);
        updateLastUsed(email);
        debug('account-manager', `Switched to account ${email}`);
        return true;
    }
    /**
     * Check if an account exists
     */
    hasAccount(email) {
        return accountExists(email);
    }
    /**
     * Get account status
     */
    getAccountStatus(email) {
        const tokens = loadAccountTokens(email);
        if (!tokens) {
            return 'invalid';
        }
        // Check if token is expired
        const now = Date.now();
        if (now >= tokens.expiresAt - EXPIRY_BUFFER_MS) {
            // Expired, but might have refresh token
            if (tokens.refreshToken) {
                return 'expired'; // Can be refreshed
            }
            return 'invalid';
        }
        return 'valid';
    }
    /**
     * Get detailed account info
     */
    getAccountInfo(email) {
        if (!accountExists(email)) {
            return null;
        }
        const activeEmail = getActiveAccountEmail();
        const tokens = loadAccountTokens(email);
        const metadata = loadAccountMetadata(email);
        const cache = loadCacheWithMeta(email);
        const status = this.getAccountStatus(email);
        return {
            email,
            isActive: email === activeEmail,
            tokens,
            metadata,
            cache,
            status
        };
    }
    /**
     * Get account summaries for list display
     */
    getAccountSummaries() {
        const emails = this.getAccountEmails();
        const activeEmail = getActiveAccountEmail();
        return emails.map(email => {
            const metadata = loadAccountMetadata(email);
            const cache = loadCacheWithMeta(email);
            const status = this.getAccountStatus(email);
            // Extract credits from cache if available
            let cachedCredits = null;
            if (cache?.data?.promptCredits) {
                const pc = cache.data.promptCredits;
                cachedCredits = {
                    used: pc.monthly - pc.available,
                    limit: pc.monthly
                };
            }
            return {
                email,
                isActive: email === activeEmail,
                status,
                lastUsed: metadata?.lastUsed || null,
                cachedCredits
            };
        });
    }
    /**
     * Add a new account after successful OAuth
     */
    addAccount(tokens, email) {
        debug('account-manager', `Adding account ${email}`);
        // Save tokens
        saveAccountTokens(email, tokens);
        // Create metadata
        const now = new Date().toISOString();
        const metadata = {
            email,
            addedAt: now,
            lastUsed: now
        };
        saveAccountMetadata(email, metadata);
        // Set as active account
        setActiveAccountEmail(email);
        debug('account-manager', `Account ${email} added and set as active`);
    }
    /**
     * Update tokens for existing account
     */
    updateTokens(email, tokens) {
        if (!accountExists(email)) {
            debug('account-manager', `Cannot update tokens: account ${email} does not exist`);
            return;
        }
        saveAccountTokens(email, tokens);
        updateLastUsed(email);
        debug('account-manager', `Updated tokens for ${email}`);
    }
    /**
     * Remove an account
     */
    removeAccount(email) {
        if (!accountExists(email)) {
            debug('account-manager', `Account ${email} does not exist`);
            return false;
        }
        // If removing active account, clear active
        const activeEmail = getActiveAccountEmail();
        if (email === activeEmail) {
            setActiveAccountEmail(null);
        }
        const deleted = deleteAccountDir(email);
        // If we deleted the active and there are other accounts, set first as active
        if (deleted && email === activeEmail) {
            const remaining = this.getAccountEmails();
            if (remaining.length > 0) {
                setActiveAccountEmail(remaining[0]);
                debug('account-manager', `Set ${remaining[0]} as new active account`);
            }
        }
        return deleted;
    }
    /**
     * Remove all accounts
     */
    removeAllAccounts() {
        const emails = this.getAccountEmails();
        let count = 0;
        for (const email of emails) {
            if (deleteAccountDir(email)) {
                count++;
            }
        }
        setActiveAccountEmail(null);
        debug('account-manager', `Removed ${count} accounts`);
        return count;
    }
    /**
     * Get tokens for an account
     */
    getTokens(email) {
        return loadAccountTokens(email);
    }
    /**
     * Get tokens for active account
     */
    getActiveTokens() {
        const email = getActiveAccountEmail();
        if (!email) {
            return null;
        }
        return loadAccountTokens(email);
    }
    /**
     * Check if cache is valid for an account
     */
    isCacheValid(email) {
        return isCacheValid(email);
    }
    /**
     * Get cache age in seconds
     */
    getCacheAge(email) {
        return getCacheAge(email);
    }
}
/**
 * Get account manager instance
 */
export function getAccountManager() {
    return AccountManager.getInstance();
}
//# sourceMappingURL=manager.js.map