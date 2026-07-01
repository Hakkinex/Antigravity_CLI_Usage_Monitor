/**
 * Login command - authenticate with Google
 *
 * This is kept for backward compatibility.
 * For multi-account management, use `agy-monitor accounts add`
 */
interface LoginOptions {
    noBrowser?: boolean;
    port?: number;
    manual?: boolean;
}
export declare function loginCommand(options: LoginOptions): Promise<void>;
export {};
