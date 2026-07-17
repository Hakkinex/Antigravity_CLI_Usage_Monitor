import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchProvider: vi.fn(),
  renderDashboard: vi.fn(() => ''),
  renderRefreshLine: vi.fn(() => '')
}));

vi.mock('../src/providers/AntigravityUsageProvider.js', () => ({
  fetchAntigravityProvider: mocks.fetchProvider
}));

vi.mock('../src/render/renderDashboard.js', () => ({
  renderDashboard: mocks.renderDashboard,
  renderRefreshLine: mocks.renderRefreshLine
}));

vi.mock('../src/parser/parseAntigravityUsageJson.js', () => ({
  parseAntigravityUsageJson: () => ({
    fetchedAt: '2026-07-16T00:00:00Z',
    source: 'antigravity',
    method: 'google',
    accounts: [],
    errors: []
  })
}));

import { PollingEngine } from '../src/monitor/PollingEngine.js';
import { defaultConfig } from '../src/config/defaultConfig.js';

describe('PollingEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.fetchProvider.mockResolvedValue({ ok: true, raw: [], command: 'test' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('forces a fresh provider request on startup and every scheduled refresh', async () => {
    const engine = new PollingEngine({
      interval: 60,
      columns: 2,
      method: 'google',
      showEmail: true,
      maskEmail: false,
      allModels: false,
      refresh: false,
      debug: false,
      mock: false
    }, defaultConfig);

    engine.start();
    await vi.waitFor(() => expect(mocks.fetchProvider).toHaveBeenCalledTimes(1));
    expect(mocks.fetchProvider.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ refresh: true }));

    await vi.advanceTimersByTimeAsync(60_000);
    await vi.waitFor(() => expect(mocks.fetchProvider).toHaveBeenCalledTimes(2));
    expect(mocks.fetchProvider.mock.calls[1]?.[0]).toEqual(expect.objectContaining({ refresh: true }));

    engine.stop();
  });
});
