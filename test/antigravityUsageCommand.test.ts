import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveAntigravityUsageCommand } from '../src/providers/antigravityUsageCommand.js';

describe('resolveAntigravityUsageCommand', () => {
  it('prefers the locally installed antigravity-usage binary', () => {
    const command = resolveAntigravityUsageCommand();

    expect(command.displayName).toMatch(/^node_modules\/.bin\/antigravity-usage/);
    expect(command.executable).toContain('node_modules');
    expect(command.executable).toContain('.bin');
    expect(existsSync(command.executable)).toBe(true);
  });
});
