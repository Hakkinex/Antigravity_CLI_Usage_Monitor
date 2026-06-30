export function stripAnsi(input: string): string {
  return input.replace(/\u001b\[[0-9;]*m/g, '');
}

export function visibleLength(input: string): number {
  return stripAnsi(input).length;
}

export function padRight(input: string, width: number): string {
  return input + ' '.repeat(Math.max(0, width - visibleLength(input)));
}

export function truncate(input: string, width: number): string {
  if (visibleLength(input) <= width) return input;
  if (width <= 1) return '…'.slice(0, width);
  return `${stripAnsi(input).slice(0, width - 1)}…`;
}

export function color(input: string, code: number): string {
  return `\u001b[38;5;${code}m${input}\u001b[0m`;
}

export function dim(input: string): string {
  return `\u001b[2m${input}\u001b[0m`;
}
