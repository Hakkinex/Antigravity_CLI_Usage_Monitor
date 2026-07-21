# Changelog

## 1.3.0

- Restored the public built-in Desktop OAuth client intentionally provided by the upstream `antigravity-usage` project, while preserving paired environment-variable overrides.
- Changed `watch` to request fresh upstream quota on startup and every scheduled refresh instead of reusing the five-minute cache between polls.
- Added provider-aware stale-cache fallback warnings with the original refresh error and cache age.
- Added the authoritative `retrieveUserQuotaSummary` Cloud Code endpoint with graceful fallback to the legacy per-model endpoint.
- Added real Gemini and third-party shared-pool quota buckets for both rolling 5-hour and weekly windows.
- Restored the dashboard's `5h` and `Weekly` columns with complete reset countdowns, including day-based formatting for durations over 24 hours.
- Added regression coverage for scheduled fresh polling, OAuth fallback/override behavior, and stale-cache diagnostics.

## 1.2.0

- Removed embedded Google OAuth credentials and now require `ANTIGRAVITY_OAUTH_CLIENT_ID` and `ANTIGRAVITY_OAUTH_CLIENT_SECRET` for login and token refresh.
- Hardened OAuth state generation, callback HTML escaping, request timeouts, error handling, and sensitive debug logging.
- Restricted local Connect RPC access to loopback addresses and redacted Antigravity CSRF tokens from stored and logged process command lines.
- Replaced shell-interpolated PID commands with validated `execFile` calls and added command output limits.
- Enforced private `0700` directory and `0600` file permissions for account tokens, caches, configuration, metadata, and wake-up history.
- Added path traversal and recursive deletion guards for account storage.
- Added security regression tests, expanded loopback coverage, and verified zero npm dependency vulnerabilities.
- Rewrote repository history to remove the previously published OAuth credential from active branches and tags. The old credential must still be revoked or rotated by its owner.

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
