import { fetchAntigravityUsage } from '../providers/AntigravityUsageProvider.js';
import { fetchMockUsage } from '../providers/mockProvider.js';
import { parseAntigravityUsageJson } from '../parser/parseAntigravityUsageJson.js';
import { renderDashboard, renderRefreshLine } from '../render/renderDashboard.js';
export class PollingEngine {
    options;
    config;
    state;
    timer;
    tickTimer;
    stopped = false;
    constructor(options, config) {
        this.options = options;
        this.config = config;
        this.state = {
            snapshot: null,
            isFetching: false,
            nextRefreshInSec: options.interval
        };
    }
    start() {
        if (process.stdout.isTTY) {
            process.stdout.write('\u001b[?1049h\u001b[?25l\u001b[H');
            this.tickTimer = setInterval(() => this.tick(), 1000);
        }
        void this.refresh(this.options.refresh).catch((error) => this.handleRefreshFailure(error));
    }
    stop() {
        this.stopped = true;
        if (this.timer)
            clearTimeout(this.timer);
        if (this.tickTimer)
            clearInterval(this.tickTimer);
        if (process.stdout.isTTY) {
            process.stdout.write('\u001b[?25h\u001b[?1049l');
        }
        else {
            process.stdout.write('\n');
        }
    }
    manualRefresh() {
        void this.refresh(true).catch((error) => this.handleRefreshFailure(error));
    }
    tick() {
        if (this.stopped || this.state.isFetching || !this.state.snapshot)
            return;
        this.state.nextRefreshInSec = Math.max(0, this.state.nextRefreshInSec - 1);
        this.renderRefreshLine();
    }
    scheduleNext() {
        if (this.stopped)
            return;
        if (this.timer)
            clearTimeout(this.timer);
        this.state.nextRefreshInSec = this.options.interval;
        this.timer = setTimeout(() => {
            void this.refresh(false).catch((error) => this.handleRefreshFailure(error));
        }, this.options.interval * 1000);
    }
    async refresh(forceRefresh) {
        if (this.state.isFetching)
            return;
        this.state.isFetching = true;
        this.render();
        try {
            const result = this.options.mock
                ? { ok: true, raw: fetchMockUsage(), command: 'mock fixture' }
                : await fetchAntigravityUsage({ ...this.options, refresh: forceRefresh });
            if (result.ok) {
                this.state.snapshot = parseAntigravityUsageJson(result.raw, this.config, 
                // CLI privacy flags are merged into config before the engine is created.
                String(this.options.method), this.options.mock ? 'mock' : 'antigravity-usage');
                this.state.lastError = undefined;
                this.state.command = result.command;
            }
            else {
                this.state.lastError = result.error.message;
            }
        }
        catch (error) {
            this.state.lastError = error instanceof Error ? error.message : String(error);
        }
        finally {
            this.state.isFetching = false;
            this.scheduleNext();
            this.render();
        }
    }
    handleRefreshFailure(error) {
        this.state.lastError = error instanceof Error ? error.message : String(error);
        this.state.isFetching = false;
        this.render();
    }
    render() {
        process.stdout.write('\u001b[H\u001b[0J');
        process.stdout.write(renderDashboard(this.state, this.options));
    }
    renderRefreshLine() {
        const terminalWidth = process.stdout.columns || 120;
        const line = renderRefreshLine(this.state.snapshot?.source ?? 'pending', String(this.options.method), `Next refresh: ${this.state.nextRefreshInSec}s`, terminalWidth);
        process.stdout.write(`\u001b[2;1H${line}\u001b[K`);
    }
}
//# sourceMappingURL=PollingEngine.js.map