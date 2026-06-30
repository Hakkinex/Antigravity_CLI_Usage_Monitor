import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export function fetchMockUsage() {
    const here = dirname(fileURLToPath(import.meta.url));
    const fixturePath = join(here, '..', '..', 'test', 'fixtures', 'antigravity-usage-all.json');
    return JSON.parse(readFileSync(fixturePath, 'utf8'));
}
//# sourceMappingURL=mockProvider.js.map