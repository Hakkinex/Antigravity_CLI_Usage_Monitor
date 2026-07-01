/**
 * Schedule converter for auto wake-up
 * Converts schedule configuration to cron expressions
 */
import type { WakeupConfig } from './types.js';
/**
 * Convert wakeup config to cron expression
 * @param config Wake-up configuration
 * @returns Cron expression string (5 fields: minute hour day month weekday)
 */
export declare function configToCronExpression(config: WakeupConfig): string;
/**
 * Validate a cron expression (basic validation)
 * @param expr Cron expression to validate
 * @returns true if valid, false otherwise
 */
export declare function validateCronExpression(expr: string): boolean;
/**
 * Get human-readable description of schedule
 */
export declare function getScheduleDescription(config: WakeupConfig): string;
/**
 * Calculate next run time from cron expression (simplified)
 * Returns a human-readable estimate
 */
export declare function getNextRunEstimate(cronExpression: string): string;
