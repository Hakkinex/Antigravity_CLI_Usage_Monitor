/**
 * Logout command - remove account(s)
 */
interface LogoutOptions {
    all?: boolean;
}
export declare function logoutCommand(options: LogoutOptions, email?: string): void;
export {};
