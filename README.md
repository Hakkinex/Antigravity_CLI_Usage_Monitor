# Antigravity CLI Usage Monitor

[繁體中文](README_CN.md)

A read-only terminal dashboard for monitoring Antigravity CLI quota across multiple accounts. `agy-monitor` now uses an internal Antigravity data provider derived from `skainguyen1412/antigravity-usage`, so installing the monitor is enough for quota fetching and rendering.

As of `v1.1.0`, `agy-monitor` renders a single truthful `Quota` view based on the real upstream window, shows actual remaining usage plus reset time, isolates `google` and `local` cache paths to avoid contamination, and includes stronger debugging and regression coverage.

The monitor is not an account scheduler. It does not switch accounts for workload routing, run wakeup commands, or trigger model requests.

## Security

`agy-monitor` only performs quota/read operations through its internal provider.

It does not:

- route workloads between accounts
- call wakeup
- store tokens outside the Antigravity-compatible config/cache paths
- send account or quota data to an external service

Do not commit real account tokens, private keys, `.env` files, or raw debug output that contains private account data.

## Upstream Reference

This project references and derives part of its Antigravity data layer from [skainguyen1412/antigravity-usage](https://github.com/skainguyen1412/antigravity-usage). That project provided the original account/token access patterns, Google/local quota request flow, cache behavior, and response parsing shape.

`agy-monitor` internalizes that provider code under `src/antigravity/` and adapts it for monitor usage:

- exposes a local facade in `src/antigravity/api.ts` instead of spawning an external CLI
- normalizes Google `quotaInfos[]` into `windows.fiveHour` and `windows.weekly`
- keeps multi-account quota reads inside the monitor process
- imports legacy `antigravity-usage` config once into the `agy-monitor` config namespace when needed
- removes the npm dependency and binary lookup for `antigravity-usage`

Source attribution and MIT license text are tracked in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Features

- Terminal card dashboard with a single truthful `Quota` column per model group.
- Multi-account quota monitoring.
- Full account email shown by default, with optional masking.
- Remaining percentage, real reset time, and color status dot.
- Automatic refresh and manual refresh with `r`.
- Stable repaint behavior similar to `docker stats`.
- Mock fixture mode for local UI testing.
- `debug-dump` for inspecting normalized provider output.
- Configurable aliases, thresholds, refresh interval, method, and column count.

Example row:

```text
Model                  Quota
Gemini Flash/Pro       * 92% 3d4h
```

## Install

This project uses npm and `package-lock.json` is the canonical lockfile.

```bash
npm install
npm run build
npm link
```

No separate `antigravity-usage` install is required.

## Usage

## Login Setup

Configure a Google OAuth installed-application credential before using login or refreshing an expired access token:

```bash
export ANTIGRAVITY_OAUTH_CLIENT_ID=your-client-id
export ANTIGRAVITY_OAUTH_CLIENT_SECRET=your-client-secret
```

Do not commit these values to the repository or store them in shell history. Rotate any credential that has previously been published.

Refresh tokens are bound to the OAuth client that issued them. After rotating credentials, sign in again so each account receives a refresh token for the new client.

Then run:

```bash
agy-monitor login
```


Start the monitor:

```bash
agy-monitor watch
```

Run with mock data:

```bash
agy-monitor watch --mock
```

Options:

| Option | Default | Description |
| --- | --- | --- |
| `--interval <sec>` | `60` | Data refresh interval. |
| `--columns <n>` | `2` | Preferred account card columns. |
| `--method <name>` | `google` | Provider method: `google`, `local`, or `auto`. |
| `--refresh` | `false` | Force refresh on startup. |
| `--mask-email` | `false` | Mask account email in card titles. |
| `--all-models` | `false` | Include autocomplete models when supported. |
| `--debug` | `false` | Show provider details. |
| `--mock` | `false` | Use bundled fixture data. |

Keyboard:

| Key | Description |
| --- | --- |
| `r` | Refresh now. |
| `q` | Quit. |

## Debug Dump

Inspect normalized internal provider output:

```bash
agy-monitor debug-dump --method google
```

This writes local debug files to `.agy-monitor-debug/`:

- `antigravity-provider-stdout-*.json`
- `antigravity-provider-stderr-*.log`
- `analysis-*.json`

Do not commit `.agy-monitor-debug/` because it can contain account emails or raw quota data.

## Data Source

Runtime quota fetching is internal. `agy-monitor` calls `src/antigravity/api.ts`, which uses the internal Google/local provider implementation and cache helpers derived from the upstream project.

The monitor parser accepts both the internal provider shape and compatible historical JSON shapes, including:

- `quotaInfos[]`
- `windows.fiveHour`
- `windows.weekly`
- `weeklyRemainingPercentage`, `weeklyResetTime`, and `weeklyTimeUntilResetMs`

The monitor UI now renders a single `Quota` column per model group. When upstream only exposes one real quota window, `agy-monitor` shows that window's actual remaining percentage and reset time directly instead of implying separate `5h` and `Week` limits.

Debugging tips:

- `agy-monitor debug-dump --method google --no-cache`
- Check `analysis-*.json` for `usedCache`, `methodsSeen`, and `sourcesSeen`
- Cache reuse is provider-aware, so `google` cache will not be reused for `local`, and vice versa

Config is stored under `agy-monitor`. If a legacy `antigravity-usage` config exists and `agy-monitor` config does not, the provider imports it once for compatibility.

## Environment Variables

Google OAuth login works out of the box with built-in credentials. Use environment variables only if you need to override them.

| Variable | Description |
| --- | --- |
| `ANTIGRAVITY_OAUTH_CLIENT_ID` | Optional override for the built-in Google OAuth client id. |
| `ANTIGRAVITY_OAUTH_CLIENT_SECRET` | Optional override for the built-in Google OAuth client secret. |

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

## Development

```bash
npm test
npm run typecheck
npm run build
```

Keep provider code inside `src/antigravity/` and monitor normalization/rendering inside `src/parser/` and `src/render/`. Do not add account switching, wakeup, or quota-consuming behavior.

## License

MIT
