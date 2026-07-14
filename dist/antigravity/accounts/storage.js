/**
 * Account storage - file-based operations for multi-account
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import { getAccountsDir, getAccountDir } from '../core/env.js';
import { debug } from '../core/logger.js';
import { setPrivateDirectoryPermissions, setPrivateFilePermissions } from '../core/permissions.js';
/**
 * Ensure accounts directory exists
 */
export function ensureAccountsDir() {
    const dir = getAccountsDir();
    if (!existsSync(dir)) {
        debug('accounts-storage', `Creating accounts directory: ${dir}`);
        mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    setPrivateDirectoryPermissions(dir);
}
/**
 * Ensure specific account directory exists
 */
export function ensureAccountDir(email) {
    ensureAccountsDir();
    const dir = getAccountDir(email);
    if (!existsSync(dir)) {
        debug('accounts-storage', `Creating account directory: ${dir}`);
        mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    setPrivateDirectoryPermissions(dir);
}
/**
 * Check if an account exists
 */
export function accountExists(email) {
    const dir = getAccountDir(email);
    return existsSync(dir) && existsSync(join(dir, 'tokens.json'));
}
/**
 * List all account directories (by email)
 */
export function listAccountEmails() {
    const accountsDir = getAccountsDir();
    if (!existsSync(accountsDir)) {
        return [];
    }
    try {
        const entries = readdirSync(accountsDir, { withFileTypes: true });
        const emails = [];
        for (const entry of entries) {
            if (entry.isDirectory()) {
                // Check if it has a tokens.json file
                const tokensPath = join(accountsDir, entry.name, 'tokens.json');
                if (existsSync(tokensPath)) {
                    emails.push(entry.name);
                }
            }
        }
        return emails;
    }
    catch (err) {
        debug('accounts-storage', 'Failed to list accounts', err);
        return [];
    }
}
// ============================================================
// Token operations
// ============================================================
/**
 * Save tokens for an account
 */
export function saveAccountTokens(email, tokens) {
    ensureAccountDir(email);
    const path = join(getAccountDir(email), 'tokens.json');
    debug('accounts-storage', `Saving tokens for ${email}`);
    writeFileSync(path, JSON.stringify(tokens, null, 2), { mode: 0o600 });
    setPrivateFilePermissions(path);
}
/**
 * Load tokens for an account
 */
export function loadAccountTokens(email) {
    const path = join(getAccountDir(email), 'tokens.json');
    if (!existsSync(path)) {
        debug('accounts-storage', `No tokens file for ${email}`);
        return null;
    }
    try {
        setPrivateFilePermissions(path);
        const content = readFileSync(path, 'utf-8');
        return JSON.parse(content);
    }
    catch (err) {
        debug('accounts-storage', `Failed to parse tokens for ${email}`, err);
        return null;
    }
}
// ============================================================
// Metadata operations
// ============================================================
/**
 * Save metadata for an account
 */
export function saveAccountMetadata(email, metadata) {
    ensureAccountDir(email);
    const path = join(getAccountDir(email), 'metadata.json');
    debug('accounts-storage', `Saving metadata for ${email}`);
    writeFileSync(path, JSON.stringify(metadata, null, 2), { mode: 0o600 });
    setPrivateFilePermissions(path);
}
/**
 * Load metadata for an account
 */
export function loadAccountMetadata(email) {
    const path = join(getAccountDir(email), 'metadata.json');
    if (!existsSync(path)) {
        return null;
    }
    try {
        setPrivateFilePermissions(path);
        const content = readFileSync(path, 'utf-8');
        return JSON.parse(content);
    }
    catch (err) {
        debug('accounts-storage', `Failed to parse metadata for ${email}`, err);
        return null;
    }
}
/**
 * Update lastUsed timestamp for an account
 */
export function updateLastUsed(email) {
    const metadata = loadAccountMetadata(email);
    if (metadata) {
        metadata.lastUsed = new Date().toISOString();
        saveAccountMetadata(email, metadata);
    }
}
// ============================================================
// Cache operations
// ============================================================
/**
 * Save cached quota for an account
 */
export function saveAccountCache(email, cache) {
    ensureAccountDir(email);
    const path = join(getAccountDir(email), 'cache.json');
    debug('accounts-storage', `Saving cache for ${email}`);
    writeFileSync(path, JSON.stringify(cache, null, 2), { mode: 0o600 });
    setPrivateFilePermissions(path);
}
/**
 * Load cached quota for an account
 */
export function loadAccountCache(email) {
    const path = join(getAccountDir(email), 'cache.json');
    if (!existsSync(path)) {
        return null;
    }
    try {
        setPrivateFilePermissions(path);
        const content = readFileSync(path, 'utf-8');
        return JSON.parse(content);
    }
    catch (err) {
        debug('accounts-storage', `Failed to parse cache for ${email}`, err);
        return null;
    }
}
/**
 * Delete cache for an account
 */
export function deleteAccountCache(email) {
    const path = join(getAccountDir(email), 'cache.json');
    if (existsSync(path)) {
        try {
            rmSync(path);
            debug('accounts-storage', `Deleted cache for ${email}`);
        }
        catch (err) {
            debug('accounts-storage', `Failed to delete cache for ${email}`, err);
        }
    }
}
// ============================================================
// Account deletion
// ============================================================
/**
 * Delete an account and all its data
 */
export function deleteAccount(email) {
    const dir = getAccountDir(email);
    const relativePath = relative(getAccountsDir(), dir);
    if (!relativePath || relativePath.startsWith('..')) {
        throw new Error('Refusing to delete a path outside the accounts directory');
    }
    if (!existsSync(dir)) {
        debug('accounts-storage', `Account ${email} does not exist`);
        return false;
    }
    try {
        rmSync(dir, { recursive: true, force: true });
        debug('accounts-storage', `Deleted account ${email}`);
        return true;
    }
    catch (err) {
        debug('accounts-storage', `Failed to delete account ${email}`, err);
        return false;
    }
}
//# sourceMappingURL=storage.js.map