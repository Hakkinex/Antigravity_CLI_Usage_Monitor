function classifyWindow(qi) {
    const id = String(qi.windowId ?? '').toLowerCase();
    const label = String(qi.windowLabel ?? '').toLowerCase();
    if (id.includes('week') || label.includes('week'))
        return 'weekly';
    if (id.includes('five') ||
        id.includes('5h') ||
        id === '5hour' ||
        label.includes('five hour') ||
        label.includes('5 hour') ||
        label.includes('5-hour')) {
        return 'fiveHour';
    }
    return id || label || 'unknown';
}
function toPercent(fraction) {
    if (typeof fraction !== 'number' || !Number.isFinite(fraction))
        return undefined;
    const clamped = Math.max(0, Math.min(1, fraction));
    return Math.round(clamped * 10000) / 100;
}
function toWindow(qi, kind, now) {
    const remainingPercentage = toPercent(qi.remainingFraction);
    const resetMs = qi.resetTime ? Date.parse(qi.resetTime) : NaN;
    const timeUntilResetMs = Number.isFinite(resetMs) ? Math.max(0, resetMs - now) : undefined;
    const isExhausted = typeof qi.isExhausted === 'boolean'
        ? qi.isExhausted
        : remainingPercentage !== undefined && remainingPercentage === 0;
    return {
        id: kind,
        label: qi.windowLabel,
        remainingPercentage,
        isExhausted,
        resetTime: qi.resetTime,
        timeUntilResetMs
    };
}
function iterateModels(models) {
    if (!models)
        return [];
    if (Array.isArray(models)) {
        return models.map((model, index) => [model.name ?? String(index), model]);
    }
    return Object.entries(models);
}
export function parseModelInfo(name, raw, now = Date.now()) {
    const infos = Array.isArray(raw.quotaInfos)
        ? raw.quotaInfos
        : raw.quotaInfo
            ? [raw.quotaInfo]
            : [];
    const windows = {};
    for (const quotaInfo of infos) {
        const kind = classifyWindow(quotaInfo);
        windows[kind] = toWindow(quotaInfo, kind, now);
    }
    const legacy = windows.fiveHour ?? Object.values(windows).find(Boolean);
    return {
        name,
        displayName: raw.displayName,
        label: raw.displayName || name,
        modelId: name,
        remainingPercentage: legacy?.remainingPercentage,
        isExhausted: legacy?.isExhausted ?? false,
        resetTime: legacy?.resetTime,
        timeUntilResetMs: legacy?.timeUntilResetMs,
        windows
    };
}
export function parseGoogleModels(raw, ctx) {
    const now = ctx.now ?? Date.now();
    const models = iterateModels(raw.models).map(([name, model]) => parseModelInfo(model.name ?? name, model, now));
    let earliest;
    let earliestIso;
    for (const model of models) {
        for (const window of Object.values(model.windows ?? {})) {
            if (!window?.resetTime)
                continue;
            const timestamp = Date.parse(window.resetTime);
            if (!Number.isFinite(timestamp))
                continue;
            if (earliest === undefined || timestamp < earliest) {
                earliest = timestamp;
                earliestIso = window.resetTime;
            }
        }
    }
    return {
        schemaVersion: 2,
        email: ctx.email,
        source: 'google',
        method: 'google',
        timestamp: now,
        models,
        quotaResetTime: earliestIso ?? null,
        raw
    };
}
function parsePromptCredits(response) {
    const monthly = response.planInfo?.monthlyPromptCredits;
    const available = response.availablePromptCredits;
    if (monthly === undefined || available === undefined)
        return undefined;
    const used = monthly - available;
    return {
        available,
        monthly,
        usedPercentage: monthly > 0 ? used / monthly : 0,
        remainingPercentage: monthly > 0 ? available / monthly : 0
    };
}
export function parseQuotaSnapshot(codeAssistResponse, modelsResponse, email) {
    const snapshot = parseGoogleModels(modelsResponse, { email: email ?? '', now: Date.now() });
    return {
        ...snapshot,
        timestamp: new Date(snapshot.timestamp).toISOString(),
        method: 'google',
        email,
        planType: codeAssistResponse.planInfo?.planType,
        promptCredits: parsePromptCredits(codeAssistResponse),
        raw: {
            codeAssistResponse,
            modelsResponse
        }
    };
}
//# sourceMappingURL=parser.js.map