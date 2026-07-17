import { fetchAntigravityProvider } from '../providers/AntigravityUsageProvider.js';
import { fetchMockUsage } from '../providers/mockProvider.js';
import { parseAntigravityUsageJson } from '../parser/parseAntigravityUsageJson.js';
import { renderDashboard, renderRefreshLine, type RenderState } from '../render/renderDashboard.js';
import type { MonitorConfig, WatchOptions } from '../types.js';

export class PollingEngine {
  private state: RenderState;
  private timer: NodeJS.Timeout | undefined;
  private tickTimer: NodeJS.Timeout | undefined;
  private stopped = false;

  constructor(
    private readonly options: WatchOptions,
    private readonly config: MonitorConfig
  ) {
    this.state = {
      snapshot: null,
      isFetching: false,
      nextRefreshInSec: options.interval
    };
  }

  start(): void {
    if (process.stdout.isTTY) {
      process.stdout.write('\u001b[?1049h\u001b[?25l\u001b[H');
      this.tickTimer = setInterval(() => this.tick(), 1000);
    }
    void this.refresh(true).catch((error) => this.handleRefreshFailure(error));
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.tickTimer) clearInterval(this.tickTimer);
    if (process.stdout.isTTY) {
      process.stdout.write('\u001b[?25h\u001b[?1049l');
    } else {
      process.stdout.write('\n');
    }
  }

  manualRefresh(): void {
    void this.refresh(true).catch((error) => this.handleRefreshFailure(error));
  }

  private tick(): void {
    if (this.stopped || this.state.isFetching || !this.state.snapshot) return;
    this.state.nextRefreshInSec = Math.max(0, this.state.nextRefreshInSec - 1);
    this.renderRefreshLine();
  }

  private scheduleNext(): void {
    if (this.stopped) return;
    if (this.timer) clearTimeout(this.timer);
    this.state.nextRefreshInSec = this.options.interval;
    this.timer = setTimeout(() => {
      void this.refresh(true).catch((error) => this.handleRefreshFailure(error));
    }, this.options.interval * 1000);
  }

  private async refresh(forceRefresh: boolean): Promise<void> {
    if (this.state.isFetching) return;

    this.state.isFetching = true;
    this.render();

    try {
      const result = this.options.mock
        ? { ok: true as const, raw: fetchMockUsage(), command: 'mock fixture' }
        : await fetchAntigravityProvider({ ...this.options, refresh: forceRefresh });

      if (result.ok) {
        this.state.snapshot = parseAntigravityUsageJson(
          result.raw,
          this.config,
          // CLI privacy flags are merged into config before the engine is created.
          String(this.options.method),
          this.options.mock ? 'mock' : 'antigravity'
        );
        this.state.lastError = result.warning;
        this.state.command = result.command;
      } else {
        this.state.lastError = result.error.message;
      }
    } catch (error) {
      this.state.lastError = error instanceof Error ? error.message : String(error);
    } finally {
      this.state.isFetching = false;
      this.scheduleNext();
      this.render();
    }
  }

  private handleRefreshFailure(error: unknown): void {
    this.state.lastError = error instanceof Error ? error.message : String(error);
    this.state.isFetching = false;
    this.render();
  }

  private render(): void {
    process.stdout.write('\u001b[H\u001b[0J');
    process.stdout.write(renderDashboard(this.state, this.options));
  }

  private renderRefreshLine(): void {
    const terminalWidth = process.stdout.columns || 120;
    const line = renderRefreshLine(
      this.state.snapshot?.source ?? 'pending',
      String(this.options.method),
      `Next refresh: ${this.state.nextRefreshInSec}s`,
      terminalWidth
    );
    process.stdout.write(`\u001b[2;1H${line}\u001b[K`);
  }
}
