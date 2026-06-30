import type { MonitorSnapshot, WatchOptions } from '../types.js';
export type RenderState = {
    snapshot: MonitorSnapshot | null;
    lastError?: string;
    isFetching: boolean;
    nextRefreshInSec: number;
    command?: string;
};
export declare function renderDashboard(state: RenderState, options: WatchOptions): string;
export declare function renderRefreshLine(source: string, method: string, right: string, width: number): string;
