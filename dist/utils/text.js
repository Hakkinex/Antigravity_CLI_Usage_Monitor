export function stripAnsi(input) {
    return input.replace(/\u001b\[[0-9;]*m/g, '');
}
export function visibleLength(input) {
    return stripAnsi(input).length;
}
export function padRight(input, width) {
    return input + ' '.repeat(Math.max(0, width - visibleLength(input)));
}
export function truncate(input, width) {
    if (visibleLength(input) <= width)
        return input;
    if (width <= 1)
        return '…'.slice(0, width);
    return `${stripAnsi(input).slice(0, width - 1)}…`;
}
export function color(input, code) {
    return `\u001b[38;5;${code}m${input}\u001b[0m`;
}
export function dim(input) {
    return `\u001b[2m${input}\u001b[0m`;
}
//# sourceMappingURL=text.js.map