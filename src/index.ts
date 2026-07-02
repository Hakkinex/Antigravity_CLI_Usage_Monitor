#!/usr/bin/env node
import { runWatch } from './commands/watch.js';
import { runDebugDump } from './commands/debugDump.js';
import { setDebugMode } from './antigravity/core/logger.js';
import { loginCommand } from './antigravity/commands/login.js';
import { logoutCommand } from './antigravity/commands/logout.js';
import { statusCommand } from './antigravity/commands/status.js';
import { quotaCommand } from './antigravity/commands/quota.js';
import { doctorCommand } from './antigravity/commands/doctor.js';
import { accountsCommand } from './antigravity/commands/accounts.js';
import { wakeupCommand } from './antigravity/commands/wakeup.js';

void main();

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const globalOptions = extractGlobalOptions(argv);
  setDebugMode(globalOptions.debug);

  const command = globalOptions.args[0];
  const args = globalOptions.args.slice(1);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  switch (command) {
  case 'watch':
    runWatch(args);
    break;
  case 'debug-dump':
    await runDebugDump(args);
    break;
  case 'login':
    await loginCommand(parseLoginOptions(args));
    break;
  case 'logout':
    logoutCommand({ all: hasFlag(args, '--all') }, firstPositional(args));
    break;
  case 'status':
    statusCommand({ all: hasFlag(args, '--all'), account: readValue(args, '--account', '-a') });
    break;
  case 'quota':
    await quotaCommand({
      json: hasFlag(args, '--json'),
      method: (readValue(args, '--method', '-m') ?? 'auto') as 'auto' | 'local' | 'google',
      all: hasFlag(args, '--all'),
      account: readValue(args, '--account', '-a'),
      refresh: hasFlag(args, '--refresh'),
      allModels: hasFlag(args, '--all-models')
    });
    break;
  case 'accounts':
    await runAccounts(args);
    break;
  case 'doctor':
    doctorCommand();
    break;
  case 'wakeup':
    await runWakeup(args);
    break;
  default:
    console.error('Unknown command: ' + command);
    printHelp();
    process.exit(1);
  }
}

function extractGlobalOptions(input: string[]): { debug: boolean; args: string[] } {
  const args: string[] = [];
  let debug = false;

  for (const arg of input) {
    if (arg === '--debug') {
      debug = true;
      continue;
    }
    args.push(arg);
  }

  return { debug, args };
}

function hasFlag(args: string[], ...names: string[]): boolean {
  return names.some((name) => args.includes(name));
}

function readValue(args: string[], ...names: string[]): string | undefined {
  for (let index = 0; index < args.length; index += 1) {
    if (!names.includes(args[index])) continue;
    const value = args[index + 1];
    if (value && !value.startsWith('-')) return value;
  }
  return undefined;
}

function positionalArgs(args: string[]): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('-')) {
      values.push(arg);
      continue;
    }
    if (arg === '--account' || arg === '-a' || arg === '--method' || arg === '-m' || arg === '--port' || arg === '-p' || arg === '--email' || arg === '--model' || arg === '--prompt' || arg === '--limit' || arg === '--output') {
      index += 1;
    }
  }
  return values;
}

function firstPositional(args: string[]): string | undefined {
  return positionalArgs(args)[0];
}

function parseLoginOptions(args: string[]): { noBrowser?: boolean; port?: number; manual?: boolean } {
  const portRaw = readValue(args, '--port', '-p');
  const port = portRaw ? Number(portRaw) : undefined;
  return {
    noBrowser: hasFlag(args, '--no-browser'),
    manual: hasFlag(args, '--manual'),
    port: port && Number.isFinite(port) ? port : undefined
  };
}

async function runAccounts(args: string[]): Promise<void> {
  const subcommand = firstPositional(args) ?? 'list';
  const positionals = positionalArgs(args).slice(1);
  await accountsCommand(subcommand, positionals, {
    refresh: hasFlag(args, '--refresh'),
    force: hasFlag(args, '--force'),
    all: hasFlag(args, '--all')
  });
}

async function runWakeup(args: string[]): Promise<void> {
  const subcommand = (firstPositional(args) ?? 'status') as 'config' | 'trigger' | 'install' | 'uninstall' | 'test' | 'history' | 'status';
  await wakeupCommand(subcommand, positionalArgs(args).slice(1), {
    scheduled: hasFlag(args, '--scheduled'),
    limit: readValue(args, '--limit'),
    json: hasFlag(args, '--json'),
    email: readValue(args, '--email', '-e'),
    model: readValue(args, '--model', '-m'),
    prompt: readValue(args, '--prompt', '-p')
  });
}

function printHelp(): void {
  console.log(`agy-monitor

Usage:
  agy-monitor watch [options]
  agy-monitor quota [options]
  agy-monitor login [options]
  agy-monitor logout [email] [--all]
  agy-monitor status [options]
  agy-monitor accounts <subcommand> [options]
  agy-monitor doctor
  agy-monitor wakeup <subcommand> [options]
  agy-monitor debug-dump [options]

Global options:
  --debug            Enable provider debug logs

Watch options:
  --interval <sec>   Refresh interval, default 60
  --columns <n>      Preferred dashboard columns, default 2
  --method <name>    Data provider method, default google
  --mask-email       Mask account email in card titles
  --all-models       Include autocomplete models when provider supports it
  --refresh          Force refresh on startup and manual refresh
  --mock             Use bundled fixture instead of live Antigravity data

Quota options:
  --json             Output quota as JSON
  --method <name>    Data provider method: auto, local, google
  --all              Show quota for all accounts
  --account <email>  Show quota for a specific account
  --refresh          Force refresh instead of cache
  --all-models       Include autocomplete models

Login options:
  --no-browser       Print the OAuth URL instead of opening a browser
  --manual           Use the manual copy/paste OAuth flow
  --port <port>      Port for the OAuth callback server
  ANTIGRAVITY_OAUTH_CLIENT_ID / ANTIGRAVITY_OAUTH_CLIENT_SECRET override built-in credentials

Status options:
  --all              Show status for all accounts
  -a, --account      Show status for a specific account

Accounts subcommands:
  list [--refresh]
  add
  switch <email>
  remove <email> [--force]
  current
  refresh [email] [--all]

Wakeup subcommands:
  config
  trigger [--scheduled]
  install
  uninstall
  test [-e email] [-m model] [-p prompt]
  history [--limit <n>] [--json]
  status

Debug dump options:
  --method <name>    Data provider method, default google
  --account <email>  Dump one account instead of all accounts
  --no-all           Dump active account only
  --use-cache        Allow cached quota data; default forces refresh
  --no-cache         Alias of default refresh behavior for explicit debugging
  --all-models       Include autocomplete models
  --output <dir>     Output directory, default .agy-monitor-debug

Keyboard:
  r                  Refresh now
  q                  Quit
`);
}
