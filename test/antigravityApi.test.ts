import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  accountManager: {
    getActiveEmail: vi.fn(),
    getAccountEmails: vi.fn(),
    setActiveAccount: vi.fn()
  },
  fetchQuota: vi.fn(),
  saveCache: vi.fn(),
  isCacheValid: vi.fn(),
  loadCache: vi.fn(),
  getCacheAge: vi.fn(),
  resetTokenManager: vi.fn()
}));

vi.mock('../src/antigravity/accounts/index.js', () => ({
  getAccountManager: () => mocks.accountManager,
  saveCache: mocks.saveCache,
  isCacheValid: mocks.isCacheValid,
  loadCache: mocks.loadCache,
  getCacheAge: mocks.getCacheAge
}));

vi.mock('../src/antigravity/quota/service.js', () => ({
  fetchQuota: mocks.fetchQuota
}));

vi.mock('../src/antigravity/google/token-manager.js', () => ({
  resetTokenManager: mocks.resetTokenManager
}));

import { fetchAllQuotaSnapshots } from '../src/antigravity/api.js';

describe('fetchAllQuotaSnapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.accountManager.getActiveEmail.mockReturnValue('active@example.com');
    mocks.accountManager.getAccountEmails.mockReturnValue(['active@example.com', 'other@example.com']);
    mocks.isCacheValid.mockReturnValue(false);
    mocks.loadCache.mockReturnValue(undefined);
    mocks.getCacheAge.mockReturnValue(undefined);
  });

  it('uses the local provider once for the active IDE account', async () => {
    mocks.fetchQuota.mockResolvedValue({
      email: 'active@example.com',
      method: 'local',
      timestamp: '2026-07-01T14:33:21.253Z',
      models: []
    });

    const results = await fetchAllQuotaSnapshots({ method: 'local', refresh: true });

    expect(mocks.fetchQuota).toHaveBeenCalledTimes(1);
    expect(mocks.fetchQuota).toHaveBeenCalledWith('local');
    expect(results).toEqual([
      expect.objectContaining({
        email: 'active@example.com',
        isActive: true,
        status: 'success',
        snapshot: expect.objectContaining({
          email: 'active@example.com',
          method: 'local'
        })
      })
    ]);
  });

  it('returns an explicit error when local mode targets a different account', async () => {
    const results = await fetchAllQuotaSnapshots({
      method: 'local',
      accountEmail: 'other@example.com',
      refresh: true
    });

    expect(mocks.fetchQuota).not.toHaveBeenCalled();
    expect(results).toEqual([
      {
        email: 'other@example.com',
        isActive: false,
        status: 'error',
        error:
          'Local method only exposes the active IDE session account (active@example.com). Use --method google for other accounts.'
      }
    ]);
  });

  it('passes provider expectations into cache validation for google requests', async () => {
    mocks.isCacheValid.mockReturnValue(true);
    mocks.loadCache.mockReturnValue({ email: 'active@example.com', method: 'google', source: 'google', timestamp: 'x', models: [] });
    mocks.getCacheAge.mockReturnValue(12);

    const results = await fetchAllQuotaSnapshots({ method: 'google', refresh: false });

    expect(mocks.isCacheValid).toHaveBeenCalledWith('active@example.com', { method: 'google', source: 'google' });
    expect(results[0]).toEqual(
      expect.objectContaining({
        email: 'active@example.com',
        status: 'cached',
        cacheAge: 12
      })
    );
  });
});
