export type MonitorMethod = 'google' | 'local' | 'auto' | string;

export type ModelGroup = 'gemini' | 'claude' | 'gpt' | 'other';

export type ModelStatus =
  | 'healthy'
  | 'medium'
  | 'low'
  | 'critical'
  | 'exhausted'
  | 'unknown';

export type AccountStatus = 'ok' | 'warning' | 'error';

export type MonitorSnapshot = {
  fetchedAt: string;
  source: 'antigravity' | 'mock';
  method: MonitorMethod;
  accounts: AccountQuota[];
  errors: MonitorError[];
};

export type AccountQuota = {
  id: string;
  email?: string;
  displayName: string;
  status: AccountStatus;
  errorMessage?: string;
  models: ModelQuota[];
};

export type ModelQuota = {
  id: string;
  name: string;
  group: ModelGroup;
  remainingPercent: number | null;
  resetInText: string | null;
  resetAt?: string | null;
  status: ModelStatus;
  weeklyRemainingPercent: number | null;
  weeklyResetInText: string | null;
  weeklyResetAt?: string | null;
  weeklyStatus: ModelStatus;
  isAutocompleteOnly?: boolean;
};

export type MonitorError = {
  scope: 'global' | 'account';
  accountEmail?: string;
  message: string;
  raw?: unknown;
};

export type MonitorConfig = {
  refreshIntervalSec: number;
  columns: number;
  method: MonitorMethod;
  showEmail?: boolean;
  maskEmail: boolean;
  allModels: boolean;
  accountAliases: Record<string, string>;
  thresholds: {
    green: number;
    yellow: number;
    orange: number;
    red: number;
  };
};

export type WatchOptions = {
  interval: number;
  columns: number;
  method: MonitorMethod;
  showEmail: boolean;
  maskEmail: boolean;
  allModels: boolean;
  refresh: boolean;
  debug: boolean;
  mock: boolean;
};

export type DebugDumpOptions = {
  method: MonitorMethod;
  all: boolean;
  account?: string;
  refresh: boolean;
  allModels: boolean;
  outputDir: string;
};

export type ProviderResult =
  | { ok: true; raw: unknown; command: string; warning?: string }
  | { ok: false; error: MonitorError; command?: string };
