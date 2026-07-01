# Changelog

## Unreleased

- Added internal Antigravity quota parser types for `quotaInfos[]` windows, including five-hour and weekly quota windows.
- Updated the monitor JSON parser to consume `quotaInfos[]` and `windows.weekly` shapes when available.
- Added weekly quota parser tests and monitor UI parser coverage.
- Added third-party notices for code derived from `skainguyen1412/antigravity-usage`.

Note: the runtime provider still uses the bundled `antigravity-usage` CLI until the auth/token/fetch layer is fully internalized.
