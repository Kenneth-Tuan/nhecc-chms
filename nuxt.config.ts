import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

const AppPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6", // 🌟 您截圖中的按鈕顏色 (Light Mode)
      600: "#2563eb", // 上一版的主色，這裡作為 Hover 色
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
      950: "#172554",
    },
    // 確保 Focus Ring 足夠明顯 (2px)
    focusRing: {
      width: "2px",
      style: "solid",
      color: "{primary.color}",
      offset: "2px",
      shadow: "none",
    },
    colorScheme: {
      light: {
        surface: {
          0: "#ffffff",
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        primary: {
          color: "{primary.500}", // 明亮的藍色
          contrastColor: "#ffffff", // 白字
          hoverColor: "{primary.600}", // 滑鼠懸停變深一點
          activeColor: "{primary.700}",
        },
        highlight: {
          background: "{primary.50}",
          focusBackground: "{primary.100}",
          color: "{primary.700}",
          focusColor: "{primary.800}",
        },
      },
      dark: {
        surface: {
          0: "#ffffff",
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        primary: {
          // ⚠️ 關鍵：在深色模式(您截圖中的樣子)，PrimeVue 會自動用比較亮的顏色
          // 這裡設定為 400 (#60a5fa)，這就是為什麼截圖中的藍色看起來會發光
          color: "{primary.400}",
          contrastColor: "{surface.900}", // 深色字
          hoverColor: "{primary.300}",
          activeColor: "{primary.200}",
        },
        highlight: {
          background: "rgba(59, 130, 246, 0.16)", // Blue-500 with opacity
          focusBackground: "rgba(59, 130, 246, 0.24)",
          color: "{primary.300}",
          focusColor: "{primary.200}",
        },
      },
    },
  },
});

export default defineNuxtConfig({
  devServer: {
    port: 7000,
    https: false,
  },

  runtimeConfig: {
    // Private keys are only available on the server
    lineChannelId: "",

    public: {
      liffId: "",
      VERSION: "0.1.0",
      appMode: "DEV", // DEV or PROD
    },
  },

  app: {
    pageTransition: {
      name: "page",
      mode: "out-in",
    },
  },

  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@unocss/nuxt",
    "@primevue/nuxt-module",
    "@vueuse/nuxt",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
  ],

  css: [
    // "@unocss/reset/tailwind-compat.css",
    "~/assets/css/main.css",
  ],

  primevue: {
    usePrimeVue: true,
    autoImport: true,
    options: {
      ripple: true,
      inputVariant: "filled",
      theme: {
        preset: AppPreset,
        options: {
          prefix: "p",
          darkModeSelector: ".dark",
          cssLayer: {
            name: "primevue",
            order: "tailwind-base, primevue, tailwind-utilities",
          },
        },
      },
      zIndex: {
        modal: 1100, //dialog, drawer
        overlay: 1000, //select, popover
        menu: 1000, //overlay menus
        tooltip: 1100, //tooltip
      },
    },
  },

  unocss: {
    nuxtLayers: true,
  },

  pinia: {
    /**
     * Automatically add stores dirs to the auto imports. This is the same as
     * directly adding the dirs to the `imports.dirs` option. If you want to
     * also import nested stores, you can use the glob pattern `./stores/**`
     * (on Nuxt 3) or `app/stores/**` (on Nuxt 4+)
     *
     * @default `['stores']`
     */
    storesDirs: [],
  },
});
