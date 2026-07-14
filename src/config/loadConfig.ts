import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { defaultConfig } from './defaultConfig.js';
import type { MonitorConfig } from '../types.js';
import { setPrivateFilePermissions } from '../antigravity/core/permissions.js';

type AnyRecord = Record<string, unknown>;

export function getConfigPath(): string {
  if (process.platform === 'win32') {
    const base = process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
    return join(base, 'agy-monitor', 'config.json');
  }

  return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), 'agy-monitor', 'config.json');
}

export function loadConfig(path = getConfigPath()): MonitorConfig {
  if (!existsSync(path)) {
    return defaultConfig;
  }

  try {
    setPrivateFilePermissions(path);
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    const safeConfig = stripUndefined(normalizeConfig(parsed));

    return {
      ...defaultConfig,
      ...safeConfig,
      thresholds: {
        ...defaultConfig.thresholds,
        ...safeConfig.thresholds
      },
      accountAliases: {
        ...defaultConfig.accountAliases,
        ...safeConfig.accountAliases
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown config error';
    console.error(`Failed to load config from ${path}: ${message}`);
    return defaultConfig;
  }
}

function normalizeConfig(value: unknown): Partial<MonitorConfig> {
  if (!isRecord(value)) {
    throw new Error('Config file must contain a JSON object');
  }

  return {
    refreshIntervalSec: readPositiveNumber(value.refreshIntervalSec),
    columns: readPositiveNumber(value.columns),
    method: readMethod(value.method),
    showEmail: typeof value.showEmail === 'boolean' ? value.showEmail : undefined,
    maskEmail: typeof value.maskEmail === 'boolean' ? value.maskEmail : undefined,
    allModels: typeof value.allModels === 'boolean' ? value.allModels : undefined,
    accountAliases: readStringRecord(value.accountAliases),
    thresholds: readThresholds(value.thresholds)
  };
}

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter((entry) => entry[1] !== undefined)) as Partial<T>;
}

function readPositiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function readMethod(value: unknown): MonitorConfig['method'] | undefined {
  return value === 'google' || value === 'local' || value === 'auto' ? value : undefined;
}

function readStringRecord(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;

  const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string');
  return Object.fromEntries(entries);
}

function readThresholds(value: unknown): MonitorConfig['thresholds'] | undefined {
  if (!isRecord(value)) return undefined;

  const green = readFiniteNumber(value.green);
  const yellow = readFiniteNumber(value.yellow);
  const orange = readFiniteNumber(value.orange);
  const red = readFiniteNumber(value.red);

  return green === undefined && yellow === undefined && orange === undefined && red === undefined
    ? undefined
    : { green: green ?? defaultConfig.thresholds.green, yellow: yellow ?? defaultConfig.thresholds.yellow, orange: orange ?? defaultConfig.thresholds.orange, red: red ?? defaultConfig.thresholds.red };
}

function readFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
