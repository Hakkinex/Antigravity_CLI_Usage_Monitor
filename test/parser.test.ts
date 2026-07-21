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
    expect(snapshot.accounts[0]?.models[0]?.remainingPercent).toBe(92);
    expect(snapshot.accounts[0]?.models[0]?.resetInText).toBe('3d 4h');
    expect(snapshot.accounts[1]?.models[4]?.status).toBe('critical');
    expect(snapshot.accounts[1]?.models[5]?.status).toBe('exhausted');
  });

  it('normalizes current antigravity-usage snapshot schema', () => {
    const snapshot = parseAntigravityUsageJson(
      [
        {
          email: 'user@example.com',
          status: 'success',
          snapshot: {
            timestamp: '2026-06-30T04:14:17.108Z',
            method: 'google',
            email: 'user@example.com',
            models: [
              {
                label: 'Gemini 3 Flash',
                modelId: 'gemini-3-flash',
                remainingPercentage: 0.9984601,
                isExhausted: false,
                resetTime: '2026-06-30T05:45:11Z',
                timeUntilResetMs: 5453909,
                isAutocompleteOnly: false
              },
              {
                label: 'Claude Opus 4.6 (Thinking)',
                modelId: 'claude-opus-4-6-thinking',
                remainingPercentage: 0.2598664,
                isExhausted: false,
                resetTime: '2026-06-30T15:54:56Z',
                timeUntilResetMs: 42038909,
                weeklyRemainingPercentage: 0.721,
                weeklyTimeUntilResetMs: 259200000,
                isAutocompleteOnly: false
              }
            ]
          }
        }
      ],
      defaultConfig,
      'google'
    );

    expect(snapshot.accounts).toHaveLength(1);
    expect(snapshot.accounts[0]?.displayName).toBe('user@example.com');
    expect(snapshot.accounts[0]?.status).toBe('ok');
    expect(snapshot.accounts[0]?.models).toHaveLength(2);
    expect(snapshot.accounts[0]?.models[0]?.name).toBe('Gemini 3 Flash');
    expect(snapshot.accounts[0]?.models[0]?.remainingPercent).toBe(100);
    expect(snapshot.accounts[0]?.models[0]?.resetInText).toBe('1h 30m');
    expect(snapshot.accounts[0]?.models[1]?.name).toBe('Claude Opus 4.6 (Thinking)');
    expect(snapshot.accounts[0]?.models[1]?.remainingPercent).toBe(26);
    expect(snapshot.accounts[0]?.models[1]?.status).toBe('low');
    expect(snapshot.accounts[0]?.models[1]?.resetInText).toBe('11h 40m');
  });

  it('selects the lowest-remaining window from quotaInfos for the monitor UI', () => {
    const snapshot = parseAntigravityUsageJson(
      [
        {
          email: 'weekly@example.com',
          status: 'success',
          snapshot: {
            email: 'weekly@example.com',
            models: {
              'gemini-3-flash': {
                displayName: 'Gemini 3 Flash',
                quotaInfos: [
                  {
                    windowId: 'fiveHour',
                    windowLabel: 'Five Hour Limit',
                    remainingFraction: 0.8135,
                    resetTime: '2026-07-01T13:00:00Z'
                  },
                  {
                    windowId: 'weekly',
                    windowLabel: 'Weekly Limit',
                    remainingFraction: 0.9685,
                    resetTime: '2026-07-05T18:00:00Z'
                  }
                ]
              }
            }
          }
        }
      ],
      defaultConfig,
      'google'
    );

    const model = snapshot.accounts[0]?.models[0];
    expect(model?.remainingPercent).toBe(81);
    expect(model?.resetInText).toBeTruthy();
    expect(model?.resetAt).toBe('2026-07-01T13:00:00Z');
  });

  it('keeps exhausted quota rows visible when only isExhausted and resetTime are present', () => {
    const snapshot = parseAntigravityUsageJson(
      [
        {
          email: 'exhausted@example.com',
          status: 'success',
          snapshot: {
            email: 'exhausted@example.com',
            models: [
              {
                displayName: 'Gemini 3 Flash',
                isExhausted: true,
                resetTime: '2026-07-01T13:00:00Z',
                timeUntilResetMs: 3600000
              }
            ]
          }
        }
      ],
      defaultConfig,
      'google'
    );

    const model = snapshot.accounts[0]?.models[0];
    expect(model?.remainingPercent).toBe(0);
    expect(model?.status).toBe('exhausted');
    expect(model?.resetInText).toBe('1h 0m');
  });

  it('does not duplicate a weekly-only summary into the five-hour fields', () => {
    const snapshot = parseAntigravityUsageJson(
      [{
        email: 'weekly-only@example.com',
        status: 'success',
        snapshot: {
          email: 'weekly-only@example.com',
          models: [{
            name: 'gemini-summary',
            windows: {
              weekly: {
                remainingPercentage: 97,
                resetTime: '2026-07-27T03:17:41Z'
              }
            }
          }]
        }
      }],
      defaultConfig,
      'google'
    );

    const model = snapshot.accounts[0]?.models[0];
    expect(model?.remainingPercent).toBeNull();
    expect(model?.resetInText).toBeNull();
    expect(model?.weeklyRemainingPercent).toBe(97);
    expect(model?.weeklyResetInText).toBeTruthy();
  });
});
