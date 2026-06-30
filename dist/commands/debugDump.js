import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const TIMEOUT_MS = 60_000;
export async function runDebugDump(argv) {
    const options = parseDebugDumpOptions(argv);
    mkdirSync(options.outputDir, { recursive: true });
    const result = await runAntigravityUsageDebug(options);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const stdoutPath = resolve(options.outputDir, `antigravity-usage-stdout-${timestamp}.json`);
    const stderrPath = resolve(options.outputDir, `antigravity-usage-stderr-${timestamp}.log`);
    const analysisPath = resolve(options.outputDir, `analysis-${timestamp}.json`);
    writeFileSync(stdoutPath, result.stdout || '', 'utf8');
    writeFileSync(stderrPath, result.stderr || result.errorMessage || '', 'utf8');
    const analysis = analyzeDebugOutput(result);
    writeFileSync(analysisPath, `${JSON.stringify(analysis, null, 2)}\n`, 'utf8');
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
    return {
        method: readValue('--method') ?? 'google',
        all: !has('--no-all'),
        account: readValue('--account'),
        refresh: has('--refresh'),
        allModels: has('--all-models'),
        outputDir: resolve(readValue('--output') ?? '.agy-monitor-debug')
    };
}
function buildArgs(options) {
    const args = ['--debug', 'quota', '--json', '--method', String(options.method)];
    if (options.all && !options.account)
        args.push('--all');
    if (options.account)
        args.push('--account', options.account);
    if (options.refresh)
        args.push('--refresh');
    if (options.allModels)
        args.push('--all-models');
    return args;
}
function runAntigravityUsageDebug(options) {
    const args = buildArgs(options);
    const command = `antigravity-usage ${args.join(' ')}`;
    return new Promise((resolveResult) => {
        execFile('antigravity-usage', args, { timeout: TIMEOUT_MS, windowsHide: true }, (error, stdout, stderr) => {
            resolveResult({
                exitCode: typeof error?.code === 'number' ? error.code : error ? null : 0,
                command,
                stdout,
                stderr,
                errorMessage: error?.message
            });
        });
    });
}
function analyzeDebugOutput(result) {
    const stdoutParsed = parseJson(result.stdout);
    const stdoutJsonPaths = stdoutParsed.ok ? collectPaths(stdoutParsed.value) : [];
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
        stdoutJsonParseable: stdoutParsed.ok,
        stdoutJsonPaths,
        stderrJsonBlocks,
        candidatePaths: [...new Set(candidatePaths)].sort(),
        nextSteps: [
            'Look for weekly, week, quota, limit, reset, remaining, rolling, period, or window fields in candidatePaths.',
            'If weekly quota is present in stderr raw API blocks but absent from stdout JSON, patch antigravity-usage parser/types.',
            'If weekly quota is absent from fetchAvailableModels, inspect Antigravity local Connect API or native CLI network calls.'
        ]
    };
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