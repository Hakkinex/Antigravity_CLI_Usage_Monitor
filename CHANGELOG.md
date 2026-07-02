# Changelog

## 1.1.0

- Replaced the monitor's separate `5h` and `Week` columns with a single `Quota` column that shows the most constrained real quota window and its true reset time.
- Simplified monitor normalization by removing weekly-only UI fields and selecting the best available quota window from `quotaInfos`, `windows`, and legacy shapes.
- Hardened cache reuse by storing provider `method` and `source`, preventing `google` and `local` snapshots from contaminating each other.
- Improved `debug-dump` analysis with `methodsSeen`, `sourcesSeen`, and an explicit `--no-cache` debugging path.
- Expanded regression coverage for parser normalization, cache validation, local parsing, connect response parsing, process detection, and grouped quota rendering.

## 1.0.0

- Internalized the Antigravity quota provider under `src/antigravity/` and removed the runtime dependency on the external `antigravity-usage` binary/package.
- Added `src/antigravity/api.ts` as the monitor-facing facade for multi-account quota reads, refresh behavior, cache fallback, and account restoration.
- Added Google weekly quota parsing for `quotaInfos[]` with normalized `windows.fiveHour` and `windows.weekly` output.
- Updated monitor JSON parsing, dashboard source labels, debug dump output, README files, and third-party notices for the internal provider model.
- Added parser tests covering weekly quota fixtures and compatible monitor input shapes.
