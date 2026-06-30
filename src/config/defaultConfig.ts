import type { MonitorConfig } from '../types.js';

export const defaultConfig: MonitorConfig = {
  refreshIntervalSec: 60,
  columns: 2,
  method: 'google',
  maskEmail: false,
  allModels: false,
  accountAliases: {},
  thresholds: {
    green: 80,
    yellow: 40,
    orange: 15,
    red: 1
  }
};
