import { chmodSync } from 'node:fs';
export function setPrivateDirectoryPermissions(path) {
    try {
        chmodSync(path, 0o700);
    }
    catch (error) {
        if (process.platform !== 'win32')
            throw error;
    }
}
export function setPrivateFilePermissions(path) {
    try {
        chmodSync(path, 0o600);
    }
    catch (error) {
        if (process.platform !== 'win32')
            throw error;
    }
}
//# sourceMappingURL=permissions.js.map