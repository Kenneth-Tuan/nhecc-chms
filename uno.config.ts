import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
} from "unocss";

export default defineConfig({
  presets: [
    // 1. 核心預設：相容 Tailwind CSS/Windi CSS 語法
    // 適合 PrimeVue 的 Layout 與 Spacing
    presetUno(),

    // 2. 屬性模式：讓 Vue Template 更乾淨 (可選，但強烈推薦)
    // 允許寫法：<div un-flex="~ col" m-4>
    presetAttributify({
      prefix: "un-",
      prefixedOnly: true, // <--
    }),

    // 3. 圖標預設：直接使用 Iconify 圖標 (如 i-heroicons-home)
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],

  // 4. 關鍵整合：將 PrimeVue 的 CSS 變數映射到 UnoCSS 的 Utilities
  theme: {
    colors: {
      // 這樣你就可以用 text-primary, bg-primary, border-primary
      // 它會自動對應到 PrimeVue 當前的主題色
      primary: {
        DEFAULT: "var(--p-primary-color)",
        50: "var(--p-primary-50)",
        100: "var(--p-primary-100)",
        200: "var(--p-primary-200)",
        300: "var(--p-primary-300)",
        400: "var(--p-primary-400)",
        500: "var(--p-primary-500)",
        600: "var(--p-primary-600)",
        700: "var(--p-primary-700)",
        800: "var(--p-primary-800)",
        900: "var(--p-primary-900)",
        950: "var(--p-primary-950)",
      },

      // 也可以對應 Surface (背景色系)
      surface: {
        0: "var(--p-surface-0)",
        50: "var(--p-surface-50)",
        100: "var(--p-surface-100)",
        200: "var(--p-surface-200)",
        300: "var(--p-surface-300)",
        400: "var(--p-surface-400)",
        500: "var(--p-surface-500)",
        600: "var(--p-surface-600)",
        700: "var(--p-surface-700)",
        800: "var(--p-surface-800)",
        900: "var(--p-surface-900)",
        950: "var(--p-surface-950)",
      },

      // 也可以對應 Text (文字顏色系)
      text: { muted: "var(--p-text-muted-color)" },
    },
    extend: {
      padding: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      height: {
        "safe-top": "env(safe-area-inset-top)",
      },
    },
  },
});
