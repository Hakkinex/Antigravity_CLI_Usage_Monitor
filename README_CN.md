# Antigravity CLI Usage Monitor

[English](README.md)

一個只讀的終端機 dashboard，用來同時監控多個 Antigravity CLI 帳號的 quota 狀態。它會包裝 `antigravity-usage`，並用穩定的 2 欄終端機卡片畫面顯示短週期與週用量。

這個工具刻意只做監控，不做帳號調度。它不會在某個帳號滿額後自動切換到其他帳號，不會執行 wakeup，也不會觸發任何模型請求。

## 目錄

- [安全性](#安全性)
- [背景](#背景)
- [功能](#功能)
- [安裝](#安裝)
- [使用方式](#使用方式)
- [資料來源](#資料來源)
- [設定](#設定)
- [貢獻](#貢獻)
- [授權](#授權)

## 安全性

`agy-monitor` 只會透過 `antigravity-usage` 呼叫 quota / read 類型指令。

它不會：

- 登入帳號
- 為了工作調度切換帳號
- 呼叫 wakeup
- 直接讀取或修改 token 檔案
- 儲存 token
- 把帳號或 quota 資料傳送到外部服務

請勿提交真實帳號 token、private key、`.env` 檔案，或包含私人帳號資料的原始 quota 輸出。

## 背景

Antigravity CLI 使用者常會同時管理多個帳號，因此需要一個不用逐一手動查詢、可以快速看懂 quota 狀態的工具。`agy-monitor` 專注在一件事：在終端機中清楚顯示所有帳號的用量狀態。

v0.1 使用 `antigravity-usage` 作為資料來源，並用輕量 ANSI dashboard 呈現，不使用大型 TUI framework。

## 功能

- 2 欄終端機卡片 dashboard。
- 多帳號 quota 監控。
- 預設顯示完整 email。
- 可選擇遮罩 email。
- 同一列顯示短週期 quota 與週 quota。
- 顯示剩餘百分比、reset time 與彩色狀態點。
- 自動刷新。
- 按 `r` 手動刷新。
- 按 `q` 離開。
- 類似 `docker stats` 的穩定重繪，不持續追加輸出。
- mock fixture 模式，方便本機測試畫面。
- 可設定 alias、門檻、刷新間隔、method 與欄數。

畫面列範例：

```text
Model                  5h             Week
Gemini 3 Pro (High)    ● 100% 4h25m   ● 92% 3d4h
```

## 安裝

本專案使用 npm，請以 `package-lock.json` 作為標準 lockfile。

先安裝資料來源工具：

```bash
npm install -g antigravity-usage
```

再安裝本專案：

```bash
npm install
npm run build
npm link
```

## 使用方式

啟動監控：

```bash
agy-monitor watch
```

使用 mock 資料測試畫面：

```bash
npm run dev
```

或：

```bash
agy-monitor watch --mock
```

### 參數

| 參數 | 預設 | 說明 |
| --- | --- | --- |
| `--interval <sec>` | `60` | 資料刷新間隔。 |
| `--columns <n>` | `2` | 帳號卡片偏好的欄數。 |
| `--method <name>` | `google` | 傳給 `antigravity-usage` 的 method。 |
| `--refresh` | `false` | 啟動時強制刷新。 |
| `--mask-email` | `false` | 遮罩卡片標題中的帳號 email。 |
| `--all-models` | `false` | 將 `--all-models` 傳給 `antigravity-usage`。 |
| `--debug` | `false` | 顯示 provider 指令細節。 |
| `--mock` | `false` | 使用內建 fixture 資料。 |

### 快捷鍵

| 按鍵 | 說明 |
| --- | --- |
| `r` | 立即刷新。 |
| `q` | 離開。 |

### 指令

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 使用內建 mock 資料啟動監控。 |
| `npm run build` | 將 TypeScript 編譯到 `dist/`。 |
| `npm start` | 執行已編譯版本。 |
| `npm test` | 執行 Vitest 測試。 |
| `npm run typecheck` | 執行 TypeScript 檢查但不輸出檔案。 |

### Debug Dump

若要檢查 monitor 實際取得的 `antigravity-usage` 原始 response：

```bash
agy-monitor debug-dump --method google --refresh
```

這會把 debug 檔案寫到 `.agy-monitor-debug/`：

- `antigravity-usage-stdout-*.json`
- `antigravity-usage-stderr-*.log`
- `analysis-*.json`

`analysis` 檔會掃描 stdout JSON 與 debug stderr 區塊，列出可能與 quota 有關的路徑，例如 `weekly`、`week`、`quota`、`reset`、`remaining`、`period`、`window`。

請勿提交 `.agy-monitor-debug/`，裡面可能包含帳號 email 或原始 quota 資料。

## 資料來源

預設 wrapper 指令：

```bash
antigravity-usage quota --all --json --method google
```

如果安裝的 provider 不支援 `quota` 子指令形式，`agy-monitor` 會 fallback 到：

```bash
antigravity-usage --all --json --method google
```

`--refresh` 只會在使用者要求啟動強制刷新，或手動刷新時傳入。

週 quota 需要 `antigravity-usage --json` 輸出 `weeklyRemainingPercentage`、`weeklyResetTime` 或 `weeklyTimeUntilResetMs` 等欄位。乾淨的 upstream 修改方向請看 [docs/antigravity-usage-weekly-json.md](docs/antigravity-usage-weekly-json.md)。

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
    "account1@gmail.com": "Main",
    "account2@gmail.com": "Backup"
  },
  "thresholds": {
    "green": 80,
    "yellow": 40,
    "orange": 15,
    "red": 1
  }
}
```

## 貢獻

請保持變更範圍明確，並維持只讀監控的邊界。

- Provider 程式碼放在 `src/providers/`。
- JSON 正規化放在 `src/parser/`。
- 終端機畫面渲染放在 `src/render/`。
- 不加入帳號切換、wakeup 或任何會消耗 quota 的行為。
- 修改 parser、layout 或刷新行為時，請新增或更新測試。
- 送出前執行 `npm test` 與 `npm run build`。

## 授權

MIT
