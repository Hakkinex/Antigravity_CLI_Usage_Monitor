import { existsSync, cpSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';

export type Platform = 'windows' | 'macos' | 'linux';

export function getPlatform(): Platform {
  const p = platform();
  if (p === 'win32') return 'windows';
  if (p === 'darwin') return 'macos';
  return 'linux';
}

function appConfigDir(appName: string): string {
  const p = getPlatform();
  const home = homedir();

  switch (p) {
    case 'windows':
      return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), appName);
    case 'macos':
      return join(home, 'Library', 'Application Support', appName);
    case 'linux':
    default:
      return join(process.env.XDG_CONFIG_HOME || join(home, '.config'), appName);
  }
}

export function getConfigDir(): string {
  return appConfigDir('agy-monitor');
}

export function getLegacyConfigDir(): string {
  return appConfigDir('antigravity-usage');
}

export function ensureLegacyConfigImported(): void {
  const target = getConfigDir();
  const legacy = getLegacyConfigDir();
  if (existsSync(target) || !existsSync(legacy)) return;
  cpSync(legacy, target, { recursive: true, errorOnExist: false });
}

export function getTokensPath(): string {
  ensureLegacyConfigImported();
  return join(getConfigDir(), 'tokens.json');
}

export function getAccountsDir(): string {
  ensureLegacyConfigImported();
  return join(getConfigDir(), 'accounts');
}

export function getAccountDir(email: string): string {
  const safeName = email.replace(/[^a-zA-Z0-9@._-]/g, '_');
  return join(getAccountsDir(), safeName);
}

export function getGlobalConfigPath(): string {
  ensureLegacyConfigImported();
  return join(getConfigDir(), 'config.json');
}
