/**
 * Global configuration management
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { getGlobalConfigPath } from '../core/env.js';
import { debug } from '../core/logger.js';
import { DEFAULT_CONFIG } from './types.js';
/**
 * Load global config from disk
 */
export function loadConfig() {
    const path = getGlobalConfigPath();
    if (!existsSync(path)) {
        debug('config', 'No config file found, using defaults');
        return { ...DEFAULT_CONFIG };
    }
    try {
        const content = readFileSync(path, 'utf-8');
        const config = JSON.parse(content);
        // Merge with defaults to ensure all fields exist
        return {
            ...DEFAULT_CONFIG,
            ...config,
            preferences: {
                ...DEFAULT_CONFIG.preferences,
                ...config.preferences
            }
        };
    }
    catch (err) {
        debug('config', 'Failed to parse config, using defaults', err);
        return { ...DEFAULT_CONFIG };
    }
}
/**
 * Save global config to disk
 */
export function saveConfig(config) {
    const path = getGlobalConfigPath();
    const dir = dirname(path);
    // Ensure directory exists
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    debug('config', `Saving config to ${path}`);
    writeFileSync(path, JSON.stringify(config, null, 2));
}
/**
 * Get the active account email
 */
export function getActiveAccountEmail() {
    const config = loadConfig();
    return config.activeAccount;
}
/**
 * Set the active account email
 */
export function setActiveAccountEmail(email) {
    const config = loadConfig();
    config.activeAccount = email;
    saveConfig(config);
}
/**
 * Get cache TTL in seconds
 */
export function getCacheTTL() {
    const config = loadConfig();
    return config.preferences.cacheTTL;
}
//# sourceMappingURL=config.js.map