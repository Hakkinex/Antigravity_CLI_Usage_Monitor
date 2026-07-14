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
    label: 'Claude/ChatGPT',
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
  })).filter((group) => group.quota.remainingPercent !== null || group.quota.resetInText !== null);
}

function summarizeQuota(models: ModelQuota[]): QuotaSummary {
  const candidates = models
    .map((model) => ({
      remainingPercent: model.remainingPercent,
      resetInText: model.resetInText,
      status: model.status
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
    if (best.remainingPercent === null && quota.remainingPercent !== null) return quota;
    if (quota.remainingPercent === null && best.remainingPercent !== null) return best;
    if (best.remainingPercent === null && quota.remainingPercent === null) {
      if (best.resetInText === null && quota.resetInText !== null) return quota;
      return best;
    }
    return quota.remainingPercent! < best.remainingPercent! ? quota : best;
  });
}
