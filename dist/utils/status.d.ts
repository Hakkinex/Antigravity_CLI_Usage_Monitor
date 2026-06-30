import type { ModelGroup, ModelStatus, MonitorConfig } from '../types.js';
export declare function getModelGroup(name: string): ModelGroup;
export declare function getModelStatus(percent: number | null, config: MonitorConfig): ModelStatus;
export declare function statusDot(status: ModelStatus): string;
