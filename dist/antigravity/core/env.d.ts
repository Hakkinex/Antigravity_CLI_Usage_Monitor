export type Platform = 'windows' | 'macos' | 'linux';
export declare function getPlatform(): Platform;
export declare function getConfigDir(): string;
export declare function getLegacyConfigDir(): string;
export declare function ensureLegacyConfigImported(): void;
export declare function getTokensPath(): string;
export declare function getAccountsDir(): string;
export declare function getAccountDir(email: string): string;
export declare function getGlobalConfigPath(): string;
