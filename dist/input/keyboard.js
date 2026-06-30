export function setupKeyboard(handlers) {
    if (!process.stdin.isTTY)
        return () => undefined;
    const onData = (chunk) => {
        const key = chunk.toString('utf8').toLowerCase();
        if (key === 'q' || key === '\u0003')
            handlers.onQuit();
        if (key === 'r')
            handlers.onRefresh();
    };
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onData);
    return () => {
        process.stdin.off('data', onData);
        if (process.stdin.isTTY)
            process.stdin.setRawMode(false);
        process.stdin.pause();
    };
}
//# sourceMappingURL=keyboard.js.map