const GROUPS = [
    {
        label: 'Gemini Flash/Pro',
        matches: (model) => model.group === 'gemini'
    },
    {
        label: 'Claude/ChatGPT',
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
        fiveHour: summarizeQuota(models.filter(group.matches), 'five-hour'),
        week: summarizeQuota(models.filter(group.matches), 'week')
    })).filter((group) => group.fiveHour.remainingPercent !== null || group.fiveHour.resetInText !== null || group.week.remainingPercent !== null || group.week.resetInText !== null);
}
function summarizeQuota(models, period) {
    const candidates = models
        .map((model) => ({
        remainingPercent: period === 'five-hour' ? model.remainingPercent : model.weeklyRemainingPercent,
        resetInText: period === 'five-hour' ? model.resetInText : model.weeklyResetInText,
        status: period === 'five-hour' ? model.status : model.weeklyStatus
    }))
        .filter((quota) => quota.remainingPercent !== null || quota.resetInText !== null);
    if (candidates.length === 0) {
        return {
            remainingPercent: null,
            resetInText: null,
            status: 'unknown'
        };
    }
    return candidates.reduce((best, quota) => {
        if (best.remainingPercent === null && quota.remainingPercent !== null)
            return quota;
        if (quota.remainingPercent === null && best.remainingPercent !== null)
            return best;
        if (best.remainingPercent === null && quota.remainingPercent === null) {
            if (best.resetInText === null && quota.resetInText !== null)
                return quota;
            return best;
        }
        return quota.remainingPercent < best.remainingPercent ? quota : best;
    });
}
//# sourceMappingURL=quotaGroups.js.map