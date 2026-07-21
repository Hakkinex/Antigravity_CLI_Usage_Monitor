import { describe, expect, it } from 'vitest';
import { renderAccountCard } from '../src/render/renderAccountCard.js';
import { stripAnsi } from '../src/utils/text.js';
import type { AccountQuota, ModelQuota } from '../src/types.js';

describe('renderAccountCard', () => {
  it('renders Antigravity CLI quota groups with 5h and Weekly columns', () => {
    const account: AccountQuota = {
      id: 'user@example.com',
      email: 'user@example.com',
      displayName: 'user@example.com',
      status: 'ok',
      models: [
        modelWithWeekly('Gemini 3 Flash', 'gemini', 99, '4h 4m', 95, '6d 2h'),
        modelWithWeekly('Claude Opus 4.6 (Thinking)', 'claude', 91, '130h 1m', 88, '6d 5h')
      ]
    };

    const output = stripAnsi(renderAccountCard(account).join('\n'));

    expect(output).toContain('Gemini Flash/Pro');
    expect(output).toContain('Claude/ChatGPT');
    expect(output).toContain('5h');
    expect(output).toContain('Weekly');
    expect(output).toContain('95% 6d2h');
    expect(output).toContain('88% 6d5h');
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
    expect(renderAccountCard(account).join('\n')).toContain('\u001b[38;5;196m●\u001b[0m');
    expect(output).toContain('0% 36m');
  });

  it('shows reset time even when provider omits remaining percentage', () => {
    const account: AccountQuota = {
      id: 'user@example.com',
      displayName: 'user@example.com',
      status: 'ok',
      models: [model('Claude Sonnet 4.6 (Thinking)', 'claude', null, '3h 22m')]
    };

    const output = stripAnsi(renderAccountCard(account).join('\n'));

    expect(output).toContain('Claude/ChatGPT');
    expect(output).toContain('● 3h22m');
    expect(output).not.toContain('?');
  });
});

function model(
  name: string,
  group: ModelQuota['group'],
  remainingPercent: number | null,
  resetInText: string
): ModelQuota {
  return modelWithWeekly(name, group, remainingPercent, resetInText, null, '');
}

function modelWithWeekly(
  name: string,
  group: ModelQuota['group'],
  remainingPercent: number | null,
  resetInText: string,
  weeklyPercent: number | null,
  weeklyReset: string
): ModelQuota {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    group,
    remainingPercent,
    resetInText,
    status:
      remainingPercent === null
        ? 'unknown'
        : remainingPercent <= 0
          ? 'exhausted'
          : remainingPercent > 80
            ? 'healthy'
            : 'medium',
    weeklyRemainingPercent: weeklyPercent,
    weeklyResetInText: weeklyReset || null,
    weeklyStatus: weeklyPercent === null ? 'unknown' : weeklyPercent > 80 ? 'healthy' : 'medium'
  };
}
