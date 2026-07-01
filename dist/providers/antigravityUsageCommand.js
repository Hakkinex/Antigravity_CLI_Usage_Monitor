import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export function resolveAntigravityUsageCommand() {
    const here = dirname(fileURLToPath(import.meta.url));
    const binaryName = process.platform === 'win32' ? 'antigravity-usage.cmd' : 'antigravity-usage';
    const localBinary = join(here, '..', '..', 'node_modules', '.bin', binaryName);
    if (existsSync(localBinary)) {
        return {
            executable: localBinary,
            displayName: `node_modules/.bin/${binaryName}`
        };
    }
    return {
        executable: 'antigravity-usage',
        displayName: 'antigravity-usage'
    };
}
//# sourceMappingURL=antigravityUsageCommand.js.map