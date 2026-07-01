/**
 * Wakeup command - Auto wake-up and warm up AI models
 */
type WakeupSubcommand = 'config' | 'trigger' | 'install' | 'uninstall' | 'test' | 'history' | 'status';
interface WakeupOptions {
    scheduled?: boolean;
    limit?: string;
    json?: boolean;
    email?: string;
    model?: string;
    prompt?: string;
}
/**
 * Main wakeup command handler
 */
export declare function wakeupCommand(subcommand: WakeupSubcommand, args: string[], options: WakeupOptions): Promise<void>;
export {};
