import type { AccountQuota, ModelQuota, MonitorConfig, MonitorSnapshot } from '../types.js';
import { getModelGroup, getModelStatus } from '../utils/status.js';
import { maskEmail } from '../utils/maskEmail.js';

type AnyRecord = Record<string, unknown>;

export function parseAntigravityUsageJson(
  raw: unknown,
  config: MonitorConfig,
  method: string,
  source: 'antigravity' | 'mock' = 'antigravity'
): MonitorSnapshot {
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

function extractAccounts(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!isRecord(raw)) return [];

  const candidates = [
    raw.accounts,
    raw.results,
    raw.data,
    isRecord(raw.data) ? raw.data.accounts : undefined,
    isRecord(raw.quota) ? raw.quota.accounts : undefined
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  if (looksLikeAccount(raw)) return [raw];
  return [];
}

function normalizeAccount(raw: unknown, index: number, config: MonitorConfig): AccountQuota {
  const record = isRecord(raw) ? raw : {};
  const snapshotRecord = firstRecord(record, ['snapshot']);
  const email =
    firstString(record, ['email', 'account', 'accountEmail', 'user', 'userEmail']) ??
    (snapshotRecord ? firstString(snapshotRecord, ['email', 'account', 'accountEmail', 'user', 'userEmail']) : undefined);
  const alias = email ? config.accountAliases[email] : undefined;
  const displayName =
    alias ??
    (config.maskEmail && email ? maskEmail(email) : undefined) ??
    email ??
    `Account ${index + 1}`;
  const errorMessage =
    firstString(record, ['error', 'errorMessage', 'message']) ??
    (record.status === 'error' ? firstString(snapshotRecord ?? {}, ['error', 'errorMessage', 'message']) : undefined);
  const models = extractModels(record).map((modelRaw, modelIndex) =>
    normalizeModel(modelRaw, modelIndex, config)
  );

  return {
    id: email ?? `account-${index + 1}`,
    email,
    displayName,
    status: errorMessage ? 'error' : models.length === 0 ? 'warning' : 'ok',
    errorMessage,
    models
  };
}

function extractModels(record: AnyRecord): unknown[] {
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
    if (Array.isArray(candidate)) return candidate;
    if (isRecord(candidate)) {
      return Object.entries(candidate).map(([name, value]) =>
        isRecord(value) ? { name, ...value } : { name, remainingPercent: value }
      );
    }
  }

  return [];
}

function normalizeModel(raw: unknown, index: number, config: MonitorConfig): ModelQuota {
  const record = isRecord(raw) ? raw : {};
  const fiveHourRecord = findQuotaWindow(record, 'fiveHour');
  const weeklyWindowRecord = findQuotaWindow(record, 'weekly');
  const name = firstString(record, ['name', 'model', 'modelName', 'displayName', 'label', 'modelId']) ?? `Model ${index + 1}`;
  const remainingPercent =
    firstNumber(record, [
      'remainingPercent',
      'remainingPercentage',
      'remaining',
      'percent',
      'percentage',
      'remaining_percentage',
      'quotaRemainingPercent'
    ]) ?? (fiveHourRecord ? firstNumber(fiveHourRecord, PERCENT_KEYS) : null);
  const resetInText =
    firstString(record, ['resetInText', 'resetsIn', 'resetIn', 'reset', 'resets_in']) ??
    (fiveHourRecord ? firstString(fiveHourRecord, RESET_TEXT_KEYS) : undefined) ??
    formatResetFromMilliseconds(
      firstRawNumber(record, ['timeUntilResetMs']) ??
        (fiveHourRecord ? firstRawNumber(fiveHourRecord, ['timeUntilResetMs', 'resetInMs']) : null)
    ) ??
    formatResetFromSeconds(
      firstRawNumber(record, ['resetInSeconds', 'resetSeconds', 'secondsUntilReset']) ??
        (fiveHourRecord ? firstRawNumber(fiveHourRecord, ['resetInSeconds', 'resetSeconds', 'secondsUntilReset']) : null)
    ) ??
    formatResetFromTimestamp(
      firstString(record, ['resetAt', 'resetTime', 'reset_at']) ??
        (fiveHourRecord ? firstString(fiveHourRecord, RESET_AT_KEYS) : undefined)
    );
  const resetAt =
    firstString(record, ['resetAt', 'resetTime', 'reset_at']) ??
    (fiveHourRecord ? firstString(fiveHourRecord, RESET_AT_KEYS) : undefined);
  const weeklyRecord = firstRecord(record, ['weekly', 'week', 'weeklyQuota', 'weeklyUsage', 'weekUsage']) ?? weeklyWindowRecord;
  const weeklyRemainingPercent =
    firstNumber(record, [
      'weeklyRemainingPercent',
      'weeklyRemainingPercentage',
      'weekRemainingPercent',
      'weekRemainingPercentage',
      'weeklyRemaining',
      'weekRemaining',
      'weekly_percentage',
      'weeklyPercent'
    ]) ?? (weeklyRecord ? firstNumber(weeklyRecord, PERCENT_KEYS) : null);
  const weeklyResetInText =
    firstString(record, ['weeklyResetInText', 'weeklyResetsIn', 'weeklyResetIn', 'weekResetIn', 'weekResetsIn']) ??
    (weeklyRecord ? firstString(weeklyRecord, RESET_TEXT_KEYS) : undefined) ??
    formatResetFromMilliseconds(
      firstRawNumber(record, ['weeklyTimeUntilResetMs', 'weekTimeUntilResetMs', 'weeklyResetInMs']) ??
        (weeklyRecord ? firstRawNumber(weeklyRecord, ['timeUntilResetMs', 'resetInMs']) : null)
    ) ??
    formatResetFromSeconds(
      firstRawNumber(record, ['weeklyResetInSeconds', 'weekResetInSeconds', 'weeklyResetSeconds']) ??
        (weeklyRecord ? firstRawNumber(weeklyRecord, ['resetInSeconds', 'resetSeconds', 'secondsUntilReset']) : null)
    ) ??
    formatResetFromTimestamp(
      firstString(record, ['weeklyResetTime', 'weeklyResetAt', 'weekResetTime', 'weekResetAt']) ??
        (weeklyRecord ? firstString(weeklyRecord, RESET_AT_KEYS) : undefined)
    );
  const weeklyResetAt =
    firstString(record, ['weeklyResetAt', 'weekResetAt', 'weeklyResetTime']) ??
    (weeklyRecord ? firstString(weeklyRecord, RESET_AT_KEYS) : undefined);
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

function findQuotaWindow(record: AnyRecord, target: 'fiveHour' | 'weekly'): AnyRecord | undefined {
  const windows = firstRecord(record, ['windows']);
  if (windows) {
    for (const [key, value] of Object.entries(windows)) {
      if (isRecord(value) && classifyWindowKey(key, value) === target) return value;
    }
  }

  const quotaInfos = record.quotaInfos;
  if (Array.isArray(quotaInfos)) {
    for (const quotaInfo of quotaInfos) {
      if (isRecord(quotaInfo) && classifyWindowKey('', quotaInfo) === target) return quotaInfo;
    }
  }

  const quotaInfo = firstRecord(record, ['quotaInfo']);
  if (quotaInfo && target === 'fiveHour') return quotaInfo;
  return undefined;
}

function classifyWindowKey(key: string, record: AnyRecord): 'fiveHour' | 'weekly' | 'unknown' {
  const combined = [
    key,
    firstString(record, ['id', 'windowId', 'window_id']),
    firstString(record, ['label', 'windowLabel', 'window_label'])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (combined.includes('week')) return 'weekly';
  if (
    combined.includes('five') ||
    combined.includes('5h') ||
    combined.includes('5 hour') ||
    combined.includes('5-hour') ||
    combined.includes('fivehour')
  ) {
    return 'fiveHour';
  }

  return 'unknown';
}
function looksLikeAccount(raw: AnyRecord): boolean {
  return Boolean(raw.email || raw.models || raw.quotas || raw.quota || (isRecord(raw.snapshot) && (raw.snapshot.email || raw.snapshot.models || raw.snapshot.quotas || raw.snapshot.quota)));
}

function firstString(record: AnyRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

function firstRecord(record: AnyRecord, keys: string[]): AnyRecord | undefined {
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) return value;
  }
  return undefined;
}

function firstNumber(record: AnyRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return clampPercent(value);
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value.replace('%', ''));
      if (Number.isFinite(parsed)) return clampPercent(parsed);
    }
  }
  return null;
}

function firstRawNumber(record: AnyRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function clampPercent(value: number): number {
  if (value <= 1 && value > 0) return Math.round(value * 100);
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatResetFromSeconds(seconds: number | null): string | null {
  if (seconds === null) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatResetFromMilliseconds(milliseconds: number | null): string | null {
  if (milliseconds === null) return null;
  return formatResetFromSeconds(Math.floor(milliseconds / 1000));
}

function formatResetFromTimestamp(timestamp: string | undefined): string | null {
  if (!timestamp) return null;
  const resetMs = new Date(timestamp).getTime();
  if (!Number.isFinite(resetMs)) return null;
  const diffSeconds = Math.floor((resetMs - Date.now()) / 1000);
  return formatResetFromSeconds(Math.max(0, diffSeconds));
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
