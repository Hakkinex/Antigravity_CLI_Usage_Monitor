/**
 * Status command - show current login status
 */
interface StatusOptions {
    all?: boolean;
    account?: string;
}
export declare function statusCommand(options?: StatusOptions): void;
export {};
