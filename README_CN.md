# Antigravity CLI Usage Monitor

[English](README.md)

一個只讀的終端機 dashboard，用來同時監控多個 Antigravity CLI 帳號的 quota 狀態。`agy-monitor` 現在使用內建 Antigravity 資料 provider，該資料層衍生自 `skainguyen1412/antigravity-usage`，安裝 monitor 後就能查詢與呈現 quota。

這個工具只做監控，不做帳號調度。它不會在某個帳號滿額後自動切換帳號，不會執行 wakeup，也不會觸發任何模型請求。

## 安全性

`agy-monitor` 只會透過內建 provider 執行 quota/read 類型操作。

它不會：

- 為工作調度切換帳號
- 呼叫 wakeup
- 在 Antigravity 相容設定與 cache 路徑之外儲存 token
- 把帳號或 quota 資料傳送到外部服務

請勿提交真實帳號 token、private key、`.env` 檔案，或包含私人帳號資料的 debug 原始輸出。

## 參考上游

本專案參考並衍生部分資料層自 [skainguyen1412/antigravity-usage](https://github.com/skainguyen1412/antigravity-usage)。該專案提供原始的帳號/token 存取模式、Google/local quota request 流程、cache 行為與 response parser 結構。

`agy-monitor` 已將 provider 程式碼內化到 `src/antigravity/`，並針對監控用途做調整：

- 透過 `src/antigravity/api.ts` 提供本機 facade，不再 spawn 外部 CLI
- 將 Google `quotaInfos[]` 正規化成 `windows.fiveHour` 與 `windows.weekly`
- 在 monitor process 內完成多帳號 quota 讀取
- 需要時把舊 `antigravity-usage` config 一次性匯入到 `agy-monitor` config namespace
- 移除 `antigravity-usage` npm dependency 與 binary lookup

來源註記與 MIT license 文字請見 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 功能

- 2 欄終端機卡片 dashboard。
- 多帳號 quota 監控。
- 預設顯示完整 email，可選擇遮罩。
- 同一列顯示五小時 quota 與週 quota。
- 顯示剩餘百分比、reset time 與彩色狀態點。
- 自動刷新，按 `r` 手動刷新。
- 類似 `docker stats` 的穩定重繪。
- mock fixture 模式，方便本機測試畫面。
- `debug-dump` 可檢查正規化後的 provider output。
- 可設定 alias、門檻、刷新間隔、method 與欄數。

畫面列範例：

```text
Model                  5h             Week
Gemini 3 Pro (High)    * 100% 4h25m   * 92% 3d4h
```

## 安裝

本專案使用 npm，`package-lock.json` 是標準 lockfile。

```bash
npm install
npm run build
npm link
```

不需要另外安裝 `antigravity-usage`。

## 使用方式

## Login Setup

Google OAuth login 預設不需要額外設定。如果你要覆蓋內建 credential，可以先設定：

```bash
export ANTIGRAVITY_OAUTH_CLIENT_ID=your-client-id
export ANTIGRAVITY_OAUTH_CLIENT_SECRET=your-client-secret
```

接著執行：

```bash
agy-monitor login
```


啟動監控：

```bash
agy-monitor watch
```

使用 mock 資料測試畫面：

```bash
agy-monitor watch --mock
```

參數：

| 參數 | 預設 | 說明 |
| --- | --- | --- |
| `--interval <sec>` | `60` | 資料刷新間隔。 |
| `--columns <n>` | `2` | 帳號卡片偏好的欄數。 |
| `--method <name>` | `google` | Provider method：`google`、`local` 或 `auto`。 |
| `--refresh` | `false` | 啟動時強制刷新。 |
| `--mask-email` | `false` | 遮罩卡片標題中的帳號 email。 |
| `--all-models` | `false` | Provider 支援時納入 autocomplete models。 |
| `--debug` | `false` | 顯示 provider 細節。 |
| `--mock` | `false` | 使用內建 fixture 資料。 |

快捷鍵：

| 按鍵 | 說明 |
| --- | --- |
| `r` | 立即刷新。 |
| `q` | 離開。 |

## Debug Dump

檢查內建 provider 正規化輸出：

```bash
agy-monitor debug-dump --method google
```

這會把 debug 檔案寫到 `.agy-monitor-debug/`：

- `antigravity-provider-stdout-*.json`
- `antigravity-provider-stderr-*.log`
- `analysis-*.json`

請勿提交 `.agy-monitor-debug/`，裡面可能包含帳號 email 或原始 quota 資料。

## 資料來源

Runtime quota fetching 已內化。`agy-monitor` 會呼叫 `src/antigravity/api.ts`，再使用內建 Google/local provider implementation 與 cache helper。這些資料層程式碼衍生自上游專案，並針對 monitor 調整。

Monitor parser 可讀取內建 provider shape 與相容的歷史 JSON shape，包含：

- `quotaInfos[]`
- `windows.fiveHour`
- `windows.weekly`
- `weeklyRemainingPercentage`、`weeklyResetTime`、`weeklyTimeUntilResetMs`

Monitor UI 現在改成每個 model group 只顯示單一 `Quota` 欄位。當上游實際只提供一個 quota window 時，`agy-monitor` 會直接呈現該窗口的真實剩餘百分比與 reset time，而不是硬拆成 `5h` 與 `Week` 兩欄。

除錯建議：

- `agy-monitor debug-dump --method google --no-cache`
- 檢查 `analysis-*.json` 內的 `usedCache`、`methodsSeen`、`sourcesSeen`
- 快取現在會綁定 provider，`google` 與 `local` 不會互相污染

設定會存放在 `agy-monitor` namespace。如果本機只有舊 `antigravity-usage` config，且尚未建立 `agy-monitor` config，provider 會為相容性做一次性匯入。

## 環境變數

Google OAuth login 預設可直接使用內建 credential。只有在你要覆蓋它們時，才需要設定環境變數。

| 變數 | 說明 |
| --- | --- |
| `ANTIGRAVITY_OAUTH_CLIENT_ID` | 覆蓋內建 Google OAuth client id 的可選環境變數。 |
| `ANTIGRAVITY_OAUTH_CLIENT_SECRET` | 覆蓋內建 Google OAuth client secret 的可選環境變數。 |

## 設定

設定檔位置：

- Windows：`%APPDATA%\agy-monitor\config.json`
- macOS/Linux：`~/.config/agy-monitor/config.json`

範例：

```json
{
  "refreshIntervalSec": 60,
  "columns": 2,
  "method": "google",
  "maskEmail": false,
  "allModels": false,
  "accountAliases": {
    "account1@example.com": "Main",
    "account2@example.com": "Backup"
  },
  "thresholds": {
    "green": 80,
    "yellow": 40,
    "orange": 15,
    "red": 1
  }
}
```

## 開發

```bash
npm test
npm run typecheck
npm run build
```

Provider 程式碼放在 `src/antigravity/`，monitor 正規化與畫面渲染分別放在 `src/parser/` 與 `src/render/`。不要加入帳號切換、wakeup 或任何會消耗 quota 的行為。

## 授權

MIT
