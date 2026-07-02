import { mkdirSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fetchAllQuotaSnapshots } from '../antigravity/api.js';
const ALLOWED_METHODS = new Set(['google', 'local', 'auto']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function runDebugDump(argv) {
    const options = parseDebugDumpOptions(argv);
    mkdirSync(options.outputDir, { recursive: true });
    const result = await runInternalProviderDebug(options);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const stdoutPath = resolve(options.outputDir, `antigravity-provider-stdout-${timestamp}.json`);
    const stderrPath = resolve(options.outputDir, `antigravity-provider-stderr-${timestamp}.log`);
    const analysisPath = resolve(options.outputDir, `analysis-${timestamp}.json`);
    writeFileSync(stdoutPath, result.stdout || '', { encoding: 'utf8', mode: 0o600 });
    writeFileSync(stderrPath, result.stderr || result.errorMessage || '', { encoding: 'utf8', mode: 0o600 });
    const analysis = analyzeDebugOutput(result);
    writeFileSync(analysisPath, `${JSON.stringify(analysis, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    console.log(`Command: ${result.command}`);
    console.log(`Exit code: ${result.exitCode ?? 'unknown'}`);
    console.log(`stdout: ${stdoutPath}`);
    console.log(`stderr: ${stderrPath}`);
    console.log(`analysis: ${analysisPath}`);
    if (analysis.candidatePaths.length === 0) {
        console.log('No obvious weekly/quota candidate paths found yet. Inspect stderr raw API blocks next.');
    }
    else {
        console.log('Candidate paths:');
        for (const path of analysis.candidatePaths.slice(0, 20)) {
            console.log(`  - ${path}`);
        }
    }
}
function parseDebugDumpOptions(argv) {
    const readValue = (name) => {
        const index = argv.indexOf(name);
        return index >= 0 ? argv[index + 1] : undefined;
    };
    const has = (name) => argv.includes(name);
    const method = normalizeMethod(readValue('--method') ?? 'google');
    const account = normalizeAccount(readValue('--account'));
    return {
        method,
        all: !has('--no-all'),
        account,
        refresh: !has('--use-cache') && !has('--no-cache'),
        allModels: has('--all-models'),
        outputDir: resolveOutputDir(readValue('--output') ?? '.agy-monitor-debug')
    };
}
async function runInternalProviderDebug(options) {
    const command = buildDebugCommand(options);
    try {
        const raw = await fetchAllQuotaSnapshots({
            method: options.method,
            accountEmail: options.account,
            refresh: options.refresh
        });
        return {
            exitCode: raw.some((result) => result.status === 'success' || result.status === 'cached') ? 0 : 1,
            command,
            stdout: JSON.stringify(raw, null, 2),
            stderr: ''
        };
    }
    catch (error) {
        return {
            exitCode: 1,
            command,
            stdout: '',
            stderr: '',
            errorMessage: error instanceof Error ? error.message : String(error)
        };
    }
}
function buildDebugCommand(options) {
    const flags = ['debug-dump', '--method', String(options.method)];
    if (!options.all)
        flags.push('--no-all');
    if (options.account)
        flags.push('--account', options.account);
    if (!options.refresh)
        flags.push('--use-cache');
    if (options.allModels)
        flags.push('--all-models');
    return 'internal-antigravity ' + flags.join(' ');
}
function normalizeMethod(value) {
    if (!ALLOWED_METHODS.has(value)) {
        throw new Error(`Invalid method: ${value}. Expected one of google, local, auto.`);
    }
    return value;
}
function normalizeAccount(value) {
    if (!value)
        return undefined;
    if (value.startsWith('-') || !EMAIL_PATTERN.test(value)) {
        throw new Error(`Invalid account email: ${value}`);
    }
    return value;
}
function resolveOutputDir(value) {
    const baseDir = process.cwd();
    const resolved = resolve(baseDir, value);
    const relativePath = relative(baseDir, resolved);
    if (relativePath === '..' || relativePath.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)) {
        throw new Error(`Output directory must stay inside the current project: ${value}`);
    }
    return resolved;
}
function analyzeDebugOutput(result) {
    const stdoutParsed = parseJson(result.stdout);
    const stdoutJsonPaths = stdoutParsed.ok ? collectPaths(stdoutParsed.value) : [];
    const usedCache = /Using cached data|Cache .* is valid/i.test(result.stderr) || hasCachedStatus(stdoutParsed);
    const methodsSeen = stdoutParsed.ok ? collectDistinctValues(stdoutParsed.value, 'method') : [];
    const sourcesSeen = stdoutParsed.ok ? collectDistinctValues(stdoutParsed.value, 'source') : [];
    const stderrJsonBlocks = extractDebugJsonBlocks(result.stderr).map((block) => {
        const parsed = parseJson(block.json);
        return {
            label: block.label,
            parseable: parsed.ok,
            paths: parsed.ok ? collectPaths(parsed.value) : []
        };
    });
    const allPaths = [...stdoutJsonPaths, ...stderrJsonBlocks.flatMap((block) => block.paths)];
    const candidatePaths = allPaths.filter(isCandidatePath);
    return {
        generatedAt: new Date().toISOString(),
        command: result.command,
        exitCode: result.exitCode,
        usedCache,
        methodsSeen,
        sourcesSeen,
        stdoutJsonParseable: stdoutParsed.ok,
        stdoutJsonPaths,
        stderrJsonBlocks,
        candidatePaths: [...new Set(candidatePaths)].sort(),
        nextSteps: [
            usedCache
                ? 'This dump used cached quota data. Re-run debug-dump without --use-cache to force a fresh upstream request.'
                : 'This dump appears to use fresh quota data rather than cached quota snapshots.',
            'Verify methodsSeen and sourcesSeen to confirm the dump came from the expected provider path.',
            'Look for quota, limit, reset, remaining, period, or window fields in candidatePaths.',
            'If only one window exists upstream, render its real reset time directly instead of implying separate 5h/weekly limits.'
        ]
    };
}
function collectDistinctValues(value, key) {
    const values = new Set();
    collectValuesRecursive(value, key, values, 0);
    return [...values].sort();
}
function collectValuesRecursive(value, key, values, depth) {
    if (depth > 8 || value === null || value === undefined)
        return;
    if (Array.isArray(value)) {
        for (const item of value)
            collectValuesRecursive(item, key, values, depth + 1);
        return;
    }
    if (typeof value !== 'object')
        return;
    for (const [childKey, childValue] of Object.entries(value)) {
        if (childKey === key && typeof childValue === 'string' && childValue) {
            values.add(childValue);
        }
        collectValuesRecursive(childValue, key, values, depth + 1);
    }
}
function hasCachedStatus(parsed) {
    if (!parsed.ok)
        return false;
    if (!Array.isArray(parsed.value))
        return false;
    return parsed.value.some((item) => {
        if (typeof item !== 'object' || item === null)
            return false;
        const status = item.status;
        return status === 'cached';
    });
}
function parseJson(input) {
    try {
        return { ok: true, value: JSON.parse(input) };
    }
    catch {
        return { ok: false };
    }
}
function collectPaths(value, prefix = '$', depth = 0) {
    if (depth > 8)
        return [];
    if (Array.isArray(value)) {
        const paths = [`${prefix}[]`];
        const first = value[0];
        return first === undefined ? paths : [...paths, ...collectPaths(first, `${prefix}[]`, depth + 1)];
    }
    if (typeof value === 'object' && value !== null) {
        const paths = [];
        for (const [key, child] of Object.entries(value)) {
            const childPath = `${prefix}.${key}`;
            paths.push(childPath);
            paths.push(...collectPaths(child, childPath, depth + 1));
        }
        return paths;
    }
    return [];
}
function extractDebugJsonBlocks(stderr) {
    const blocks = [];
    const patterns = ['Models response received', 'Code assist response received', 'User status received'];
    for (const line of stderr.split(/\r?\n/)) {
        for (const pattern of patterns) {
            const index = line.indexOf(pattern);
            if (index === -1)
                continue;
            const jsonStart = line.indexOf('{', index);
            if (jsonStart !== -1) {
                blocks.push({ label: pattern, json: line.slice(jsonStart) });
            }
        }
    }
    return blocks;
}
function isCandidatePath(path) {
    return /week|weekly|quota|limit|reset|remaining|fraction|period|window|rolling|usage/i.test(path);
}
//# sourceMappingURL=debugDump.js.map