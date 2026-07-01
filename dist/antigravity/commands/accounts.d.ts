/**
 * Accounts command - manage multiple accounts
 */
interface ListOptions {
    refresh?: boolean;
}
interface RemoveOptions {
    force?: boolean;
}
interface RefreshOptions {
    all?: boolean;
}
/**
 * List all accounts
 */
export declare function listAccountsCommand(options: ListOptions): void;
/**
 * Add a new account (triggers OAuth flow)
 */
export declare function addAccountCommand(): Promise<void>;
/**
 * Switch active account
 */
export declare function switchAccountCommand(email: string): void;
/**
 * Remove an account
 */
export declare function removeAccountCommand(email: string, options: RemoveOptions): void;
/**
 * Show current active account
 */
export declare function currentAccountCommand(): void;
/**
 * Refresh account tokens
 */
export declare function refreshAccountCommand(email: string | undefined, options: RefreshOptions): Promise<void>;
/**
 * Main accounts command handler - dispatches to subcommands
 */
export declare function accountsCommand(subcommand: string, args: string[], options: {
    refresh?: boolean;
    force?: boolean;
    all?: boolean;
}): Promise<void>;
export {};
