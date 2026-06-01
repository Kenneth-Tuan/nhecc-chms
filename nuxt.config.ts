import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

/** Colorffy dark theme — https://colorffy.com/dark-theme-generator */
const colorffyDarkSurface = {
  0: "#ffffff",
  50: "#e8e8e8",
  100: "#d4d4d4",
  200: "#c0c0c0",
  300: "#acacac",
  400: "#929292", // surface-a50
  500: "#7e7e7e", // surface-a40
  600: "#6a6a6a", // surface-a30
  700: "#575757", // surface-a20
  800: "#454545", // surface-a10
  900: "#333333", // surface-a0
  950: "#2a2a2a",
} as const;

const AppPreset = definePreset(Aura, {
  primitive: {
    green: {
      50: "#e8f5ef",
      100: "#c5e6d8",
      200: "#86bfa6",
      300: "#86bfa6",
      400: "#5ba989",
      500: "#22946e",
      600: "#1b7a5c",
      700: "#156049",
      800: "#0f4636",
      900: "#092c22",
      950: "#041610",
    },
    orange: {
      50: "#faf4e8",
      100: "#f0e2c8",
      200: "#cbae84",
      300: "#cbae84",
      400: "#ba945a",
      500: "#a87a2a",
      600: "#8a6322",
      700: "#6c4c1a",
      800: "#4e3612",
      900: "#30200a",
      950: "#181004",
    },
    red: {
      50: "#faeaea",
      100: "#f0d0ce",
      200: "#ca7f77",
      300: "#ca7f77",
      400: "#b4544c",
      500: "#9c2121",
      600: "#801b1b",
      700: "#641515",
      800: "#480f0f",
      900: "#2c0909",
      950: "#100303",
    },
    blue: {
      50: "#e8eef7",
      100: "#c5d4ea",
      200: "#7590ba",
      300: "#7590ba",
      400: "#4b6ca2",
      500: "#21498a",
      600: "#1b3c72",
      700: "#152f5a",
      800: "#0f2242",
      900: "#09152a",
      950: "#040812",
    },
  },
  semantic: {
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
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
        surface: colorffyDarkSurface,
        primary: {
          color: "#60a5fa",
          contrastColor: "#333333",
          hoverColor: "#71aefb",
          activeColor: "#81b8fc",
        },
        highlight: {
          background: "color-mix(in srgb, #60a5fa, transparent 84%)",
          focusBackground: "color-mix(in srgb, #60a5fa, transparent 76%)",
          color: "#91c1fd",
          focusColor: "#b1d3ff",
        },
        formField: {
          background: "{surface.950}",
          filledBackground: "{surface.800}",
          filledHoverBackground: "{surface.800}",
          filledFocusBackground: "{surface.800}",
          borderColor: "{surface.700}",
          hoverBorderColor: "{surface.600}",
        },
        content: {
          background: "{surface.900}",
          hoverBackground: "{surface.800}",
          borderColor: "{surface.700}",
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
    lineChannelId: process.env.NUXT_LINE_CHANNEL_ID,
    lineChannelSecret: process.env.NUXT_LINE_CHANNEL_SECRET,
    firebaseAdminCredential: process.env.NUXT_FIREBASE_ADMIN_CREDENTIAL,
    cronSecret: process.env.NUXT_CRON_SECRET,

    public: {
      liffId: process.env.NUXT_LINE_LIFF_ID,
      VERSION: "0.1.0",
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId:
        process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      useEmulator: process.env.NUXT_PUBLIC_USE_EMULATOR === "true",
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

  vite: {
    optimizeDeps: {
      include: [
        "firebase/app",
        "firebase/auth",
        "@casl/vue",
        "@casl/ability",
        "@casl/ability/extra",
        "@line/liff",
        "primevue/usetoast",
        "primevue/useconfirm",
        "zod",
        "dayjs",
        "lottie-web",
        "@vue/devtools-core",
        "@vue/devtools-kit",
        "primevue/config",
        "primevue/confirmationservice",
        "primevue/dialogservice",
        "primevue/toastservice",
        "primevue/toast",
        "primevue/dynamicdialog",
        "primevue/select",
        "primevue/button",
        "primevue/password",
        "primevue/inputtext",
        "primevue/stepper",
        "primevue/steppanels",
        "primevue/listbox",
        "primevue/datepicker",
        "primevue/selectbutton",
        "primevue/steppanel",
        "primevue/steplist",
        "primevue/step",
        "primevue/divider",
        "primevue/inputmask",
        "primevue/avatar",
        "primevue/fileupload",
        "primevue/tag",
        "primevue/drawer",
        "primevue/progressspinner",
        "primevue/progressbar",
        "primevue/badge",
        "primevue/card",
        "primevue/tooltip",
        "primevue/datatable",
        "primevue/column",
        "primevue/message",
        "primevue/confirmdialog",
        "primevue/tabs",
        "primevue/tablist",
        "primevue/tab",
        "primevue/paginator",
        "primevue/iconfield",
        "primevue/inputicon",
        "primevue/autocomplete",
        "primevue/toggleswitch",
        "primevue/tabpanels",
        "primevue/tabpanel",
        "primevue/textarea",
      ],
      entries: [
        "app/**/*.vue",
      ],
    },
  },
});
