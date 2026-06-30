import { execFile } from 'node:child_process';
const TIMEOUT_MS = 30_000;
export async function fetchAntigravityUsage(options) {
    const attempts = buildAttempts(options);
    for (const args of attempts) {
        const command = `antigravity-usage ${args.join(' ')}`;
        const result = await runAntigravityUsage(args);
        if (result.ok)
            return { ok: true, raw: result.raw, command };
        if (!isLikelySubcommandProblem(result.error.message)) {
            return { ok: false, error: result.error, command };
        }
    }
    return {
        ok: false,
        error: {
            scope: 'global',
            message: 'antigravity-usage failed with both quota and root command forms'
        }
    };
}
function buildAttempts(options) {
    const flags = ['--all', '--json', '--method', String(options.method)];
    if (options.allModels)
        flags.push('--all-models');
    if (options.refresh)
        flags.push('--refresh');
    return [['quota', ...flags], flags];
}
function runAntigravityUsage(args) {
    return new Promise((resolve) => {
        execFile('antigravity-usage', args, { timeout: TIMEOUT_MS, windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                resolve({
                    ok: false,
                    error: {
                        scope: 'global',
                        message: stderr.trim() || error.message
                    }
                });
                return;
            }
            try {
                resolve({ ok: true, raw: JSON.parse(stdout) });
            }
            catch (parseError) {
                resolve({
                    ok: false,
                    error: {
                        scope: 'global',
                        message: `antigravity-usage did not return valid JSON: ${parseError.message}`,
                        raw: stdout
                    }
                });
            }
        });
    });
}
function isLikelySubcommandProblem(message) {
    const lower = message.toLowerCase();
    return lower.includes('unknown command') || lower.includes('invalid command') || lower.includes('unexpected argument');
}
//# sourceMappingURL=AntigravityUsageProvider.js.map