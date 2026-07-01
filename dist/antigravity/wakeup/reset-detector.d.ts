/**
 * Reset detector for auto wake-up
 *
 * Smart trigger logic:
 * - Triggers ALL available models from quota snapshot
 * - Triggers for ALL valid accounts
 * - Only triggers when model is "unused": 100% remaining AND ~5h until reset
 */
import type { QuotaSnapshot, ModelQuotaInfo } from '../quota/types.js';
import type { DetectionResult } from './types.js';
/**
 * Check if a model is "unused" and should be triggered
 *
 * Unused = 100% quota remaining AND reset time is approximately 5 hours
 * (meaning the model hasn't been used this quota cycle)
 */
export declare function isModelUnused(model: ModelQuotaInfo): boolean;
/**
 * Detect unused models and trigger wake-up for all accounts
 *
 * New smart logic:
 * 1. Check ALL models in the quota snapshot
 * 2. Find models that are "unused" (100% + ~5h reset)
 * 3. Trigger for ALL valid accounts
 */
export declare function detectResetAndTrigger(snapshot: QuotaSnapshot): Promise<DetectionResult>;
/**
 * Get list of unused models for display/testing
 */
export declare function findUnusedModels(snapshot: QuotaSnapshot): ModelQuotaInfo[];
/**
 * Check if any models need triggering (for status display)
 */
export declare function hasUnusedModels(snapshot: QuotaSnapshot): boolean;
