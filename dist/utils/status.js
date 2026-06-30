export function getModelGroup(name) {
    const lower = name.toLowerCase();
    if (lower.includes('gemini'))
        return 'gemini';
    if (lower.includes('claude'))
        return 'claude';
    if (lower.includes('gpt'))
        return 'gpt';
    return 'other';
}
export function getModelStatus(percent, config) {
    if (percent === null || Number.isNaN(percent))
        return 'unknown';
    if (percent <= 0)
        return 'exhausted';
    if (percent < config.thresholds.orange)
        return 'critical';
    if (percent < config.thresholds.yellow)
        return 'low';
    if (percent < config.thresholds.green)
        return 'medium';
    return 'healthy';
}
export function statusDot(status) {
    switch (status) {
        case 'healthy':
            return '\u001b[38;5;118m●\u001b[0m';
        case 'medium':
            return '\u001b[38;5;221m●\u001b[0m';
        case 'low':
            return '\u001b[38;5;214m●\u001b[0m';
        case 'critical':
            return '\u001b[38;5;203m●\u001b[0m';
        case 'exhausted':
            return '\u001b[38;5;245m●\u001b[0m';
        default:
            return '\u001b[38;5;245m?\u001b[0m';
    }
}
//# sourceMappingURL=status.js.map