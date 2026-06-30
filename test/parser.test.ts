import { describe, expect, it } from 'vitest';
import fixture from './fixtures/antigravity-usage-all.json';
import { parseAntigravityUsageJson } from '../src/parser/parseAntigravityUsageJson.js';
import { defaultConfig } from '../src/config/defaultConfig.js';

describe('parseAntigravityUsageJson', () => {
  it('normalizes multi-account quota output', () => {
    const snapshot = parseAntigravityUsageJson(fixture, defaultConfig, 'google', 'mock');

    expect(snapshot.accounts).toHaveLength(4);
    expect(snapshot.accounts[0]?.displayName).toBe('account1@example.com');
    expect(snapshot.accounts[0]?.models).toHaveLength(7);
    expect(snapshot.accounts[0]?.models[0]?.weeklyRemainingPercent).toBe(92);
    expect(snapshot.accounts[0]?.models[0]?.weeklyResetInText).toBe('3d 4h');
    expect(snapshot.accounts[1]?.models[4]?.status).toBe('critical');
    expect(snapshot.accounts[1]?.models[4]?.weeklyStatus).toBe('critical');
    expect(snapshot.accounts[1]?.models[5]?.status).toBe('exhausted');
  });
});
