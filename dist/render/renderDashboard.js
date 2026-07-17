import { renderAccountCard } from './renderAccountCard.js';
import { layoutCards } from './layoutCards.js';
import { color, dim, padRight, stripAnsi } from '../utils/text.js';
export function renderDashboard(state, options) {
    const terminalWidth = process.stdout.columns || 120;
    const lines = [];
    lines.push(twoCol(color('Antigravity CLI Usage Monitor', 118), `Last update: ${state.snapshot ? new Date(state.snapshot.fetchedAt).toLocaleTimeString() : 'never'}`, terminalWidth));
    lines.push(renderRefreshLine(state.snapshot?.source ?? 'pending', String(options.method), state.isFetching ? color('Fetching...', 221) : `Next refresh: ${state.nextRefreshInSec}s`, terminalWidth));
    lines.push(twoCol(`Accounts: ${state.snapshot?.accounts.length ?? 0}`, 'Press r refresh, q quit', terminalWidth));
    if (state.command && options.debug) {
        lines.push(dim(`Command: ${state.command}`));
    }
    lines.push('');
    if (state.lastError && state.snapshot) {
        lines.push(color(`Warning: ${state.lastError}`, 203));
        lines.push('');
    }
    if (state.snapshot && state.snapshot.accounts.length > 0) {
        lines.push(layoutCards(state.snapshot.accounts.map((account) => renderAccountCard(account, options)), options.columns, terminalWidth));
    }
    else if (state.lastError) {
        lines.push(color(`Error: ${state.lastError}`, 203));
        lines.push('');
        lines.push('Configure Antigravity auth or local Antigravity access, then run:');
        lines.push('  agy-monitor watch');
    }
    else {
        lines.push(dim('Waiting for first quota snapshot...'));
    }
    return lines.join('\n');
}
function twoCol(left, right, width) {
    const rightWidth = stripAnsi(right).length;
    return `${padRight(left, Math.max(1, width - rightWidth - 1))}${right}`;
}
export function renderRefreshLine(source, method, right, width) {
    return twoCol(`Source: ${source} / ${method}`, right, width);
}
//# sourceMappingURL=renderDashboard.js.map