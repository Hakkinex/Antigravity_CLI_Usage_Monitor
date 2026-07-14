/**
 * Auto Wake-up storage service
 * Handles persistence of config, trigger history, reset state, and model mappings
 */
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { debug } from '../core/logger.js';
import { getConfigDir } from '../core/env.js';
import { setPrivateDirectoryPermissions, setPrivateFilePermissions } from '../core/permissions.js';
import { getDefaultConfig } from './types.js';
// Storage paths
const WAKEUP_DIR_NAME = 'wakeup';
const CONFIG_FILE_NAME = 'config.json';
const HISTORY_FILE_NAME = 'history.json';
const RESET_STATE_FILE_NAME = 'reset-state.json';
const MODEL_MAPPING_FILE_NAME = 'model-mapping.json';
// History ring buffer size
const MAX_HISTORY_ENTRIES = 100;
/**
 * Get wakeup storage directory path
 */
function getWakeupDir() {
    return join(getConfigDir(), WAKEUP_DIR_NAME);
}
/**
 * Ensure wakeup directory exists
 */
function ensureWakeupDir() {
    const dir = getWakeupDir();
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true, mode: 0o700 });
        debug('wakeup-storage', `Created wakeup directory: ${dir}`);
    }
    setPrivateDirectoryPermissions(dir);
}
/**
 * Generic JSON file reader
 */
function readJsonFile(filename, defaultValue) {
    const filepath = join(getWakeupDir(), filename);
    try {
        if (existsSync(filepath)) {
            setPrivateFilePermissions(filepath);
            const content = readFileSync(filepath, 'utf-8');
            return JSON.parse(content);
        }
    }
    catch (err) {
        debug('wakeup-storage', `Error reading ${filename}:`, err);
    }
    return defaultValue;
}
/**
 * Generic JSON file writer
 */
function writeJsonFile(filename, data) {
    ensureWakeupDir();
    const filepath = join(getWakeupDir(), filename);
    try {
        writeFileSync(filepath, JSON.stringify(data, null, 2), { encoding: 'utf-8', mode: 0o600 });
        setPrivateFilePermissions(filepath);
        debug('wakeup-storage', `Wrote ${filename}`);
    }
    catch (err) {
        debug('wakeup-storage', `Error writing ${filename}:`, err);
        throw err;
    }
}
// ============================================================================
// Config Operations
// ============================================================================
/**
 * Load wake-up configuration
 * Returns null if no config exists
 */
export function loadWakeupConfig() {
    const config = readJsonFile(CONFIG_FILE_NAME, null);
    if (config) {
        debug('wakeup-storage', 'Loaded wakeup config');
    }
    return config;
}
/**
 * Save wake-up configuration
 */
export function saveWakeupConfig(config) {
    writeJsonFile(CONFIG_FILE_NAME, config);
    debug('wakeup-storage', 'Saved wakeup config');
}
/**
 * Get or create default config
 * Includes migration logic to update existing configs to new default models
 */
export function getOrCreateConfig() {
    const existing = loadWakeupConfig();
    if (existing) {
        // Auto-migrate to new default models if selectedModels is empty
        // This ensures both Claude and Gemini families (both quota groups) are triggered
        if (!existing.selectedModels || existing.selectedModels.length === 0) {
            existing.selectedModels = ['claude-sonnet-4-5', 'gemini-3-flash', 'gemini-3-pro-low'];
            saveWakeupConfig(existing);
            debug('wakeup-storage', 'Migrated config to new default models');
        }
        return existing;
    }
    const defaultConfig = getDefaultConfig();
    saveWakeupConfig(defaultConfig);
    return defaultConfig;
}
// ============================================================================
// History Operations
// ============================================================================
/**
 * Load trigger history
 */
export function loadTriggerHistory() {
    return readJsonFile(HISTORY_FILE_NAME, []);
}
/**
 * Save trigger history
 */
export function saveTriggerHistory(history) {
    writeJsonFile(HISTORY_FILE_NAME, history);
}
/**
 * Add a trigger record to history (maintains ring buffer)
 */
export function addTriggerRecord(record) {
    const history = loadTriggerHistory();
    // Add new record at the beginning
    history.unshift(record);
    // Trim to max entries
    if (history.length > MAX_HISTORY_ENTRIES) {
        history.splice(MAX_HISTORY_ENTRIES);
    }
    saveTriggerHistory(history);
    debug('wakeup-storage', `Added trigger record (total: ${history.length})`);
}
/**
 * Get recent trigger history
 */
export function getRecentHistory(limit = 10) {
    const history = loadTriggerHistory();
    return history.slice(0, limit);
}
/**
 * Get last trigger record
 */
export function getLastTrigger() {
    const history = loadTriggerHistory();
    return history.length > 0 ? history[0] : null;
}
/**
 * Clear trigger history
 */
export function clearTriggerHistory() {
    saveTriggerHistory([]);
    debug('wakeup-storage', 'Cleared trigger history');
}
// ============================================================================
// Reset State Operations
// ============================================================================
/**
 * Load reset deduplication state
 */
export function loadResetState() {
    return readJsonFile(RESET_STATE_FILE_NAME, {});
}
/**
 * Save reset state
 */
export function saveResetState(state) {
    writeJsonFile(RESET_STATE_FILE_NAME, state);
}
/**
 * Update reset state for a specific model
 */
export function updateResetState(modelKey, resetAt) {
    const state = loadResetState();
    state[modelKey] = {
        lastResetAt: resetAt,
        lastTriggeredTime: new Date().toISOString()
    };
    saveResetState(state);
    debug('wakeup-storage', `Updated reset state for ${modelKey}`);
}
/**
 * Get reset state for a specific model
 */
export function getModelResetState(modelKey) {
    const state = loadResetState();
    return state[modelKey] || null;
}
/**
 * Clear reset state
 */
export function clearResetState() {
    saveResetState({});
    debug('wakeup-storage', 'Cleared reset state');
}
// ============================================================================
// Model Mapping Operations
// ============================================================================
/**
 * Load model ID to constant mapping
 */
export function loadModelMapping() {
    return readJsonFile(MODEL_MAPPING_FILE_NAME, {});
}
/**
 * Save model mapping
 */
export function saveModelMapping(mapping) {
    writeJsonFile(MODEL_MAPPING_FILE_NAME, mapping);
    debug('wakeup-storage', `Saved model mapping (${Object.keys(mapping).length} models)`);
}
/**
 * Update model mapping with new entries
 * Merges with existing mappings
 */
export function updateModelMapping(newMappings) {
    const existing = loadModelMapping();
    const merged = { ...existing, ...newMappings };
    saveModelMapping(merged);
}
/**
 * Get model constant for a model ID
 */
export function getModelConstant(modelId) {
    const mapping = loadModelMapping();
    return mapping[modelId];
}
/**
 * Get reset key for a model (uses constant if available, else ID)
 */
export function getResetKey(modelId) {
    return getModelConstant(modelId) || modelId;
}
//# sourceMappingURL=storage.js.map