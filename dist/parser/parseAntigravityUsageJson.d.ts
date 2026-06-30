import type { MonitorConfig, MonitorSnapshot } from '../types.js';
export declare function parseAntigravityUsageJson(raw: unknown, config: MonitorConfig, method: string, source?: 'antigravity-usage' | 'mock'): MonitorSnapshot;
