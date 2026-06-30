import type { MonitorConfig, WatchOptions } from '../types.js';
export declare class PollingEngine {
    private readonly options;
    private readonly config;
    private state;
    private timer;
    private tickTimer;
    private stopped;
    constructor(options: WatchOptions, config: MonitorConfig);
    start(): void;
    stop(): void;
    manualRefresh(): void;
    private tick;
    private scheduleNext;
    private refresh;
    private handleRefreshFailure;
    private render;
    private renderRefreshLine;
}
