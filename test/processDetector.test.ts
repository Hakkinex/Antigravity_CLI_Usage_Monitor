import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  execFile: vi.fn()
}));

vi.mock('child_process', () => ({
  execFile: mocks.execFile
}));

import { detectAntigravityProcess } from '../src/antigravity/local/process-detector.js';

describe('detectAntigravityProcess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses unix ps output and extracts pid/token/port', async () => {
    mocks.execFile.mockImplementation((command: string, args: string[], options: unknown, callback: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
      callback(null, {
        stdout:
          'user 123 0.0 0.0 0 0 ? S 00:00 0:00 /opt/antigravity language-server --csrf_token=abc --extension_server_port 4312\n',
        stderr: ''
      });
    });

    const result = await detectAntigravityProcess();

    expect(result).toEqual(
      expect.objectContaining({
        pid: 123,
        csrfToken: 'abc',
        extensionServerPort: 4312,
        commandLine: expect.stringContaining('--csrf_token=[REDACTED]')
      })
    );
    expect(result?.commandLine).not.toContain('--csrf_token=abc');
  });
});
