import { describe, expect, it } from 'vitest';
import { parseGoogleModels, parseModelInfo } from '../../src/antigravity/google/parser.js';

const NOW = Date.parse('2026-07-01T12:00:00Z');

const bothWindows = {
  models: {
    'gemini-2.5-flash': {
      name: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      quotaInfos: [
        {
          windowId: 'fiveHour',
          windowLabel: 'Five Hour Limit',
          remainingFraction: 0.81,
          resetTime: '2026-07-01T13:00:00Z'
        },
        {
          windowId: 'weekly',
          windowLabel: 'Weekly Limit',
          remainingFraction: 0.97,
          resetTime: '2026-07-05T18:00:00Z'
        }
      ]
    }
  }
};

const onlyFiveHour = {
  models: {
    'claude-opus': {
      name: 'claude-opus',
      quotaInfos: [
        {
          windowId: 'fiveHour',
          windowLabel: 'Five Hour Limit',
          remainingFraction: 1,
          resetTime: '2026-07-01T16:59:00Z'
        }
      ]
    }
  }
};

const legacySingleQuotaInfo = {
  models: {
    'gpt-oss': {
      name: 'gpt-oss',
      quotaInfo: {
        remainingFraction: 0.5,
        resetTime: '2026-07-01T17:00:00Z'
      }
    }
  }
};

const unknownWindow = {
  models: {
    'future-model': {
      name: 'future-model',
      quotaInfos: [
        {
          windowId: 'daily',
          windowLabel: 'Daily Limit',
          remainingFraction: 0.42,
          resetTime: '2026-07-02T12:00:00Z'
        }
      ]
    }
  }
};

const exhaustedWeekly = {
  models: {
    'gemini-flash': {
      name: 'gemini-flash',
      quotaInfos: [
        {
          windowId: 'fiveHour',
          windowLabel: 'Five Hour Limit',
          remainingFraction: 0.2,
          resetTime: '2026-07-01T13:00:00Z'
        },
        {
          windowId: 'weekly',
          windowLabel: 'Weekly Limit',
          remainingFraction: 0,
          resetTime: '2026-07-08T00:00:00Z'
        }
      ]
    }
  }
};

const missingResetTime = {
  models: {
    'gemini-pro': {
      name: 'gemini-pro',
      quotaInfos: [
        { windowId: 'fiveHour', remainingFraction: 0.6 },
        { windowId: 'weekly', remainingFraction: 0.9 }
      ]
    }
  }
};

const modelsAsArray = {
  models: [
    {
      name: 'a',
      quotaInfos: [{ windowId: 'weekly', remainingFraction: 0.5, resetTime: '2026-07-03T00:00:00Z' }]
    },
    {
      name: 'b',
      quotaInfos: [{ windowId: 'fiveHour', remainingFraction: 0.3, resetTime: '2026-07-01T14:00:00Z' }]
    }
  ]
};

describe('parseGoogleModels', () => {
  it('produces a schemaVersion 2 snapshot', () => {
    const snapshot = parseGoogleModels(bothWindows, { email: 'a@b.com', now: NOW });
    expect(snapshot.schemaVersion).toBe(2);
    expect(snapshot.source).toBe('google');
    expect(snapshot.email).toBe('a@b.com');
    expect(snapshot.timestamp).toBe(NOW);
  });

  it('accepts models as an object map', () => {
    const snapshot = parseGoogleModels(bothWindows, { email: 'x', now: NOW });
    expect(snapshot.models).toHaveLength(1);
    expect(snapshot.models[0]?.name).toBe('gemini-2.5-flash');
  });

  it('accepts models as a plain array', () => {
    const snapshot = parseGoogleModels(modelsAsArray, { email: 'x', now: NOW });
    expect(snapshot.models.map((model) => model.name)).toEqual(['a', 'b']);
  });

  it('sets quotaResetTime to the earliest window reset', () => {
    const snapshot = parseGoogleModels(bothWindows, { email: 'x', now: NOW });
    expect(snapshot.quotaResetTime).toBe('2026-07-01T13:00:00Z');
  });
});

describe('parseModelInfo', () => {
  it('splits fiveHour and weekly windows regardless of array order', () => {
    const model = parseModelInfo(
      'gemini-2.5-flash',
      {
        quotaInfos: [
          {
            windowId: 'weekly',
            windowLabel: 'Weekly Limit',
            remainingFraction: 0.97,
            resetTime: '2026-07-05T18:00:00Z'
          },
          {
            windowId: 'fiveHour',
            windowLabel: 'Five Hour Limit',
            remainingFraction: 0.81,
            resetTime: '2026-07-01T13:00:00Z'
          }
        ]
      },
      NOW
    );

    expect(model.windows?.fiveHour?.remainingPercentage).toBe(81);
    expect(model.windows?.weekly?.remainingPercentage).toBe(97);
    expect(model.windows?.fiveHour?.timeUntilResetMs).toBe(60 * 60 * 1000);
    expect(model.windows?.weekly?.timeUntilResetMs).toBe((4 * 86400 + 6 * 3600) * 1000);
  });

  it('matches window kind case-insensitively via windowLabel', () => {
    const model = parseModelInfo(
      'x',
      {
        quotaInfos: [
          { windowLabel: 'WEEKLY LIMIT', remainingFraction: 0.5 },
          { windowLabel: '5 hour limit', remainingFraction: 0.9 }
        ]
      },
      NOW
    );
    expect(model.windows?.weekly?.remainingPercentage).toBe(50);
    expect(model.windows?.fiveHour?.remainingPercentage).toBe(90);
  });

  it('mirrors fiveHour into the legacy top-level fields', () => {
    const model = parseModelInfo('gemini-2.5-flash', bothWindows.models['gemini-2.5-flash'], NOW);
    expect(model.remainingPercentage).toBe(model.windows?.fiveHour?.remainingPercentage);
    expect(model.resetTime).toBe(model.windows?.fiveHour?.resetTime);
    expect(model.timeUntilResetMs).toBe(model.windows?.fiveHour?.timeUntilResetMs);
    expect(model.isExhausted).toBe(false);
  });

  it('leaves windows.weekly undefined when only fiveHour is present', () => {
    const snapshot = parseGoogleModels(onlyFiveHour, { email: 'x', now: NOW });
    const model = snapshot.models[0];
    expect(model?.windows?.fiveHour).toBeDefined();
    expect(model?.windows?.weekly).toBeUndefined();
  });

  it('falls back to the legacy quotaInfo single-object shape', () => {
    const snapshot = parseGoogleModels(legacySingleQuotaInfo, { email: 'x', now: NOW });
    const model = snapshot.models[0];
    expect(model?.remainingPercentage).toBe(50);
    expect(Object.keys(model?.windows ?? {})).toHaveLength(1);
  });

  it('preserves unknown windowIds so future kinds still show up', () => {
    const snapshot = parseGoogleModels(unknownWindow, { email: 'x', now: NOW });
    const model = snapshot.models[0];
    expect(model?.windows?.daily?.remainingPercentage).toBe(42);
    expect(model?.remainingPercentage).toBe(42);
  });

  it('marks isExhausted when remainingFraction is 0', () => {
    const snapshot = parseGoogleModels(exhaustedWeekly, { email: 'x', now: NOW });
    const model = snapshot.models[0];
    expect(model?.windows?.weekly?.isExhausted).toBe(true);
    expect(model?.windows?.weekly?.remainingPercentage).toBe(0);
    expect(model?.windows?.fiveHour?.isExhausted).toBe(false);
  });

  it('handles missing resetTime by leaving timeUntilResetMs undefined', () => {
    const snapshot = parseGoogleModels(missingResetTime, { email: 'x', now: NOW });
    const model = snapshot.models[0];
    expect(model?.windows?.fiveHour?.timeUntilResetMs).toBeUndefined();
    expect(model?.windows?.weekly?.timeUntilResetMs).toBeUndefined();
    expect(model?.windows?.fiveHour?.remainingPercentage).toBe(60);
    expect(model?.windows?.weekly?.remainingPercentage).toBe(90);
  });

  it('clamps out-of-range remainingFraction into [0, 100]', () => {
    const model = parseModelInfo(
      'x',
      {
        quotaInfos: [
          { windowId: 'fiveHour', remainingFraction: 1.4 },
          { windowId: 'weekly', remainingFraction: -0.2 }
        ]
      },
      NOW
    );
    expect(model.windows?.fiveHour?.remainingPercentage).toBe(100);
    expect(model.windows?.weekly?.remainingPercentage).toBe(0);
  });
});
