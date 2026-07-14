import { afterEach, describe, expect, it } from 'vitest';
import { getAccountDir } from '../src/antigravity/core/env.js';
import { refreshAccessToken } from '../src/antigravity/google/oauth.js';

describe('security guards', () => {
  const originalClientId = process.env.ANTIGRAVITY_OAUTH_CLIENT_ID;
  const originalClientSecret = process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET;

  afterEach(() => {
    if (originalClientId === undefined) delete process.env.ANTIGRAVITY_OAUTH_CLIENT_ID;
    else process.env.ANTIGRAVITY_OAUTH_CLIENT_ID = originalClientId;

    if (originalClientSecret === undefined) delete process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET;
    else process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET = originalClientSecret;
  });

  it('rejects account storage paths with traversal separators', () => {
    expect(() => getAccountDir('../outside@example.com')).toThrow('Invalid account email');
    expect(() => getAccountDir('..\\outside@example.com')).toThrow('Invalid account email');
  });

  it('fails safely when OAuth credentials are not configured', async () => {
    delete process.env.ANTIGRAVITY_OAUTH_CLIENT_ID;
    delete process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET;

    await expect(refreshAccessToken('not-a-real-token')).rejects.toThrow(
      'ANTIGRAVITY_OAUTH_CLIENT_ID and ANTIGRAVITY_OAUTH_CLIENT_SECRET'
    );
  });
});
