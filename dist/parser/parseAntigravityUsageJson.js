import { getModelGroup, getModelStatus } from '../utils/status.js';
import { maskEmail } from '../utils/maskEmail.js';
export function parseAntigravityUsageJson(raw, config, method, source = 'antigravity') {
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
    const bestQuota = selectBestQuota(record);
    const weeklyQuota = selectWeeklyQuota(record);
    const group = getModelGroup(name);
    return {
        id: `${group}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        group,
        remainingPercent: bestQuota.remainingPercent,
        resetInText: bestQuota.resetInText,
        resetAt: bestQuota.resetAt,
        status: getModelStatus(bestQuota.remainingPercent, config),
        weeklyRemainingPercent: weeklyQuota.remainingPercent,
        weeklyResetInText: weeklyQuota.resetInText,
        weeklyResetAt: weeklyQuota.resetAt,
        weeklyStatus: getModelStatus(weeklyQuota.remainingPercent, config),
        isAutocompleteOnly: firstBoolean(record, ['isAutocompleteOnly'])
    };
}
const PERCENT_KEYS = [
    'remainingPercent',
    'remainingPercentage',
    'remaining',
    'percent',
    'percentage',
    'remaining_percentage',
    'quotaRemainingPercent',
    'remainingFraction'
];
const RESET_TEXT_KEYS = ['resetInText', 'resetsIn', 'resetIn', 'reset', 'resets_in'];
const RESET_AT_KEYS = ['resetAt', 'resetTime', 'reset_at'];
function selectBestQuota(record) {
    const candidates = collectQuotaCandidates(record).filter((candidate) => candidate.remainingPercent !== null || candidate.resetInText !== null || candidate.resetAt !== null);
    if (candidates.length === 0) {
        return {
            remainingPercent: null,
            resetInText: null,
            resetAt: null
        };
    }
    return candidates.reduce((best, candidate) => {
        if (best.remainingPercent === null)
            return candidate;
        if (candidate.remainingPercent === null)
            return best;
        return candidate.remainingPercent < best.remainingPercent ? candidate : best;
    });
}
function selectWeeklyQuota(record) {
    const windows = firstRecord(record, ['windows']);
    if (windows) {
        const weeklyWindow = firstRecord(windows, ['weekly', 'week']);
        if (weeklyWindow) {
            return readQuotaCandidate(weeklyWindow);
        }
    }
    return readLegacyWeeklyCandidate(record);
}
function collectQuotaCandidates(record) {
    const candidates = [readQuotaCandidate(record)];
    const windows = firstRecord(record, ['windows']);
    if (windows) {
        for (const value of Object.values(windows)) {
            if (isRecord(value))
                candidates.push(readQuotaCandidate(value));
        }
    }
    const quotaInfos = record.quotaInfos;
    if (Array.isArray(quotaInfos)) {
        for (const quotaInfo of quotaInfos) {
            if (isRecord(quotaInfo))
                candidates.push(readQuotaCandidate(quotaInfo));
        }
    }
    const directRecords = ['quotaInfo', 'weekly', 'week', 'weeklyQuota', 'weeklyUsage', 'weekUsage'];
    for (const key of directRecords) {
        const child = firstRecord(record, [key]);
        if (child)
            candidates.push(readQuotaCandidate(child));
    }
    const legacyWeekly = readLegacyWeeklyCandidate(record);
    if (legacyWeekly.remainingPercent !== null || legacyWeekly.resetInText !== null || legacyWeekly.resetAt !== null) {
        candidates.push(legacyWeekly);
    }
    return dedupeCandidates(candidates);
}
function readQuotaCandidate(record) {
    return {
        remainingPercent: readPercent(record),
        resetInText: firstString(record, RESET_TEXT_KEYS) ??
            formatResetFromMilliseconds(firstRawNumber(record, ['timeUntilResetMs', 'resetInMs'])) ??
            formatResetFromSeconds(firstRawNumber(record, ['resetInSeconds', 'resetSeconds', 'secondsUntilReset'])) ??
            formatResetFromTimestamp(firstString(record, RESET_AT_KEYS)),
        resetAt: firstString(record, RESET_AT_KEYS) ?? null
    };
}
function readLegacyWeeklyCandidate(record) {
    return {
        remainingPercent: readPercent(record, [
            'weeklyRemainingPercent',
            'weeklyRemainingPercentage',
            'weekRemainingPercent',
            'weekRemainingPercentage',
            'weeklyRemaining',
            'weekRemaining',
            'weekly_percentage',
            'weeklyPercent'
        ]),
        resetInText: firstString(record, ['weeklyResetInText', 'weeklyResetsIn', 'weeklyResetIn', 'weekResetIn', 'weekResetsIn']) ??
            formatResetFromMilliseconds(firstRawNumber(record, ['weeklyTimeUntilResetMs', 'weekTimeUntilResetMs', 'weeklyResetInMs'])) ??
            formatResetFromSeconds(firstRawNumber(record, ['weeklyResetInSeconds', 'weekResetInSeconds', 'weeklyResetSeconds'])) ??
            formatResetFromTimestamp(firstString(record, ['weeklyResetTime', 'weeklyResetAt', 'weekResetTime', 'weekResetAt'])),
        resetAt: firstString(record, ['weeklyResetAt', 'weekResetAt', 'weeklyResetTime']) ?? null
    };
}
function readPercent(record, keys = PERCENT_KEYS) {
    const percent = firstNumber(record, keys);
    if (percent !== null)
        return percent;
    const isExhausted = firstBoolean(record, ['isExhausted', 'exhausted']);
    return isExhausted ? 0 : null;
}
function dedupeCandidates(candidates) {
    const seen = new Set();
    return candidates.filter((candidate) => {
        const key = JSON.stringify(candidate);
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
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
function firstBoolean(record, keys) {
    for (const key of keys) {
        const value = record[key];
        if (typeof value === 'boolean')
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
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) {
        return hours > 0 ? `${days}d ${hours}h ${minutes}m` : `${days}d ${minutes}m`;
    }
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
function formatResetFromMilliseconds(milliseconds) {
    if (milliseconds === null)
        return null;
    return formatResetFromSeconds(Math.floor(milliseconds / 1000));
}
function formatResetFromTimestamp(timestamp) {
    if (!timestamp)
        return null;
    const resetMs = new Date(timestamp).getTime();
    if (!Number.isFinite(resetMs))
        return null;
    const diffSeconds = Math.floor((resetMs - Date.now()) / 1000);
    return formatResetFromSeconds(Math.max(0, diffSeconds));
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=parseAntigravityUsageJson.js.map