# Antigravity CLI Usage Monitor

[繁體中文](README_CN.md)

A read-only terminal dashboard for monitoring Antigravity CLI quota across multiple accounts. It wraps `antigravity-usage` and presents short-window and weekly quota in a stable two-column terminal view.

The monitor is intentionally not an account scheduler. It does not switch accounts when one account is full, does not run wakeup commands, and does not trigger model requests.

## Table of Contents

- [Security](#security)
- [Background](#background)
- [Features](#features)
- [Install](#install)
- [Usage](#usage)
- [Data Source](#data-source)
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

## Background

Antigravity CLI users often work with multiple accounts and need a quick way to see quota status without manually checking each account. `agy-monitor` focuses on one job: show all account quota states clearly in the terminal.

Version 0.1 uses `antigravity-usage` as the data provider and renders a lightweight ANSI dashboard instead of a heavy TUI framework.

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

Install the data provider first:

```bash
npm install -g antigravity-usage
```

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

The default wrapper command is:

```bash
antigravity-usage quota --all --json --method google
```

If the installed provider does not support the `quota` subcommand form, `agy-monitor` falls back to:

```bash
antigravity-usage --all --json --method google
```

`--refresh` is passed only on startup when requested, or during manual refresh.

Weekly quota requires `antigravity-usage --json` to expose weekly fields such as `weeklyRemainingPercentage`, `weeklyResetTime`, or `weeklyTimeUntilResetMs`. See [docs/antigravity-usage-weekly-json.md](docs/antigravity-usage-weekly-json.md) for the clean upstream patch plan.

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
    "account1@gmail.com": "Main",
    "account2@gmail.com": "Backup"
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
