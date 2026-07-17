import { fetchAllQuotaSnapshots } from '../antigravity/api.js';
import type { ProviderResult, WatchOptions } from '../types.js';

const ALLOWED_METHODS = new Set(['google', 'local', 'auto']);

export async function fetchAntigravityProvider(options: WatchOptions): Promise<ProviderResult> {
  const method = normalizeMethod(String(options.method));
  const command = buildCommand(method, options);

  try {
    const raw = await fetchAllQuotaSnapshots({ method, refresh: options.refresh });
    const hasSuccess = raw.some((result) => result.status === 'success' || result.status === 'cached');
    if (hasSuccess) {
      const warnings: string[] = [];
      for (const result of raw) {
        if (result.status === 'cached' && result.fallbackError) {
          warnings.push(`${result.email}: fresh update failed (${result.fallbackError}); using ${result.cacheAge}s-old cache`);
        }
      }
      return { ok: true, raw, command, warning: warnings.length > 0 ? warnings.join('; ') : undefined };
    }

    return {
      ok: false,
      error: {
        scope: 'global',
        message:
          raw.map((result) => (result.status === 'error' ? result.error : '')).filter(Boolean).join('; ') ||
          'Internal Antigravity provider did not return quota data',
        raw
      },
      command
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        scope: 'global',
        message: error instanceof Error ? error.message : String(error)
      },
      command
    };
  }
}

function buildCommand(method: 'google' | 'local' | 'auto', options: WatchOptions): string {
  const flags = ['watch', '--method', method];
  if (options.refresh) flags.push('--refresh');
  if (options.allModels) flags.push('--all-models');
  return 'internal-antigravity ' + flags.join(' ');
}

function normalizeMethod(value: string): 'google' | 'local' | 'auto' {
  if (!ALLOWED_METHODS.has(value)) {
    throw new Error('Invalid method: ' + value + '. Expected one of google, local, auto.');
  }

  return value as 'google' | 'local' | 'auto';
}
