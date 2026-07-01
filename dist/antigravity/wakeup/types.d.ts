/**
 * Auto Wake-up types
 * Types for schedule configuration, trigger history, and reset state
 */
/**
 * Main wake-up configuration
 */
export interface WakeupConfig {
    enabled: boolean;
    selectedModels: string[];
    selectedAccounts?: string[];
    customPrompt?: string;
    maxOutputTokens: number;
    scheduleMode: ScheduleMode;
    intervalHours?: number;
    dailyTimes?: string[];
    weeklySchedule?: WeeklySchedule;
    cronExpression?: string;
    wakeOnReset: boolean;
    resetCooldownMinutes: number;
}
/**
 * Weekly schedule - maps day number to array of times
 * Day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday
 */
export interface WeeklySchedule {
    [day: number]: string[];
}
/**
 * Schedule mode types
 */
export type ScheduleMode = 'interval' | 'daily' | 'weekly' | 'custom';
/**
 * Default configuration
 *
 * Default models trigger both Claude and Gemini families:
 * - claude-sonnet-4-5: Wakes up Claude family
 * - gemini-3-flash: Wakes up Gemini flash quota group
 * - gemini-3-pro-low: Wakes up Gemini pro quota group
 */
export declare function getDefaultConfig(): WakeupConfig;
/**
 * Trigger type - manual (user initiated) or auto (scheduled/reset-based)
 */
export type TriggerType = 'manual' | 'auto';
/**
 * Trigger source - how the trigger was initiated
 */
export type TriggerSource = 'manual' | 'scheduled' | 'quota_reset';
/**
 * Token usage information from API response
 */
export interface TokenUsage {
    prompt: number;
    completion: number;
    total: number;
}
/**
 * Single trigger history record
 */
export interface TriggerRecord {
    timestamp: string;
    success: boolean;
    triggerType: TriggerType;
    triggerSource: TriggerSource;
    models: string[];
    accountEmail: string;
    durationMs: number;
    prompt: string;
    response?: string;
    error?: string;
    tokensUsed?: TokenUsage;
}
/**
 * State for a single model's reset tracking
 */
export interface ModelResetState {
    lastResetAt: string;
    lastTriggeredTime: string;
}
/**
 * Reset deduplication state - keyed by model reset key
 * Key is modelConstant if available, otherwise modelId
 */
export interface ResetState {
    [modelResetKey: string]: ModelResetState;
}
/**
 * Mapping from model ID to model constant
 * Used for quota reset deduplication
 */
export interface ModelMapping {
    [modelId: string]: string;
}
/**
 * Options for executing a trigger
 */
export interface TriggerOptions {
    models: string[];
    accountEmail: string;
    triggerType: TriggerType;
    triggerSource: TriggerSource;
    customPrompt?: string;
    maxOutputTokens?: number;
}
/**
 * Result from triggering a single model
 */
export interface ModelTriggerResult {
    modelId: string;
    success: boolean;
    durationMs: number;
    response?: string;
    error?: string;
    tokensUsed?: TokenUsage;
}
/**
 * Overall trigger execution result
 */
export interface TriggerResult {
    success: boolean;
    results: ModelTriggerResult[];
}
/**
 * Result from cron installation attempt
 */
export interface CronInstallResult {
    success: boolean;
    cronExpression?: string;
    manualInstructions?: string;
    error?: string;
}
/**
 * Status of cron installation
 */
export interface CronStatus {
    installed: boolean;
    cronExpression?: string;
    nextRun?: string;
}
/**
 * Result from reset detection
 */
export interface DetectionResult {
    triggered: boolean;
    triggeredModels: string[];
}
