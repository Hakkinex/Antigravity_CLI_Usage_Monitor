# agy-monitor

`agy-monitor` is a read-only terminal dashboard for monitoring Antigravity CLI quota across multiple accounts.

It is intentionally a monitor, not an account scheduler. It does not switch accounts when one account is full, does not run wakeup commands, and does not trigger model requests. Version 0.1 wraps `antigravity-usage` for quota data and focuses on a stable two-column dashboard.

Each model row shows both short-window quota and weekly quota:

```text
Model                  5h             Week
Gemini 3 Pro (High)    ● 100% 4h25m   ● 92% 3d4h
```

## Install

Install the data provider first:

```bash
npm install -g antigravity-usage
```

Then install this project locally:

```bash
npm install
npm run build
npm link
```

## Usage

```bash
agy-monitor watch
```

Useful options:

```bash
agy-monitor watch --interval 60
agy-monitor watch --columns 2
agy-monitor watch --method google
agy-monitor watch --refresh
agy-monitor watch --mask-email
agy-monitor watch --all-models
agy-monitor watch --debug
```

For local UI testing without `antigravity-usage`:

```bash
npm run dev
```

or:

```bash
agy-monitor watch --mock
```

## Keyboard

- `r`: refresh now
- `q`: quit

## Data Source

The default wrapper command is:

```bash
antigravity-usage quota --all --json --method google
```

If the installed provider does not support the `quota` subcommand form, `agy-monitor` falls back to:

```bash
antigravity-usage --all --json --method google
```

`--refresh` is only passed on startup when requested, or during manual refresh.

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
    "account1@gmail.com": "Account 1",
    "account2@gmail.com": "Account 2"
  },
  "thresholds": {
    "green": 80,
    "yellow": 40,
    "orange": 15,
    "red": 1
  }
}
```

## Safety Boundary

`agy-monitor` only calls quota/read commands. It does not:

- log in to accounts
- switch accounts for workload routing
- call wakeup
- read or modify token files directly
- store tokens
- send account or quota data to any external service
