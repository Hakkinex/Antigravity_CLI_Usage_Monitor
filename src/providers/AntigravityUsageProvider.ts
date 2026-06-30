import { execFile } from 'node:child_process';
import type { MonitorError, ProviderResult, WatchOptions } from '../types.js';

const TIMEOUT_MS = 30_000;
const ALLOWED_METHODS = new Set(['google', 'local', 'auto']);

export async function fetchAntigravityUsage(options: WatchOptions): Promise<ProviderResult> {
  const attempts = buildAttempts(options);

  for (const args of attempts) {
    const command = `antigravity-usage ${args.join(' ')}`;
    const result = await runAntigravityUsage(args);
    if (result.ok) return { ok: true, raw: result.raw, command };

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

function buildAttempts(options: WatchOptions): string[][] {
  const method = normalizeMethod(String(options.method));
  const flags = ['--all', '--json', '--method', method];
  if (options.allModels) flags.push('--all-models');
  if (options.refresh) flags.push('--refresh');
  return [['quota', ...flags], flags];
}

function runAntigravityUsage(args: string[]): Promise<{ ok: true; raw: unknown } | { ok: false; error: MonitorError }> {
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
        resolve({ ok: true, raw: JSON.parse(stdout) as unknown });
      } catch (parseError) {
        resolve({
          ok: false,
          error: {
            scope: 'global',
            message: `antigravity-usage did not return valid JSON: ${(parseError as Error).message}`,
            raw: stdout
          }
        });
      }
    });
  });
}

function isLikelySubcommandProblem(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('unknown command') || lower.includes('invalid command') || lower.includes('unexpected argument');
}

function normalizeMethod(value: string): string {
  if (!ALLOWED_METHODS.has(value)) {
    throw new Error(`Invalid method: ${value}. Expected one of google, local, auto.`);
  }

  return value;
}
