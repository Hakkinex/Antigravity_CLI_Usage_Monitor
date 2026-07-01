import type { ModelQuota, ModelStatus } from '../types.js';

export type RenderQuotaGroup = {
  label: string;
  fiveHour: QuotaSummary;
  week: QuotaSummary;
};

export type QuotaSummary = {
  remainingPercent: number | null;
  resetInText: string | null;
  status: ModelStatus;
};

type GroupDefinition = {
  label: string;
  matches: (model: ModelQuota) => boolean;
};

const GROUPS: GroupDefinition[] = [
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

export function buildQuotaGroups(models: ModelQuota[]): RenderQuotaGroup[] {
  return GROUPS.map((group) => ({
    label: group.label,
    fiveHour: summarizeQuota(models.filter(group.matches), 'five-hour'),
    week: summarizeQuota(models.filter(group.matches), 'week')
  })).filter((group) => group.fiveHour.remainingPercent !== null || group.week.remainingPercent !== null);
}

function summarizeQuota(models: ModelQuota[], period: 'five-hour' | 'week'): QuotaSummary {
  const candidates = models
    .map((model) => ({
      remainingPercent: period === 'five-hour' ? model.remainingPercent : model.weeklyRemainingPercent,
      resetInText: period === 'five-hour' ? model.resetInText : model.weeklyResetInText,
      status: period === 'five-hour' ? model.status : model.weeklyStatus
    }))
    .filter((quota): quota is QuotaSummary => quota.remainingPercent !== null);

  if (candidates.length === 0) {
    return {
      remainingPercent: null,
      resetInText: null,
      status: 'unknown'
    };
  }

  return candidates.reduce((lowest, quota) =>
    quota.remainingPercent !== null &&
    lowest.remainingPercent !== null &&
    quota.remainingPercent < lowest.remainingPercent
      ? quota
      : lowest
  );
}
