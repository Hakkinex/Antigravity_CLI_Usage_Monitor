#!/usr/bin/env node
import { runWatch } from './commands/watch.js';
const [, , command, ...args] = process.argv;
if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
}
if (command === 'watch') {
    runWatch(args);
}
else {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
}
function printHelp() {
    console.log(`agy-monitor

Usage:
  agy-monitor watch [options]

Options:
  --interval <sec>   Refresh interval, default 60
  --columns <n>      Preferred dashboard columns, default 2
  --method <name>    antigravity-usage method, default google
  --mask-email       Mask account email in card titles
  --all-models       Pass --all-models to antigravity-usage
  --refresh          Force refresh on startup and manual refresh
  --debug            Show wrapper command details
  --mock             Use bundled fixture instead of antigravity-usage

Keyboard:
  r                  Refresh now
  q                  Quit
`);
}
//# sourceMappingURL=index.js.map