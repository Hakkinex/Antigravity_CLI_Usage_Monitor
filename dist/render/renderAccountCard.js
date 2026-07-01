import { color, dim, padRight, truncate } from '../utils/text.js';
import { statusDot } from '../utils/status.js';
import { buildQuotaGroups } from './quotaGroups.js';
const MODEL_WIDTH = 23;
const FIVE_HOUR_WIDTH = 12;
const WEEK_WIDTH = 12;
const CARD_WIDTH = MODEL_WIDTH + FIVE_HOUR_WIDTH + WEEK_WIDTH + 10;
export function renderAccountCard(account) {
    const title = ` ${account.displayName} `;
    const lines = [
        `${title}${'─'.repeat(Math.max(0, CARD_WIDTH - title.length))}`,
        tableBorder('top'),
        row(color('Model', 71), color('5h', 71), color('Week', 71)),
        tableBorder('mid')
    ];
    if (account.status === 'error') {
        lines.push(fullRow(color('Status: fetch failed', 203)));
        lines.push(fullRow(truncate(account.errorMessage ?? 'Unknown error', CARD_WIDTH - 4)));
    }
    else if (account.models.length === 0) {
        lines.push(fullRow(dim('No model quota returned')));
    }
    else {
        const groups = buildQuotaGroups(account.models);
        for (const group of groups) {
            lines.push(row(color(truncate(group.label, MODEL_WIDTH), 223), quotaCell(group.fiveHour.status, group.fiveHour.remainingPercent, group.fiveHour.resetInText), quotaCell(group.week.status, group.week.remainingPercent, group.week.resetInText)));
        }
    }
    lines.push(tableBorder('bottom'));
    return lines;
}
function quotaCell(status, percent, reset) {
    if (percent === null)
        return dim('no data');
    const remain = `${percent}%`;
    const resetText = compactReset(reset);
    return `${statusDot(status)} ${remain}${resetText ? ` ${resetText}` : ''}`;
}
function compactReset(reset) {
    if (!reset)
        return '';
    return reset.replace(/\s+/g, '');
}
function row(model, fiveHour, week) {
    return `│ ${padRight(truncate(model, MODEL_WIDTH), MODEL_WIDTH)} │ ${padRight(truncate(fiveHour, FIVE_HOUR_WIDTH), FIVE_HOUR_WIDTH)} │ ${padRight(truncate(week, WEEK_WIDTH), WEEK_WIDTH)} │`;
}
function fullRow(content) {
    return `│ ${padRight(truncate(content, CARD_WIDTH - 4), CARD_WIDTH - 4)} │`;
}
function tableBorder(kind) {
    if (kind === 'top')
        return `┌${'─'.repeat(MODEL_WIDTH + 2)}┬${'─'.repeat(FIVE_HOUR_WIDTH + 2)}┬${'─'.repeat(WEEK_WIDTH + 2)}┐`;
    if (kind === 'mid')
        return `├${'─'.repeat(MODEL_WIDTH + 2)}┼${'─'.repeat(FIVE_HOUR_WIDTH + 2)}┼${'─'.repeat(WEEK_WIDTH + 2)}┤`;
    return `└${'─'.repeat(MODEL_WIDTH + 2)}┴${'─'.repeat(FIVE_HOUR_WIDTH + 2)}┴${'─'.repeat(WEEK_WIDTH + 2)}┘`;
}
//# sourceMappingURL=renderAccountCard.js.map