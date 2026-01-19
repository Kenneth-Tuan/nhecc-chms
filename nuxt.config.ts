import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

const AppPreset = definePreset(Aura, {
  semantic: {
    // 1. 全域基礎設定
    primary: {
      // 🔵 改用藍色系 (Based on Tailwind Blue / Royal Blue)
      50: "#eff6ff", // 極淺藍 (適合背景)
      100: "#dbeafe", // 淺藍 (適合 Hover 背景)
      200: "#bfdbfe", // 輔助色 (您圖片中的淺藍色，適合裝飾)
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#2563eb", // 🌟 主色 (Royal Blue): 用於按鈕，高對比，長輩友善
      600: "#1d4ed8", // Hover 狀態 (更深一點)
      700: "#1e40af", // Active 狀態
      800: "#1e3a8a",
      900: "#172554",
      950: "#0b1120",
    },
    focusRing: {
      width: "2px", // 建議：對長輩來說，1px 可能太細，2px 較清楚
      style: "solid",
      color: "{primary.color}",
      offset: "2px",
      shadow: "none",
    },
    transitionDuration: "0.2s",
    disabledOpacity: "0.6",
    iconSize: "1rem",
    anchorGutter: "2px",
    borderRadius: {
      md: "6px",
      xl: "12px",
    },
    fontFamily: "Inter var, sans-serif",

    // 2. 表單欄位特殊設定
    formField: {
      paddingX: "0.75rem",
      paddingY: "0.5rem",
      borderRadius: "{border.radius.md}",
      transitionDuration: "{transition.duration}",

      sm: {
        paddingX: "0.625rem",
        paddingY: "0.375rem",
        fontSize: "0.875rem",
      },
      lg: {
        paddingX: "0.875rem",
        paddingY: "0.625rem",
        fontSize: "1.125rem",
      },

      // 表單聚焦時無外圈光暈 (依照您原本設定)
      focusRing: {
        width: "0",
        style: "none",
        color: "transparent",
        offset: "0",
        shadow: "none",
      },
    },

    // 3. 列表與選單
    list: {
      gap: "2px",
      headerPadding: "0.5rem 1rem 0.25rem 1rem",
      option: {
        padding: "0.5rem 0.75rem",
        borderRadius: "{border.radius.sm}",
      },
      optionGroup: {
        padding: "0.5rem 0.75rem",
        fontWeight: "600",
      },
    },

    // 4. 覆蓋層
    overlay: {
      select: {
        borderRadius: "{border.radius.md}",
        shadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
      },
      popover: {
        borderRadius: "{border.radius.md}",
        padding: "0.75rem",
        shadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
      },
      modal: {
        borderRadius: "{border.radius.xl}",
        padding: "1.25rem",
        shadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
      },
      navigation: {
        shadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
      },
    },

    // 5. 色彩計畫
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
        text: {
          color: "{surface.700}",
          hoverColor: "{surface.800}",
          mutedColor: "{surface.500}",
          hoverMutedColor: "{surface.600}",
        },
        content: {
          background: "{surface.0}",
          hoverBackground: "{surface.100}",
          borderColor: "{surface.200}",
          color: "{text.color}",
          hoverColor: "{text.hover.color}",
        },
        formField: {
          background: "{surface.0}",
          disabledBackground: "{surface.200}",
          filledBackground: "{surface.50}",
          filledHoverBackground: "{surface.50}",
          filledFocusBackground: "{surface.50}",
          borderColor: "{surface.300}",
          hoverBorderColor: "{surface.400}",
          focusBorderColor: "{primary.color}",
          invalidBorderColor: "{red.400}",
          color: "{surface.700}",
          disabledColor: "{surface.500}",
          placeholderColor: "{surface.500}",
          floatLabelColor: "{surface.500}",
          floatLabelFocusColor: "{primary.600}",
          floatLabelActiveColor: "{surface.500}",
          iconColor: "{surface.400}",
          shadow: "0 0 #0000, 0 0 #0000",
        },
      },
      dark: {
        // ⚠️ 修正：這裡定義深色模式的 Surface 色階 (Slate/Gray)
        // 確保 0 是最深，900 依然是深色，但在 Content Mapping 時會反轉使用
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
        // 在 Dark Mode 中，Primary 通常會自動選用較亮的色階 (如 400)
        primary: {
          color: "{primary.400}", // 深色模式下用亮藍色 (#60a5fa) 確保可視性
          contrastColor: "{surface.900}",
          hoverColor: "{primary.300}",
          activeColor: "{primary.200}",
        },
        text: {
          color: "{surface.0}", // 白字
          hoverColor: "{surface.0}",
          mutedColor: "{surface.400}",
          hoverMutedColor: "{surface.300}",
        },
        content: {
          background: "{surface.900}", // 深色背景
          hoverBackground: "{surface.800}",
          borderColor: "{surface.700}",
          color: "{text.color}",
          hoverColor: "{text.hover.color}",
        },
        formField: {
          background: "{surface.950}",
          disabledBackground: "{surface.700}",
          filledBackground: "{surface.800}",
          filledHoverBackground: "{surface.800}",
          filledFocusBackground: "{surface.800}",
          borderColor: "{surface.700}", // 修正邊框顏色，讓它在深色模式更明顯
          hoverBorderColor: "{surface.500}",
          focusBorderColor: "{primary.color}",
          invalidBorderColor: "{red.300}",
          color: "{surface.0}",
          disabledColor: "{surface.400}",
          placeholderColor: "{surface.400}",
          floatLabelColor: "{surface.400}",
          floatLabelFocusColor: "{primary.color}",
          iconColor: "{surface.400}",
        },
        overlay: {
          select: {
            background: "{surface.900}",
            borderColor: "{surface.700}",
            color: "{text.color}",
          },
          popover: {
            background: "{surface.900}",
            borderColor: "{surface.700}",
            color: "{text.color}",
          },
          modal: {
            background: "{surface.900}",
            borderColor: "{surface.700}",
            color: "{text.color}",
          },
        },
      },
    },
  },
});

export default defineNuxtConfig({
  devServer: {
    port: 3000,
    https: false,
  },

  runtimeConfig: {
    // Private keys are only available on the server
    lineChannelId: "",

    public: {
      liffId: "",
      VERSION: "0.1.0",
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

  nitro: {
    firebase: {
      gen: 2,
    },
    preset: "firebase_app_hosting",
  },
});
