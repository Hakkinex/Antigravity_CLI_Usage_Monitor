import { describe, expect, it } from 'vitest';
import { renderDashboard } from '../src/render/renderDashboard.js';
import { stripAnsi } from '../src/utils/text.js';
import type { WatchOptions } from '../src/types.js';

describe('renderDashboard', () => {
  it('renders the full product name in the header', () => {
    const options: WatchOptions = {
      interval: 30,
      columns: 2,
      method: 'google',
      showEmail: true,
      maskEmail: false,
      allModels: false,
      refresh: false,
      debug: false,
      mock: false
    };

    const output = stripAnsi(
      renderDashboard(
        {
          snapshot: null,
          isFetching: false,
          nextRefreshInSec: 30
        },
        options
      )
    );

    expect(output).toContain('Antigravity CLI Usage Monitor');
  });
});
