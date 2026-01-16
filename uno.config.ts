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
      primary: "var(--p-primary-color)",
      "primary-contrast": "var(--p-primary-contrast-color)",

      // 也可以對應 Surface (背景色系)
      surface: {
        0: "var(--p-surface-0)",
        50: "var(--p-surface-50)",
        100: "var(--p-surface-100)",
        200: "var(--p-surface-200)",
        // ...以此類推
      },
    },
  },
});
