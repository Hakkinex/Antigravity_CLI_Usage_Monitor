/**
 * Cron installer for auto wake-up
 * Manages cron job installation for macOS/Linux
 */
import type { CronInstallResult, CronStatus } from './types.js';
/**
 * Check if running on a supported platform
 */
export declare function isCronSupported(): boolean;
/**
 * Install cron job for scheduled wake-up
 * @param cronExpression Cron expression (5 fields: minute hour day month weekday)
 * @returns Installation result with success status or manual instructions
 */
export declare function installCronJob(cronExpression: string): Promise<CronInstallResult>;
/**
 * Uninstall cron job
 * @returns true if successful, false otherwise
 */
export declare function uninstallCronJob(): Promise<boolean>;
/**
 * Check if cron job is installed
 */
export declare function isCronJobInstalled(): Promise<boolean>;
/**
 * Get current cron job status
 */
export declare function getCronStatus(): Promise<CronStatus>;
