import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config/loadConfig.js';

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop() as string, { recursive: true, force: true });
  }
});

describe('loadConfig', () => {
  it('ignores invalid field types and keeps valid values', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agy-monitor-config-'));
    tempDirs.push(dir);

    const filePath = join(dir, 'config.json');
    writeFileSync(
      filePath,
      JSON.stringify({
        refreshIntervalSec: 'bad',
        columns: 2,
        thresholds: { green: 'oops', yellow: 45 },
        accountAliases: { ok: 'alias', bad: 1 }
      })
    );

    const config = loadConfig(filePath);

    expect(config.refreshIntervalSec).toBe(60);
    expect(config.columns).toBe(2);
    expect(config.thresholds.green).toBe(80);
    expect(config.thresholds.yellow).toBe(45);
    expect(config.accountAliases).toEqual({ ok: 'alias' });
  });

  it('returns defaults and logs when config is not an object', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agy-monitor-config-'));
    tempDirs.push(dir);

    const filePath = join(dir, 'config.json');
    writeFileSync(filePath, '[]');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const config = loadConfig(filePath);

    expect(config.refreshIntervalSec).toBe(60);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
