import { getModelGroup, getModelStatus } from '../utils/status.js';
import { maskEmail } from '../utils/maskEmail.js';
export function parseAntigravityUsageJson(raw, config, method, source = 'antigravity-usage') {
    const accountsRaw = extractAccounts(raw);
    const accounts = accountsRaw.map((accountRaw, index) => normalizeAccount(accountRaw, index, config));
    return {
        fetchedAt: new Date().toISOString(),
        source,
        method,
        accounts,
        errors: []
    };
}
function extractAccounts(raw) {
    if (Array.isArray(raw))
        return raw;
    if (!isRecord(raw))
        return [];
    const candidates = [
        raw.accounts,
        raw.results,
        raw.data,
        isRecord(raw.data) ? raw.data.accounts : undefined,
        isRecord(raw.quota) ? raw.quota.accounts : undefined
    ];
    for (const candidate of candidates) {
        if (Array.isArray(candidate))
            return candidate;
    }
    if (looksLikeAccount(raw))
        return [raw];
    return [];
}
function normalizeAccount(raw, index, config) {
    const record = isRecord(raw) ? raw : {};
    const snapshotRecord = firstRecord(record, ['snapshot']);
    const email = firstString(record, ['email', 'account', 'accountEmail', 'user', 'userEmail']) ??
        (snapshotRecord ? firstString(snapshotRecord, ['email', 'account', 'accountEmail', 'user', 'userEmail']) : undefined);
    const alias = email ? config.accountAliases[email] : undefined;
    const displayName = alias ??
        (config.maskEmail && email ? maskEmail(email) : undefined) ??
        email ??
        `Account ${index + 1}`;
    const errorMessage = firstString(record, ['error', 'errorMessage', 'message']) ??
        (record.status === 'error' ? firstString(snapshotRecord ?? {}, ['error', 'errorMessage', 'message']) : undefined);
    const models = extractModels(record).map((modelRaw, modelIndex) => normalizeModel(modelRaw, modelIndex, config));
    return {
        id: email ?? `account-${index + 1}`,
        email,
        displayName,
        status: errorMessage ? 'error' : models.length === 0 ? 'warning' : 'ok',
        errorMessage,
        models
    };
}
function extractModels(record) {
    const snapshot = firstRecord(record, ['snapshot']);
    const candidates = [
        record.models,
        snapshot?.models,
        record.quotas,
        record.quota,
        snapshot?.quotas,
        snapshot?.quota,
        record.limits,
        snapshot?.limits,
        record.usage,
        snapshot?.usage
    ];
    for (const candidate of candidates) {
        if (Array.isArray(candidate))
            return candidate;
        if (isRecord(candidate)) {
            return Object.entries(candidate).map(([name, value]) => isRecord(value) ? { name, ...value } : { name, remainingPercent: value });
        }
    }
    return [];
}
function normalizeModel(raw, index, config) {
    const record = isRecord(raw) ? raw : {};
    const name = firstString(record, ['name', 'model', 'modelName', 'displayName', 'label', 'modelId']) ?? `Model ${index + 1}`;
    const remainingPercent = firstNumber(record, [
        'remainingPercent',
        'remainingPercentage',
        'remaining',
        'percent',
        'percentage',
        'remaining_percentage',
        'quotaRemainingPercent'
    ]);
    const resetInText = firstString(record, ['resetInText', 'resetsIn', 'resetIn', 'reset', 'resets_in']) ??
        formatResetFromMilliseconds(firstRawNumber(record, ['timeUntilResetMs'])) ??
        formatResetFromSeconds(firstRawNumber(record, ['resetInSeconds', 'resetSeconds', 'secondsUntilReset']));
    const resetAt = firstString(record, ['resetAt', 'resetTime', 'reset_at']);
    const weeklyRecord = firstRecord(record, ['weekly', 'week', 'weeklyQuota', 'weeklyUsage', 'weekUsage']);
    const weeklyRemainingPercent = firstNumber(record, [
        'weeklyRemainingPercent',
        'weekRemainingPercent',
        'weeklyRemaining',
        'weekRemaining',
        'weekly_percentage',
        'weeklyPercent'
    ]) ??
        (weeklyRecord
            ? firstNumber(weeklyRecord, [
                'remainingPercent',
                'remaining',
                'percent',
                'percentage',
                'remaining_percentage',
                'quotaRemainingPercent'
            ])
            : null);
    const weeklyResetInText = firstString(record, ['weeklyResetInText', 'weeklyResetsIn', 'weeklyResetIn', 'weekResetIn', 'weekResetsIn']) ??
        (weeklyRecord
            ? firstString(weeklyRecord, ['resetInText', 'resetsIn', 'resetIn', 'reset', 'resets_in'])
            : undefined) ??
        formatResetFromSeconds(firstRawNumber(record, ['weeklyResetInSeconds', 'weekResetInSeconds', 'weeklyResetSeconds']) ??
            (weeklyRecord
                ? firstRawNumber(weeklyRecord, ['resetInSeconds', 'resetSeconds', 'secondsUntilReset'])
                : null));
    const weeklyResetAt = firstString(record, ['weeklyResetAt', 'weekResetAt', 'weeklyResetTime']) ??
        (weeklyRecord ? firstString(weeklyRecord, ['resetAt', 'resetTime', 'reset_at']) : undefined);
    const group = getModelGroup(name);
    return {
        id: `${group}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        group,
        remainingPercent,
        resetInText,
        resetAt,
        status: getModelStatus(remainingPercent, config),
        weeklyRemainingPercent,
        weeklyResetInText,
        weeklyResetAt,
        weeklyStatus: getModelStatus(weeklyRemainingPercent, config)
    };
}
function looksLikeAccount(raw) {
    return Boolean(raw.email || raw.models || raw.quotas || raw.quota || (isRecord(raw.snapshot) && (raw.snapshot.email || raw.snapshot.models || raw.snapshot.quotas || raw.snapshot.quota)));
}
function firstString(record, keys) {
    for (const key of keys) {
        const value = record[key];
        if (typeof value === 'string' && value.trim())
            return value;
    }
    return undefined;
}
function firstRecord(record, keys) {
    for (const key of keys) {
        const value = record[key];
        if (isRecord(value))
            return value;
    }
    return undefined;
}
function firstNumber(record, keys) {
    for (const key of keys) {
        const value = record[key];
        if (typeof value === 'number' && Number.isFinite(value))
            return clampPercent(value);
        if (typeof value === 'string') {
            const parsed = Number.parseFloat(value.replace('%', ''));
            if (Number.isFinite(parsed))
                return clampPercent(parsed);
        }
    }
    return null;
}
function firstRawNumber(record, keys) {
    for (const key of keys) {
        const value = record[key];
        if (typeof value === 'number' && Number.isFinite(value))
            return value;
        if (typeof value === 'string') {
            const parsed = Number.parseFloat(value);
            if (Number.isFinite(parsed))
                return parsed;
        }
    }
    return null;
}
function clampPercent(value) {
    if (value <= 1 && value > 0)
        return Math.round(value * 100);
    return Math.max(0, Math.min(100, Math.round(value)));
}
function formatResetFromSeconds(seconds) {
    if (seconds === null)
        return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
function formatResetFromMilliseconds(milliseconds) {
    if (milliseconds === null)
        return null;
    return formatResetFromSeconds(Math.floor(milliseconds / 1000));
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=parseAntigravityUsageJson.js.map