const GROUPS = [
    {
        label: 'Gemini Flash/Pro',
        matches: (model) => model.group === 'gemini'
    },
    {
        label: 'Claude Opus/Sonnet/GPT',
        matches: (model) => model.group === 'claude' || model.group === 'gpt'
    },
    {
        label: 'Other Models',
        matches: (model) => model.group === 'other'
    }
];
export function buildQuotaGroups(models) {
    return GROUPS.map((group) => ({
        label: group.label,
        quota: summarizeQuota(models.filter(group.matches))
    })).filter((group) => group.quota.remainingPercent !== null);
}
function summarizeQuota(models) {
    const candidates = models
        .map((model) => ({
        remainingPercent: model.remainingPercent,
        resetInText: model.resetInText,
        status: model.status
    }))
        .filter((quota) => quota.remainingPercent !== null);
    if (candidates.length === 0) {
        return {
            remainingPercent: null,
            resetInText: null,
            status: 'unknown'
        };
    }
    return candidates.reduce((lowest, quota) => quota.remainingPercent !== null &&
        lowest.remainingPercent !== null &&
        quota.remainingPercent < lowest.remainingPercent
        ? quota
        : lowest);
}
//# sourceMappingURL=quotaGroups.js.map