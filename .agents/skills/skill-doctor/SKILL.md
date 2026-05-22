---
name: skill-doctor
description: >-
  Audit and score Agent Skills for spec compliance, description triggering,
  body quality, scripts, and eval maturity. Use when reviewing SKILL.md health,
  improving skill descriptions, diagnosing false triggers, or evaluating
  .agents/skills/ or ~/.cursor/skills/ before shipping.
disable-model-invocation: true
---

# Skill doctor

對**單一**目標 skill 目錄做健康檢查，產出可執行的修復清單。依據 [Agent Skills 創建指南](https://agentskills.io/skill-creation/)（quickstart、best practices、descriptions、evals、scripts）。

## 輸入

- **目標路徑**（必填）：例如 `.agents/skills/postman-sync/` 或 `~/.cursor/skills/my-skill/`
- **深度**（選填，預設 `standard`）：
  - `quick` — 只跑靜態腳本 + 簡短摘要
  - `standard` — 靜態 + 讀完整 `SKILL.md` + rubric 評分 + 報告
  - `deep` — standard + 建議 eval 提示詞 + 可選對目標 skill 做「試跑一次」觀察（若使用者要求）

若使用者未給路徑，列出 `.agents/skills/` 與（若存在）`~/.cursor/skills/` 下含 `SKILL.md` 的子目錄供選擇。

## 工作流程

### 1. 靜態稽核（必做）

從**本 skill 目錄**執行：

```bash
node .agents/skills/skill-doctor/scripts/audit-skill.mjs "<TARGET_SKILL_DIR>"
```

- exit `0`：無 critical 級別 error
- exit `1`：有 error；仍繼續人工評分
- 將 JSON `findings` 併入報告

### 2. 讀取目標 skill

1. 讀 `SKILL.md` 全文（frontmatter + body）
2. 掃描 `references/`、`assets/`、`scripts/`、`evals/`
3. 確認 body 是否写明**何時**讀哪個 reference（progressive disclosure）

細項評分標準見 **`references/rubric.md`**。

### 3. 人工維度評分

對五個維度各給 0–100 與一句理由（見 rubric §6）：

1. Spec compliance（靜態權重高）
2. Discoverability（description）
3. Executability（步驟、腳本、validation loop）
4. Maintainability（長度、拆分、術語一致）
5. Evidence（evals、已測腳本）

**Overall** = 加權平均，權重建議：Spec 25%、Discoverability 25%、Executability 25%、Maintainability 15%、Evidence 10%。有 **critical** finding 時 overall 不得高於 59（At risk）。

### 4. 輸出報告

依 **`assets/health-report-template.md`** 填寫完整報告（繁體中文或使用者語言）。必含：

- Executive summary
- 靜態 audit 摘要表
- Findings 分級（Critical / Major / Minor / Info），每項附**證據**（檔名、行號或引用片段）
- 若 description 需改：給一版 **≤1024 字** 的建議 YAML（勿 overfit 單一使用者原句）
- **Remediation plan**（有序、可在一輪 PR 內做完的粒度）

`quick` 深度可省略 eval 表與建議 description 全文，但保留 remediation Top 3。

### 5. 修復（僅在使用者明確要求時）

- 只改目標 skill，不順手改無關 repo
- 先 critical → description → 拆分 references → scripts 文件 → evals
- 改完再跑一次 `audit-skill.mjs` 驗證

## Gotchas

- **靜態腳本非完整體檢**：觸發率、輸出品質需 eval 或真人試 prompt；doctor 只標 maturity gap。
- **`description` 多行 YAML**：腳本會折疊 `>` 區塊計字元；人工仍要讀原文確認語意。
- **子 skill 編排**：若目標 skill 只做路由（如 postman-sync），評分時允許較短 body，但 description 必須寫清「何時用編排 skill vs 子 skill」。
- **disable-model-invocation**：診斷用 skill（如本 doctor）建議設 `true`，避免一般對話誤觸發；與「可被 agent 自動選用」的業務 skill 不同，勿強制套用到所有 skill。

## 界限

| 做                                       | 不做                                             |
| ---------------------------------------- | ------------------------------------------------ |
| 評估單一 skill 目錄                      | 一次改完整個 skills 目錄（除非使用者要求 batch） |
| 引用 agentskills.io 規範與本 repo rubric | 代替使用者跑 20×3 觸發率自動化（可建議腳本化）   |
| 建議 eval 提示詞                         | 未要求時不實作目標 skill 的業務邏輯              |

## 參考

- Rubric：`references/rubric.md`
- 報告模板：`assets/health-report-template.md`
- 靜態腳本：`scripts/audit-skill.mjs`
