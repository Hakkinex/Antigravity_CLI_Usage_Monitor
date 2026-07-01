/**
 * Logger utility with debug mode support
 */
export declare function setDebugMode(enabled: boolean): void;
export declare function isDebugMode(): boolean;
export declare function debug(category: string, message: string, data?: unknown): void;
export declare function info(message: string): void;
export declare function warn(message: string): void;
export declare function error(message: string): void;
export declare function success(message: string): void;
