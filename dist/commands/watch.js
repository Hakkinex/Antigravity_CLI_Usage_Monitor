import { loadConfig } from '../config/loadConfig.js';
import { PollingEngine } from '../monitor/PollingEngine.js';
import { setupKeyboard } from '../input/keyboard.js';
export function runWatch(argv) {
    const config = loadConfig();
    const options = parseWatchOptions(argv, config);
    const engine = new PollingEngine(options, {
        ...config,
        refreshIntervalSec: options.interval,
        columns: options.columns,
        method: options.method,
        showEmail: options.showEmail,
        maskEmail: options.maskEmail,
        allModels: options.allModels
    });
    const cleanupKeyboard = setupKeyboard({
        onRefresh: () => engine.manualRefresh(),
        onQuit: () => {
            cleanupKeyboard();
            engine.stop();
            process.exit(0);
        }
    });
    process.on('SIGINT', () => {
        cleanupKeyboard();
        engine.stop();
        process.exit(0);
    });
    engine.start();
}
function parseWatchOptions(argv, config) {
    const readValue = (name) => {
        const index = argv.indexOf(name);
        return index >= 0 ? argv[index + 1] : undefined;
    };
    const has = (name) => argv.includes(name);
    const interval = Number(readValue('--interval') ?? config.refreshIntervalSec);
    const columns = Number(readValue('--columns') ?? config.columns);
    const showEmail = has('--show-email');
    return {
        interval: Number.isFinite(interval) && interval > 0 ? interval : config.refreshIntervalSec,
        columns: Number.isFinite(columns) && columns > 0 ? columns : config.columns,
        method: readValue('--method') ?? config.method,
        showEmail,
        maskEmail: has('--mask-email') ? true : showEmail ? false : config.maskEmail,
        allModels: has('--all-models') || config.allModels,
        refresh: has('--refresh'),
        debug: has('--debug'),
        mock: has('--mock')
    };
}
//# sourceMappingURL=watch.js.map