import type { ModelQuota, ModelStatus } from '../types.js';

export type RenderQuotaGroup = {
  label: string;
  quota: QuotaSummary;
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
    quota: summarizeQuota(models.filter(group.matches))
  })).filter((group) => group.quota.remainingPercent !== null);
}

function summarizeQuota(models: ModelQuota[]): QuotaSummary {
  const candidates = models
    .map((model) => ({
      remainingPercent: model.remainingPercent,
      resetInText: model.resetInText,
      status: model.status
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
