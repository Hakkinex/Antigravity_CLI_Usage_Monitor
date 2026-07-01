/**
 * Trigger service for auto wake-up
 * Executes actual AI requests to warm up models
 */
import type { TriggerOptions, TriggerResult, ModelTriggerResult } from './types.js';
/**
 * Execute trigger for specified models and account
 * @param options Trigger options including models, account, and prompt
 * @returns Trigger result with success status and per-model results
 */
export declare function executeTrigger(options: TriggerOptions): Promise<TriggerResult>;
/**
 * Execute a quick test trigger (for manual testing)
 * @param modelId Model to test
 * @param accountEmail Account to use
 * @param prompt Optional custom prompt
 */
export declare function testTrigger(modelId: string, accountEmail: string, prompt?: string): Promise<ModelTriggerResult>;
