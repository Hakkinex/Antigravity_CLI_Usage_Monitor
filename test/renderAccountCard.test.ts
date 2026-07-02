import { describe, expect, it } from 'vitest';
import { renderAccountCard } from '../src/render/renderAccountCard.js';
import { stripAnsi } from '../src/utils/text.js';
import type { AccountQuota, ModelQuota } from '../src/types.js';

describe('renderAccountCard', () => {
  it('renders Antigravity CLI quota groups instead of per-model rows', () => {
    const account: AccountQuota = {
      id: 'user@example.com',
      email: 'user@example.com',
      displayName: 'user@example.com',
      status: 'ok',
      models: [
        model('Gemini 3 Flash', 'gemini', 99, '4h 4m'),
        model('Gemini 3.1 Pro (High)', 'gemini', 97, '4h 4m'),
        model('Claude Opus 4.6 (Thinking)', 'claude', 91, '130h 1m'),
        model('Claude Sonnet 4.6 (Thinking)', 'claude', 93, '130h 1m'),
        model('GPT-OSS 120B (Medium)', 'gpt', 92, '130h 1m')
      ]
    };

    const output = stripAnsi(renderAccountCard(account).join('\n'));

    expect(output).toContain('Gemini Flash/Pro');
    expect(output).toContain('Claude Opus/Sonnet/GPT');
    expect(output).toContain('97% 4h4m');
    expect(output).toContain('91% 130h1m');
    expect(output).toContain('Quota');
    expect(output).not.toContain('Gemini 3 Flash');
  });

  it('keeps exhausted rows visible and shows reset time', () => {
    const account: AccountQuota = {
      id: 'user@example.com',
      displayName: 'user@example.com',
      status: 'ok',
      models: [model('Gemini 3 Flash', 'gemini', 0, '36m')]
    };

    const output = stripAnsi(renderAccountCard(account).join('\n'));

    expect(output).toContain('Gemini Flash/Pro');
    expect(output).toContain('0% 36m');
  });
});

function model(
  name: string,
  group: ModelQuota['group'],
  remainingPercent: number,
  resetInText: string
): ModelQuota {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    group,
    remainingPercent,
    resetInText,
    status: remainingPercent > 80 ? 'healthy' : 'medium'
  };
}
