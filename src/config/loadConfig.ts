import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { defaultConfig } from './defaultConfig.js';
import type { MonitorConfig } from '../types.js';

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
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Partial<MonitorConfig>;
    return {
      ...defaultConfig,
      ...parsed,
      thresholds: {
        ...defaultConfig.thresholds,
        ...parsed.thresholds
      },
      accountAliases: {
        ...defaultConfig.accountAliases,
        ...parsed.accountAliases
      }
    };
  } catch {
    return defaultConfig;
  }
}
