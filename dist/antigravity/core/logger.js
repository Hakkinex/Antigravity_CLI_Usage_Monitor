/**
 * Logger utility with debug mode support
 */
let debugMode = false;
export function setDebugMode(enabled) {
    debugMode = enabled;
}
export function isDebugMode() {
    return debugMode;
}
export function debug(category, message, data) {
    if (!debugMode)
        return;
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${category}]`;
    if (data !== undefined) {
        console.error(`${prefix} ${message}`, data);
    }
    else {
        console.error(`${prefix} ${message}`);
    }
}
export function info(message) {
    console.log(message);
}
export function warn(message) {
    console.warn(`⚠️  ${message}`);
}
export function error(message) {
    console.error(`❌ ${message}`);
}
export function success(message) {
    console.log(`✅ ${message}`);
}
//# sourceMappingURL=logger.js.map