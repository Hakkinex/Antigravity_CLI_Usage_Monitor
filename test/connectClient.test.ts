import { describe, expect, it } from 'vitest';
import { ConnectClient } from '../src/antigravity/local/connect-client.js';

describe('ConnectClient parsing', () => {
  it('extracts nested user status and quota data', () => {
    const client = new ConnectClient('https://127.0.0.1:1');
    const status = (client as any).parseUserStatus({
      userStatus: {
        email: 'user@example.com',
        isAuthenticated: true,
        planStatus: {
          availablePromptCredits: 70,
          planInfo: {
            monthlyPromptCredits: 100
          }
        },
        cascadeModelConfigData: {
          clientModelConfigs: [
            {
              label: 'Gemini Pro',
              modelOrAlias: { model: 'gemini-pro' },
              quotaInfo: {
                remainingFraction: 0.55,
                resetTime: '2999-01-01T00:00:00Z'
              }
            }
          ]
        }
      }
    });

    expect(status.email).toBe('user@example.com');
    expect(status.isAuthenticated).toBe(true);
    expect(status.quota?.promptCredits).toEqual({ used: 30, limit: 100, remaining: 70 });
    expect(status.quota?.models?.[0]).toEqual(
      expect.objectContaining({
        modelId: 'gemini-pro',
        label: 'Gemini Pro',
        isExhausted: false
      })
    );
  });
});
