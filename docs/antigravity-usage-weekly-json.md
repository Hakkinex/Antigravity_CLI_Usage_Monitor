# antigravity-usage weekly JSON patch plan

`agy-monitor` should consume structured quota data only. The clean upstream path is to make `antigravity-usage --json` expose weekly quota fields instead of making `agy-monitor` scrape terminal text.

## Target JSON shape

Add these optional fields to each model in `QuotaSnapshot.models`:

```json
{
  "label": "Claude Opus 4.6 (Thinking)",
  "modelId": "claude-opus-4-6-thinking",
  "remainingPercentage": 0.2598664,
  "resetTime": "2026-06-30T15:54:56Z",
  "timeUntilResetMs": 40302753,
  "weeklyRemainingPercentage": 0.72,
  "weeklyResetTime": "2026-07-05T00:00:00Z",
  "weeklyTimeUntilResetMs": 392000000
}
```

## Files to update in antigravity-usage

### `src/quota/types.ts`

Extend `ModelQuotaInfo`:

```ts
export interface ModelQuotaInfo {
  label: string
  modelId: string
  remainingPercentage?: number
  isExhausted: boolean
  resetTime?: string
  timeUntilResetMs?: number
  weeklyRemainingPercentage?: number
  weeklyResetTime?: string
  weeklyTimeUntilResetMs?: number
  isAutocompleteOnly?: boolean
}
```

### `src/google/cloudcode.ts`

Extend the raw `ModelInfo` type after the actual weekly fields are found in the raw Cloud Code response. Preferred normalized candidates:

```ts
quotaInfo?: {
  remainingFraction?: number
  resetTime?: string
  isExhausted?: boolean
  weeklyRemainingFraction?: number
  weeklyResetTime?: string
}
```

If weekly quota is not inside `quotaInfo`, add a separate raw type that mirrors the real response instead of flattening by guesswork.

### `src/google/parser.ts`

Map raw weekly fields into `ModelQuotaInfo`:

```ts
function parseModelInfo(modelId: string, model: ModelInfo): ModelQuotaInfo {
  const quotaInfo = model.quotaInfo

  return {
    label: model.displayName || model.label || modelId,
    modelId,
    remainingPercentage: quotaInfo?.remainingFraction,
    isExhausted: quotaInfo?.isExhausted ?? (quotaInfo?.remainingFraction === 0),
    resetTime: quotaInfo?.resetTime,
    timeUntilResetMs: parseResetTime(quotaInfo?.resetTime),
    weeklyRemainingPercentage: quotaInfo?.weeklyRemainingFraction,
    weeklyResetTime: quotaInfo?.weeklyResetTime,
    weeklyTimeUntilResetMs: parseResetTime(quotaInfo?.weeklyResetTime),
    isAutocompleteOnly: modelId.includes('gemini-2.5') || (model.displayName || '').includes('Gemini 2.5')
  }
}
```

### `src/local/connect-client.ts` and `src/local/local-parser.ts`

If the local Antigravity Connect API exposes weekly quota, pass the same normalized fields through:

```ts
weeklyRemainingPercentage?: number
weeklyResetTime?: string
weeklyTimeUntilResetMs?: number
```

### `src/quota/format.ts`

Keep terminal output backward compatible, but add a weekly column only when any visible model has weekly data.

Suggested table headers:

```ts
['Model', '5h Remaining', '5h Reset', 'Week Remaining', 'Week Reset']
```

For `--json`, no special work is needed once the fields are on `ModelQuotaInfo`, because `printQuotaJson` serializes the snapshot directly.

## Discovery step

Run `antigravity-usage` in debug mode and inspect the raw `Models response received` payload:

```bash
antigravity-usage quota --json --method google --debug
```

When debugging through `agy-monitor`, use:

```bash
agy-monitor debug-dump --method google
```

`debug-dump` forces refresh by default so the result is not limited to cached snapshots.

If weekly fields are not present in `/v1internal:fetchAvailableModels`, inspect Antigravity's local Connect API response or the endpoint used by the native Antigravity CLI UI. Do not add guessed weekly fields until the raw response field names are known.
