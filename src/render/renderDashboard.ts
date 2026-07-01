import type { MonitorSnapshot, WatchOptions } from '../types.js';
import { renderAccountCard } from './renderAccountCard.js';
import { layoutCards } from './layoutCards.js';
import { color, dim, padRight, stripAnsi } from '../utils/text.js';

export type RenderState = {
  snapshot: MonitorSnapshot | null;
  lastError?: string;
  isFetching: boolean;
  nextRefreshInSec: number;
  command?: string;
};

export function renderDashboard(state: RenderState, options: WatchOptions): string {
  const terminalWidth = process.stdout.columns || 120;
  const lines: string[] = [];

  lines.push(
    twoCol(
      color('agy-monitor', 118),
      `Last update: ${state.snapshot ? new Date(state.snapshot.fetchedAt).toLocaleTimeString() : 'never'}`,
      terminalWidth
    )
  );
  lines.push(
    renderRefreshLine(
      state.snapshot?.source ?? 'pending',
      String(options.method),
      state.isFetching ? color('Fetching...', 221) : `Next refresh: ${state.nextRefreshInSec}s`,
      terminalWidth
    )
  );
  lines.push(
    twoCol(
      `Accounts: ${state.snapshot?.accounts.length ?? 0}`,
      'Press r refresh, q quit',
      terminalWidth
    )
  );

  if (state.command && options.debug) {
    lines.push(dim(`Command: ${state.command}`));
  }

  lines.push('');

  if (state.snapshot && state.snapshot.accounts.length > 0) {
    lines.push(layoutCards(state.snapshot.accounts.map(renderAccountCard), options.columns, terminalWidth));
  } else if (state.lastError) {
    lines.push(color(`Error: ${state.lastError}`, 203));
    lines.push('');
    lines.push('Configure Antigravity auth or local Antigravity access, then run:');
    lines.push('  agy-monitor watch');
  } else {
    lines.push(dim('Waiting for first quota snapshot...'));
  }

  return lines.join('\n');
}

function twoCol(left: string, right: string, width: number): string {
  const rightWidth = stripAnsi(right).length;
  return `${padRight(left, Math.max(1, width - rightWidth - 1))}${right}`;
}

export function renderRefreshLine(source: string, method: string, right: string, width: number): string {
  return twoCol(`Source: ${source} / ${method}`, right, width);
}
