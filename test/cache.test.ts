import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadAccountCache: vi.fn(),
  saveAccountCache: vi.fn(),
  deleteAccountCache: vi.fn(),
  getCacheTTL: vi.fn()
}));

vi.mock('../src/antigravity/accounts/storage.js', () => ({
  loadAccountCache: mocks.loadAccountCache,
  saveAccountCache: mocks.saveAccountCache,
  deleteAccountCache: mocks.deleteAccountCache
}));

vi.mock('../src/antigravity/accounts/config.js', () => ({
  getCacheTTL: mocks.getCacheTTL
}));

import { isCacheValid, saveCache } from '../src/antigravity/accounts/cache.js';

describe('cache helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-02T00:00:00Z'));
    mocks.getCacheTTL.mockReturnValue(300);
  });

  it('rejects cache when provider metadata does not match', () => {
    mocks.loadAccountCache.mockReturnValue({
      cachedAt: '2026-07-01T23:59:00Z',
      ttl: 300,
      method: 'google',
      source: 'google',
      data: { timestamp: 'x', method: 'google', source: 'google', models: [] }
    });

    expect(isCacheValid('a@example.com', { method: 'local', source: 'local' })).toBe(false);
  });

  it('accepts fresh cache when provider metadata matches', () => {
    mocks.loadAccountCache.mockReturnValue({
      cachedAt: '2026-07-01T23:59:00Z',
      ttl: 300,
      method: 'google',
      source: 'google',
      data: { timestamp: 'x', method: 'google', source: 'google', models: [] }
    });

    expect(isCacheValid('a@example.com', { method: 'google', source: 'google' })).toBe(true);
  });

  it('persists method and source metadata when saving cache', () => {
    saveCache('a@example.com', { timestamp: 'x', method: 'local', source: 'local', models: [] });

    expect(mocks.saveAccountCache).toHaveBeenCalledWith(
      'a@example.com',
      expect.objectContaining({ method: 'local', source: 'local', ttl: 300 })
    );
  });
});
