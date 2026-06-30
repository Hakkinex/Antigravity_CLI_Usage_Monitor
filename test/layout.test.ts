import { describe, expect, it } from 'vitest';
import { layoutCards } from '../src/render/layoutCards.js';

describe('layoutCards', () => {
  it('returns an empty string for no cards', () => {
    expect(layoutCards([], 2, 120)).toBe('');
  });

  it('falls back to one column when terminal is narrow', () => {
    const output = layoutCards([
      ['Account 1', 'row'],
      ['Account 2', 'row']
    ], 2, 12);

    expect(output).toContain('Account 1');
    expect(output).toContain('Account 2');
  });
});
