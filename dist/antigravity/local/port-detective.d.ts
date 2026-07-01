/**
 * Port detective - discovers listening ports for a given process
 */
/**
 * Discovers which ports a process is listening on
 * @param pid Process ID to check
 * @returns Array of port numbers the process is listening on
 */
export declare function discoverPorts(pid: number): Promise<number[]>;
