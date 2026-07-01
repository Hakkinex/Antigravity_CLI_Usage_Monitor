/**
 * Port prober - probes ports to find the Connect API endpoint
 */
export interface ProbeResult {
    baseUrl: string;
    protocol: 'https' | 'http';
    port: number;
}
/**
 * Probes ports to find a working Connect API endpoint
 * Tries HTTPS first (with self-signed cert handling), then HTTP
 * @param ports Array of port numbers to probe
 * @param csrfToken Optional CSRF token for authentication
 * @param timeout Timeout per probe in ms (default 500ms)
 * @returns ProbeResult with working endpoint, or null if none found
 */
export declare function probeForConnectAPI(ports: number[], csrfToken?: string, timeout?: number): Promise<ProbeResult | null>;
