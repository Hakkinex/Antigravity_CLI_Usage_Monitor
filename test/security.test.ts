import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAccountDir } from '../src/antigravity/core/env.js';
import { refreshAccessToken } from '../src/antigravity/google/oauth.js';

describe('security guards', () => {
  const originalClientId = process.env.ANTIGRAVITY_OAUTH_CLIENT_ID;
  const originalClientSecret = process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalClientId === undefined) delete process.env.ANTIGRAVITY_OAUTH_CLIENT_ID;
    else process.env.ANTIGRAVITY_OAUTH_CLIENT_ID = originalClientId;

    if (originalClientSecret === undefined) delete process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET;
    else process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET = originalClientSecret;
  });

  it('rejects account storage paths with traversal separators', () => {
    expect(() => getAccountDir('../outside@example.com')).toThrow('Invalid account email');
    expect(() => getAccountDir('..\\outside@example.com')).toThrow('Invalid account email');
  });

  it('uses the built-in upstream OAuth client when overrides are not configured', async () => {
    delete process.env.ANTIGRAVITY_OAUTH_CLIENT_ID;
    delete process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET;

    const fetchMock = vi.fn().mockResolvedValue(new Response('invalid grant', { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(refreshAccessToken('not-a-real-token')).rejects.toThrow('Token refresh failed: 400');
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = new URLSearchParams(String(request.body));
    expect(body.get('client_id')).toMatch(/\.apps\.googleusercontent\.com$/);
    expect(body.get('client_secret')).toBeTruthy();
  });

  it('rejects a partial custom OAuth override', async () => {
    process.env.ANTIGRAVITY_OAUTH_CLIENT_ID = 'custom-client-id';
    delete process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET;

    await expect(refreshAccessToken('not-a-real-token')).rejects.toThrow('Custom Google OAuth credentials are incomplete');
  });
});
