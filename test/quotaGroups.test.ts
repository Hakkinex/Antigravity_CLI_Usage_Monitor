import { describe, expect, it } from 'vitest';
import { buildQuotaGroups } from '../src/render/quotaGroups.js';
import type { ModelQuota } from '../src/types.js';

describe('buildQuotaGroups', () => {
  it('summarizes each group by the lowest remaining percent', () => {
    const groups = buildQuotaGroups([
      model('g1', 'gemini', 90, '4h'),
      model('g2', 'gemini', 70, '3h'),
      model('c1', 'claude', 80, '6h')
    ]);

    expect(groups).toEqual([
      expect.objectContaining({ label: 'Gemini Flash/Pro', quota: expect.objectContaining({ remainingPercent: 70, resetInText: '3h' }) }),
      expect.objectContaining({ label: 'Claude/ChatGPT', quota: expect.objectContaining({ remainingPercent: 80, resetInText: '6h' }) })
    ]);
  });

  it('filters groups with no quota data', () => {
    const groups = buildQuotaGroups([model('o1', 'other', null, null)]);
    expect(groups).toEqual([]);
  });

  it('keeps groups that only have reset time', () => {
    const groups = buildQuotaGroups([model('c1', 'claude', null, '3h 22m')]);
    expect(groups).toEqual([
      expect.objectContaining({
        label: 'Claude/ChatGPT',
        quota: expect.objectContaining({ remainingPercent: null, resetInText: '3h 22m' })
      })
    ]);
  });
});

function model(name: string, group: ModelQuota['group'], remainingPercent: number | null, resetInText: string | null): ModelQuota {
  return {
    id: name,
    name,
    group,
    remainingPercent,
    resetInText,
    status: remainingPercent === null ? 'unknown' : 'healthy'
  };
}
