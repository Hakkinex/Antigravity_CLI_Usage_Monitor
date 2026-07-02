import type { AccountQuota, WatchOptions } from '../types.js';
import { color, dim, padRight, truncate } from '../utils/text.js';
import { statusDot } from '../utils/status.js';
import { buildQuotaGroups } from './quotaGroups.js';

const MODEL_WIDTH = 23;
const QUOTA_WIDTH = 24;
const CARD_WIDTH = MODEL_WIDTH + QUOTA_WIDTH + 7;

export function renderAccountCard(account: AccountQuota, options: Pick<WatchOptions, 'allModels'> = { allModels: false }): string[] {
  const title = ` ${account.displayName} `;
  const lines = [
    `${title}${'─'.repeat(Math.max(0, CARD_WIDTH - title.length))}`,
    tableBorder('top'),
    row(color('Model', 71), color('Quota', 71)),
    tableBorder('mid')
  ];

  if (account.status === 'error') {
    lines.push(fullRow(color('Status: fetch failed', 203)));
    lines.push(fullRow(truncate(account.errorMessage ?? 'Unknown error', CARD_WIDTH - 4)));
  } else if (account.models.length === 0) {
    lines.push(fullRow(dim('No model quota returned')));
  } else {
    const visibleModels = options.allModels
      ? account.models
      : account.models.filter((model) => !model.isAutocompleteOnly && model.group !== 'other');
    const groups = buildQuotaGroups(visibleModels);
    for (const group of groups) {
      lines.push(
        row(
          color(truncate(group.label, MODEL_WIDTH), 223),
          quotaCell(group.quota.status, group.quota.remainingPercent, group.quota.resetInText)
        )
      );
    }
  }

  lines.push(tableBorder('bottom'));
  return lines;
}

function quotaCell(status: Parameters<typeof statusDot>[0], percent: number | null, reset: string | null): string {
  if (percent === null) return dim('no data');
  const remain = `${percent}%`;
  const resetText = compactReset(reset);
  return `${statusDot(status)} ${remain}${resetText ? ` ${resetText}` : ''}`;
}

function compactReset(reset: string | null): string {
  if (!reset) return '';
  return reset.replace(/\s+/g, '');
}

function row(model: string, quota: string): string {
  return `│ ${padRight(truncate(model, MODEL_WIDTH), MODEL_WIDTH)} │ ${padRight(
    truncate(quota, QUOTA_WIDTH),
    QUOTA_WIDTH
  )} │`;
}

function fullRow(content: string): string {
  return `│ ${padRight(truncate(content, CARD_WIDTH - 4), CARD_WIDTH - 4)} │`;
}

function tableBorder(kind: 'top' | 'mid' | 'bottom'): string {
  if (kind === 'top') return `┌${'─'.repeat(MODEL_WIDTH + 2)}┬${'─'.repeat(QUOTA_WIDTH + 2)}┐`;
  if (kind === 'mid') return `├${'─'.repeat(MODEL_WIDTH + 2)}┼${'─'.repeat(QUOTA_WIDTH + 2)}┤`;
  return `└${'─'.repeat(MODEL_WIDTH + 2)}┴${'─'.repeat(QUOTA_WIDTH + 2)}┘`;
}
