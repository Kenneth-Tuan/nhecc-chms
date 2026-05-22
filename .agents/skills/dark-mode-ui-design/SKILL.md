---
name: dark-mode-ui-design
description: >-
  Applies nhecc-chms dark mode UI rules: PrimeVue Aura + Colorffy tokens,
  UnoCSS `dark:` utilities, and `.dark` class. Use when adding or reviewing
  dark mode styles, theme contrast, surface elevation, semantic status colors,
  or PrimeVue component overrides under dark mode.
---

# Dark Mode UI — nhecc-chms

本 skill 以**目前 codebase 慣例**為準，通用 Material 原則僅作補充。技術棧：Nuxt 4、PrimeVue（`AppPreset` / Aura）、UnoCSS、`@vueuse/core` `useDark()`、`.dark` selector。

## 架構速查

| 項目                     | 位置                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Dark selector            | `nuxt.config.ts` → `darkModeSelector: ".dark"`                                      |
| Surface / primary tokens | `nuxt.config.ts` → `colorffyDarkSurface`、`AppPreset.semantic.colorScheme.dark`     |
| CSS 變數 `--clr-*`       | `app/assets/css/main.css` → `.dark { ... }`                                         |
| UnoCSS 語意色            | `uno.config.ts` → `success` / `warning` / `danger` / `info` / `tonal`（需 `dark:`） |
| 切換                     | `app/composables/useTheme.ts`、`ColorModeButton.vue`                                |

**禁止**：在元件寫 `#000`、`#fff` 硬編碼（除非 overlay `white/10` 這類 utility）。優先 `surface-*`、`primary-*`、語意色 utility。

## Surface 階梯（Elevation）

深色模式用**較淺的 surface** 表較高層級，少用陰影（可用 `dark:shadow-none` 或極淡 `dark:shadow-blue-900/20`）。

| 層級                   | 典型 class                                      | 用途                               |
| ---------------------- | ----------------------------------------------- | ---------------------------------- |
| 頁面底                 | `dark:bg-surface-950` / `dark:bg-surface-900`   | 全頁、`body` 內容區                |
| 區塊 / 列表容器        | `dark:bg-surface-900`                           | Filter bar、表格外殼、虛線空狀態底 |
| 卡片 / 側欄 / 表單面板 | `dark:bg-surface-900` 或 `dark:bg-surface-800`  | Card、Sidebar、可拖曳列            |
| 卡片內嵌區             | `dark:bg-surface-800`、`dark:bg-surface-800/50` | 巢狀資訊塊                         |
| 邊框                   | `dark:border-surface-700`（分隔線可用 `/50`）   | 全專案標準邊框色                   |

Light 對照：light 用 `bg-white` + `border-slate-200`；dark 成對改 `surface`，不要只加 dark 忘記改 border。

## 文字階梯

專案**標題/英雄區**允許 `dark:text-white`（高對比、大齡友善）；**內文與表單**優先 PrimeVue surface 階梯，避免到處純白。

| 層級            | Dark class                                        | 範例用途                        |
| --------------- | ------------------------------------------------- | ------------------------------- |
| 主標題 / Hero   | `dark:text-white` 或 `dark:text-surface-0`        | `h1`、課程名、`font-black` 大標 |
| 次標 / 強調內文 | `dark:text-surface-100` ~ `dark:text-surface-200` | 卡片標題、label、`font-bold`    |
| 內文            | `dark:text-surface-200` ~ `dark:text-gray-300`    | 說明、prose                     |
| 輔助 / caption  | `dark:text-surface-400` ~ `dark:text-gray-500`    | 副標、meta、placeholder 感      |
| 停用 / 極弱     | `dark:text-surface-500` ~ `dark:text-surface-600` | 圖示、次要提示                  |

Dashboard 頁首可用 `dark:text-surface-0`（見 `BasePageHeader.vue`）。**不要**在一般段落用 `text-gray-900` 而不加 `dark:` 對偶。

## 語意色（狀態 / 標籤 / Alert）

深色下降低飽和：**淺底 + 半透明 + 較亮字色**，沿用 codebase pattern。

```html
<!-- 成功 / 已連結 -->
<div
  class="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/30"
>
  <p class="text-green-600 dark:text-green-400">...</p>
</div>

<!-- 資訊 / 主色標籤 -->
<span
  class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50"
>
  <!-- 警告 -->
  <div
    class="bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30"
  >
    <p class="text-amber-700 dark:text-amber-500">...</p>
  </div></span
>
```

進度 / 狀態 chip（learn 頁）：`dark:bg-emerald-950/40 dark:text-emerald-300` 這類 **950/40 底 + 300 字**。

語意 token（`uno.config`）：`dark:text-success`、`dark:bg-danger` 等僅在 `.dark` 下有 `--clr-*` 定義。

## 元件範本

### 卡片（對齊 `CourseCard.vue`）

```html
<Card
  class="bg-white dark:bg-surface-900 border border-gray-100 dark:border-surface-700
         shadow-sm dark:group-hover:shadow-blue-900/20"
>
  <h2 class="text-gray-900 dark:text-white font-black">...</h2>
  <p class="text-gray-400 dark:text-gray-500">...</p>
</Card>
```

### 列表列（對齊 `GroupMemberCard.vue`）

```html
<div
  class="bg-white dark:bg-surface-800 rounded-lg border border-slate-200 dark:border-surface-700"
>
  <p class="text-slate-800 dark:text-surface-100 font-bold text-sm">...</p>
</div>
```

### 表單區塊（對齊 `ClassForm.vue`）

```html
<div
  class="bg-slate-50 dark:bg-surface-900 rounded-2xl border border-slate-100 dark:border-surface-700"
>
  <label class="text-slate-700 dark:text-surface-200 font-bold">...</label>
  <p class="text-slate-400 dark:text-surface-600 text-sm">...</p>
</div>
```

## PrimeVue 覆寫

元件預設跟 `AppPreset` dark scheme。若 SelectButton、Dialog 等視覺不對，在**頁面或元件**用 scoped：

```css
.dark :deep(.p-selectbutton .p-button.p-highlight) {
  /* 對齊 explore/index.vue */
}
```

優先改 theme token；`:deep` 只處理單頁例外。

## 圖片與媒體

- 頭像 / logo：維持原圖，必要時 `dark:opacity-90`
- 全幅 hero 圖：可 `dark:brightness-90 dark:saturate-90` 或半透明 overlay
- 避免在 dark 下仍用 `shadow-gray-200/50` 等 light-only 陰影

## 檢查清單（PR / 新頁）

1. 每個 `bg-white` / `text-slate-*` / `border-slate-*` 是否有對應 `dark:`？
2. 邊框是否用 `dark:border-surface-700`（非 `border-gray-800` 混用）？
3. 語意色是否用 `/10`、`/30` 底＋ `400` 系字色，而非 light 同色直接沿用？
4. 互動狀態：`hover:` 是否也有 `dark:hover:`？
5. 對比：正文在 `surface-900` 上避免 `surface-600` 當主內文色

## Anti-patterns

| 避免                           | 改用                                        |
| ------------------------------ | ------------------------------------------- |
| `dark:bg-black`、`#000`        | `dark:bg-surface-950` / `surface-900`       |
| 只有 `dark:bg-*` 沒改 border   | 成對 `dark:border-surface-700`              |
| light 飽和字色直接當 dark 主色 | `dark:text-blue-400`、`dark:text-green-400` |
| 全頁 `dark:text-white` 內文    | 內文 `surface-100`~`400`，標題才 white      |
| `dark:shadow-lg` 當主要層次    | 較淺 `surface` 背景                         |
| 硬編碼 hex 取代 token          | `var(--p-surface-*)` / Uno `surface-*`      |

## 通用原則（補充）

1. **飽和度**：dark 下 accent 用較柔色階（如 `blue-400`、`green-400`），大面積用低飽和底。
2. **WCAG**：正文對比 ≥ 4.5:1；大標題 ≥ 3:1。`surface-400` 在 `surface-900` 上僅適合輔助文字。
3. **背景**：基底 `#333`（`surface-900`），不用 `#000`。
4. **深度**：淺 surface = 高 elevation；陰影為輔。
5. **文字**：標題可 white / `surface-0`；層次用 surface 階梯，Material 86%/60%/38% opacity 僅作參考，非強制。

## 參考檔案

- `nuxt.config.ts` — `AppPreset`、`colorffyDarkSurface`
- `app/assets/css/main.css` — `.dark` tokens
- `uno.config.ts` — semantic colors
- `app/components/explore/CourseCard.vue` — 卡片
- `app/components/LinkedAccountItem.vue` — 語意狀態列
- `app/pages/explore/[id].vue` — 長文 / 區塊層次
