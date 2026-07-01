/**
 * Local parser - converts Connect API response to QuotaSnapshot format
 */
import type { QuotaSnapshot } from '../quota/types.js';
import type { ConnectUserStatus } from './connect-client.js';
/**
 * Parse Connect API user status into QuotaSnapshot format
 */
export declare function parseLocalQuotaSnapshot(userStatus: ConnectUserStatus): QuotaSnapshot;
