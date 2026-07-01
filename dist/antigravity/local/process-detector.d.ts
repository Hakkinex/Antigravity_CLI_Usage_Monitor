/**
 * Process detector - finds running Antigravity language server processes
 */
export interface AntigravityProcessInfo {
    pid: number;
    csrfToken?: string;
    extensionServerPort?: number;
    commandLine: string;
}
/**
 * Detects running Antigravity language server processes
 * Returns process info including PID and extracted command-line arguments
 */
export declare function detectAntigravityProcess(): Promise<AntigravityProcessInfo | null>;
