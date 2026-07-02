import { describe, expect, it } from 'vitest';
import { parseLocalQuotaSnapshot } from '../src/antigravity/local/local-parser.js';

describe('parseLocalQuotaSnapshot', () => {
  it('normalizes prompt credits and models from local user status', () => {
    const snapshot = parseLocalQuotaSnapshot({
      email: 'local@example.com',
      quota: {
        promptCredits: {
          used: 10,
          limit: 100,
          remaining: 90
        },
        models: [
          {
            modelId: 'gemini-2.5-pro',
            displayName: 'Gemini 2.5 Pro',
            quota: {
              remainingPercentage: 0.42,
              resetTime: '2026-07-05T00:00:00Z',
              timeUntilResetMs: 1000
            },
            isExhausted: false
          }
        ]
      },
      raw: { ok: true }
    });

    expect(snapshot.method).toBe('local');
    expect(snapshot.email).toBe('local@example.com');
    expect(snapshot.promptCredits).toEqual({
      available: 90,
      monthly: 100,
      usedPercentage: 0.1,
      remainingPercentage: 0.9
    });
    expect(snapshot.models[0]).toEqual(
      expect.objectContaining({
        modelId: 'gemini-2.5-pro',
        remainingPercentage: 0.42,
        resetTime: '2026-07-05T00:00:00Z',
        isAutocompleteOnly: true
      })
    );
  });

  it('skips prompt credits when limit is zero', () => {
    const snapshot = parseLocalQuotaSnapshot({
      quota: {
        promptCredits: {
          limit: 0,
          remaining: 0
        },
        models: []
      }
    });

    expect(snapshot.promptCredits).toBeUndefined();
    expect(snapshot.models).toEqual([]);
  });
});
