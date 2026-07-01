/**
 * Auto Wake-up types
 * Types for schedule configuration, trigger history, and reset state
 */
/**
 * Default configuration
 *
 * Default models trigger both Claude and Gemini families:
 * - claude-sonnet-4-5: Wakes up Claude family
 * - gemini-3-flash: Wakes up Gemini flash quota group
 * - gemini-3-pro-low: Wakes up Gemini pro quota group
 */
export function getDefaultConfig() {
    return {
        enabled: false,
        selectedModels: ['claude-sonnet-4-5', 'gemini-3-flash', 'gemini-3-pro-low'],
        selectedAccounts: undefined,
        customPrompt: undefined,
        maxOutputTokens: 1, // Minimal tokens to save quota
        scheduleMode: 'interval',
        intervalHours: 6,
        dailyTimes: ['09:00'],
        weeklySchedule: {},
        cronExpression: undefined,
        wakeOnReset: false,
        resetCooldownMinutes: 10
    };
}
//# sourceMappingURL=types.js.map