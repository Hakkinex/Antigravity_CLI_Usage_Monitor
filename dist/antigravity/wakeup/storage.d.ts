/**
 * Auto Wake-up storage service
 * Handles persistence of config, trigger history, reset state, and model mappings
 */
import type { WakeupConfig, TriggerRecord, ResetState, ModelMapping } from './types.js';
/**
 * Load wake-up configuration
 * Returns null if no config exists
 */
export declare function loadWakeupConfig(): WakeupConfig | null;
/**
 * Save wake-up configuration
 */
export declare function saveWakeupConfig(config: WakeupConfig): void;
/**
 * Get or create default config
 * Includes migration logic to update existing configs to new default models
 */
export declare function getOrCreateConfig(): WakeupConfig;
/**
 * Load trigger history
 */
export declare function loadTriggerHistory(): TriggerRecord[];
/**
 * Save trigger history
 */
export declare function saveTriggerHistory(history: TriggerRecord[]): void;
/**
 * Add a trigger record to history (maintains ring buffer)
 */
export declare function addTriggerRecord(record: TriggerRecord): void;
/**
 * Get recent trigger history
 */
export declare function getRecentHistory(limit?: number): TriggerRecord[];
/**
 * Get last trigger record
 */
export declare function getLastTrigger(): TriggerRecord | null;
/**
 * Clear trigger history
 */
export declare function clearTriggerHistory(): void;
/**
 * Load reset deduplication state
 */
export declare function loadResetState(): ResetState;
/**
 * Save reset state
 */
export declare function saveResetState(state: ResetState): void;
/**
 * Update reset state for a specific model
 */
export declare function updateResetState(modelKey: string, resetAt: string): void;
/**
 * Get reset state for a specific model
 */
export declare function getModelResetState(modelKey: string): {
    lastResetAt: string;
    lastTriggeredTime: string;
} | null;
/**
 * Clear reset state
 */
export declare function clearResetState(): void;
/**
 * Load model ID to constant mapping
 */
export declare function loadModelMapping(): ModelMapping;
/**
 * Save model mapping
 */
export declare function saveModelMapping(mapping: ModelMapping): void;
/**
 * Update model mapping with new entries
 * Merges with existing mappings
 */
export declare function updateModelMapping(newMappings: ModelMapping): void;
/**
 * Get model constant for a model ID
 */
export declare function getModelConstant(modelId: string): string | undefined;
/**
 * Get reset key for a model (uses constant if available, else ID)
 */
export declare function getResetKey(modelId: string): string;
