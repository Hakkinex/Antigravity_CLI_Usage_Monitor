/**
 * Global configuration management
 */
import { type GlobalConfig } from './types.js';
/**
 * Load global config from disk
 */
export declare function loadConfig(): GlobalConfig;
/**
 * Save global config to disk
 */
export declare function saveConfig(config: GlobalConfig): void;
/**
 * Get the active account email
 */
export declare function getActiveAccountEmail(): string | null;
/**
 * Set the active account email
 */
export declare function setActiveAccountEmail(email: string | null): void;
/**
 * Get cache TTL in seconds
 */
export declare function getCacheTTL(): number;
