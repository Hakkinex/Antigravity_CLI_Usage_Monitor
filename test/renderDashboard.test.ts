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

  it('shows a warning when the snapshot is a cached fallback', () => {
    const options: WatchOptions = {
      interval: 60,
      columns: 2,
      method: 'google',
      showEmail: true,
      maskEmail: false,
      allModels: false,
      refresh: false,
      debug: false,
      mock: false
    };
    const output = stripAnsi(renderDashboard({
      snapshot: {
        fetchedAt: '2026-07-16T00:00:00Z',
        source: 'antigravity',
        method: 'google',
        accounts: [],
        errors: []
      },
      lastError: 'fresh update failed; using 91s-old cache',
      isFetching: false,
      nextRefreshInSec: 60
    }, options));

    expect(output).toContain('Warning: fresh update failed; using 91s-old cache');
  });
});
