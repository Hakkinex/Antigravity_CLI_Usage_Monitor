# Changelog

## 1.0.0

- Internalized the Antigravity quota provider under `src/antigravity/` and removed the runtime dependency on the external `antigravity-usage` binary/package.
- Added `src/antigravity/api.ts` as the monitor-facing facade for multi-account quota reads, refresh behavior, cache fallback, and account restoration.
- Added Google weekly quota parsing for `quotaInfos[]` with normalized `windows.fiveHour` and `windows.weekly` output.
- Updated monitor JSON parsing, dashboard source labels, debug dump output, README files, and third-party notices for the internal provider model.
- Added parser tests covering weekly quota fixtures and compatible monitor input shapes.
