import { existsSync, cpSync, mkdirSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { setPrivateDirectoryPermissions } from './permissions.js';
export function getPlatform() {
    const p = platform();
    if (p === 'win32')
        return 'windows';
    if (p === 'darwin')
        return 'macos';
    return 'linux';
}
function appConfigDir(appName) {
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
export function getConfigDir() {
    const dir = appConfigDir('agy-monitor');
    ensureLegacyConfigImported();
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    setPrivateDirectoryPermissions(dir);
    return dir;
}
export function getLegacyConfigDir() {
    return appConfigDir('antigravity-usage');
}
export function ensureLegacyConfigImported() {
    const target = appConfigDir('agy-monitor');
    const legacy = getLegacyConfigDir();
    if (existsSync(target) || !existsSync(legacy))
        return;
    cpSync(legacy, target, { recursive: true, errorOnExist: false });
}
export function getTokensPath() {
    return join(getConfigDir(), 'tokens.json');
}
export function getAccountsDir() {
    return join(getConfigDir(), 'accounts');
}
export function getAccountDir(email) {
    if (!email || email === '.' || email === '..' || email.includes('/') || email.includes('\\') || email.includes('\0')) {
        throw new Error('Invalid account email for storage path');
    }
    const safeName = email.replace(/[^a-zA-Z0-9@._-]/g, '_');
    return join(getAccountsDir(), safeName);
}
export function getGlobalConfigPath() {
    return join(getConfigDir(), 'config.json');
}
//# sourceMappingURL=env.js.map