/**
 * Local parser - converts Connect API response to QuotaSnapshot format
 */
import { debug } from '../core/logger.js';
/**
 * Parse Connect API user status into QuotaSnapshot format
 */
export function parseLocalQuotaSnapshot(userStatus) {
    debug('local-parser', 'Parsing local user status into QuotaSnapshot');
    const snapshot = {
        timestamp: new Date().toISOString(),
        method: 'local',
        email: userStatus.email,
        models: [],
        raw: userStatus.raw
    };
    // Parse prompt credits
    if (userStatus.quota?.promptCredits) {
        snapshot.promptCredits = parsePromptCredits(userStatus.quota.promptCredits);
    }
    // Parse models
    if (userStatus.quota?.models) {
        snapshot.models = userStatus.quota.models.map(parseModelQuota);
    }
    debug('local-parser', `Parsed ${snapshot.models.length} models`);
    return snapshot;
}
/**
 * Parse prompt credits from Connect API format
 */
function parsePromptCredits(credits) {
    if (!credits) {
        return undefined;
    }
    const limit = credits.limit ?? 0;
    const remaining = credits.remaining ?? limit;
    const used = credits.used ?? (limit - remaining);
    if (limit === 0) {
        return undefined;
    }
    const usedPercentage = limit > 0 ? used / limit : 0;
    const remainingPercentage = limit > 0 ? remaining / limit : 1;
    return {
        available: remaining,
        monthly: limit,
        usedPercentage,
        remainingPercentage
    };
}
/**
 * Parse a single model quota from Connect API format
 */
function parseModelQuota(model) {
    const quota = model.quota;
    return {
        name: model.modelId,
        displayName: model.displayName || model.label,
        label: model.label || model.displayName || model.modelId,
        modelId: model.modelId,
        remainingPercentage: quota?.remainingPercentage,
        isExhausted: model.isExhausted ?? (quota?.remainingPercentage === 0),
        resetTime: quota?.resetTime,
        timeUntilResetMs: quota?.timeUntilResetMs,
        isAutocompleteOnly: model.modelId.includes('gemini-2.5') ||
            (model.label || '').includes('Gemini 2.5') ||
            (model.displayName || '').includes('Gemini 2.5')
    };
}
//# sourceMappingURL=local-parser.js.map