import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  exec: vi.fn()
}));

vi.mock('child_process', () => ({
  exec: mocks.exec
}));

import { detectAntigravityProcess } from '../src/antigravity/local/process-detector.js';

describe('detectAntigravityProcess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses unix ps output and extracts pid/token/port', async () => {
    mocks.exec.mockImplementation((command: string, callback: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
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
        extensionServerPort: 4312
      })
    );
  });
});
