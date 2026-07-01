# Antigravity CLI Usage Monitor

[繁體中文](README_CN.md)

A read-only terminal dashboard for monitoring Antigravity CLI quota across multiple accounts. It wraps `antigravity-usage` and presents short-window and weekly quota in a stable two-column terminal view.

The monitor is intentionally not an account scheduler. It does not switch accounts when one account is full, does not run wakeup commands, and does not trigger model requests.

## Table of Contents

- [Security](#security)
- [Upstream Data Provider](#upstream-data-provider)
- [Background](#background)
- [What This Project Adds](#what-this-project-adds)
- [Features](#features)
- [Install](#install)
- [Usage](#usage)
- [Data Source](#data-source)
- [Internalization Status](#internalization-status)
- [Third-Party Notices](#third-party-notices)
- [Config](#config)
- [Contributing](#contributing)
- [License](#license)

## Security

`agy-monitor` only calls quota/read commands through `antigravity-usage`.

It does not:

- log in to accounts
- switch accounts for workload routing
- call wakeup
- read or modify token files directly
- store tokens
- send account or quota data to any external service

Do not commit real account tokens, private keys, `.env` files, or raw quota output that contains private account data.

## Upstream Data Provider

This project builds on the quota data produced by [skainguyen1412/antigravity-usage](https://github.com/skainguyen1412/antigravity-usage). `antigravity-usage` handles the Antigravity quota lookup, including local IDE access, Google account access, multi-account quota reads, JSON output, caching, and provider-specific request details.

`agy-monitor` currently does not reimplement account login, token handling, wakeup behavior, or Antigravity API access. It consumes the structured JSON returned by `antigravity-usage` and focuses on presenting that result as a readable monitoring dashboard.

This repo has started internalizing the Antigravity parser/type boundary. Source attribution and license details are tracked in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Background

Antigravity CLI users often work with multiple accounts and need a quick way to see quota status without manually checking each account. `agy-monitor` focuses on one job: show all account quota states clearly in the terminal.

Version 0.1 uses `antigravity-usage` as the data provider and renders a lightweight ANSI dashboard instead of a heavy TUI framework.

## What This Project Adds

- Bundles `antigravity-usage` as an npm dependency so a separate global provider install is not required.
- Resolves the local `node_modules/.bin/antigravity-usage` binary first, with a `PATH` fallback for existing global installs.
- Calls read-only quota commands and keeps account login, token management, and wakeup behavior outside the monitor.
- Normalizes the provider JSON into account cards, quota groups, status colors, reset timers, and stable terminal output.
- Supports Google `quotaInfos[]` / `windows.weekly` parsing so the Week column can render when the data source provides a weekly window.
- Adds mock fixture mode so the dashboard layout can be tested without real account data.
- Adds `debug-dump` to inspect raw provider JSON and candidate quota fields when upstream output changes.

## Features

- Two-column terminal card dashboard.
- Multi-account quota monitoring.
- Full account email shown by default.
- Optional email masking.
- Short-window quota and weekly quota on the same row.
- Remaining percentage, reset time, and color status dot.
- Automatic refresh interval.
- Manual refresh with `r`.
- Quit with `q`.
- Stable repaint behavior similar to `docker stats`.
- Mock fixture mode for local UI testing.
- Configurable aliases, thresholds, refresh interval, method, and column count.

Example row:

```text
Model                  5h             Week
Gemini 3 Pro (High)    ● 100% 4h25m   ● 92% 3d4h
```

## Install

This project uses npm. `package-lock.json` is the canonical lockfile.

`antigravity-usage` is installed as a project dependency. No separate global install is required for the data provider.

Install this project locally:

```bash
npm install
npm run build
npm link
```

## Usage

Start the monitor:

```bash
agy-monitor watch
```

Run with mock data:

```bash
npm run dev
```

or:

```bash
agy-monitor watch --mock
```

### Options

| Option | Default | Description |
| --- | --- | --- |
| `--interval <sec>` | `60` | Data refresh interval. |
| `--columns <n>` | `2` | Preferred account card columns. |
| `--method <name>` | `google` | Method passed to `antigravity-usage`. |
| `--refresh` | `false` | Force refresh on startup. |
| `--mask-email` | `false` | Mask account email in card titles. |
| `--all-models` | `false` | Pass `--all-models` to `antigravity-usage`. |
| `--debug` | `false` | Show provider command details. |
| `--mock` | `false` | Use bundled fixture data. |

### Keyboard

| Key | Description |
| --- | --- |
| `r` | Refresh now. |
| `q` | Quit. |

### Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Run the monitor with bundled mock data. |
| `npm run build` | Compile TypeScript to `dist/`. |
| `npm start` | Run the compiled monitor. |
| `npm test` | Run Vitest tests. |
| `npm run typecheck` | Run TypeScript without emitting files. |

### Debug Dump

To inspect the raw `antigravity-usage` response used by the monitor:

```bash
agy-monitor debug-dump --method google
```

This writes local debug files to `.agy-monitor-debug/`:

- `antigravity-usage-stdout-*.json`
- `antigravity-usage-stderr-*.log`
- `analysis-*.json`

The analysis file scans stdout JSON and debug stderr blocks for candidate quota paths such as `weekly`, `week`, `quota`, `reset`, `remaining`, `period`, and `window`.

Debug dump forces a fresh upstream request by default. Use `--use-cache` only when you intentionally want to inspect cached snapshots.

Do not commit `.agy-monitor-debug/`; it can contain account emails or raw quota data.

## Data Source

The default wrapper command uses the locally installed provider binary when available:

```bash
node_modules/.bin/antigravity-usage quota --all --json --method google
```

If the local dependency is unavailable, `agy-monitor` falls back to `antigravity-usage` from `PATH`. If the provider does not support the `quota` subcommand form, `agy-monitor` falls back to:

```bash
node_modules/.bin/antigravity-usage --all --json --method google
```

`--refresh` is passed only on startup when requested, or during manual refresh.

The Week column can read `weeklyRemainingPercentage`, `weeklyResetTime`, `weeklyTimeUntilResetMs`, Google `quotaInfos[]`, or the internal parser output shape `windows.weekly`. Runtime fetching still uses the bundled `antigravity-usage` CLI; until the auth/token/fetch layer is fully internalized, the Week column will still show `no data` when that CLI JSON does not include a weekly window.

## Internalization Status

Completed:

- `src/antigravity/quota/types.ts`: adds `QuotaWindow` and `windows.fiveHour` / `windows.weekly` types.
- `src/antigravity/google/parser.ts`: parses Google `quotaInfos[]` and classifies five-hour vs weekly windows by `windowId` / `windowLabel`.
- `src/parser/parseAntigravityUsageJson.ts`: lets the current monitor parser consume `quotaInfos[]` and `windows.weekly`.
- `test/antigravity/google-parser.test.ts` and `test/parser.test.ts`: add weekly fixture coverage.

Not completed yet:

- Auth/token management and Google/local fetch are not fully internalized.
- The runtime provider still calls the bundled `antigravity-usage` CLI.
- `package.json` still keeps the `antigravity-usage` dependency until the fetch layer is internalized.

## Third-Party Notices

Parts of the parser/type design under `src/antigravity/` are derived from `skainguyen1412/antigravity-usage` and modified for `agy-monitor` weekly quota window normalization. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the upstream commit and MIT license text.

## Config

Config file locations:

- Windows: `%APPDATA%\agy-monitor\config.json`
- macOS/Linux: `~/.config/agy-monitor/config.json`

Example:

```json
{
  "refreshIntervalSec": 60,
  "columns": 2,
  "method": "google",
  "maskEmail": false,
  "allModels": false,
  "accountAliases": {
    "account1@example.com": "Main",
    "account2@example.com": "Backup"
  },
  "thresholds": {
    "green": 80,
    "yellow": 40,
    "orange": 15,
    "red": 1
  }
}
```

## Contributing

Keep changes focused and preserve the read-only monitoring boundary.

- Keep provider code inside `src/providers/`.
- Keep JSON normalization inside `src/parser/`.
- Keep terminal rendering inside `src/render/`.
- Do not add account switching, wakeup, or quota-consuming behavior.
- Add or update tests when changing parser, layout, or refresh behavior.
- Run `npm test` and `npm run build` before shipping changes.

## License

MIT
