/**
 * 全域環境變數配置
 *
 * 控制應用程式使用本地模擬資料 (DEV) 或實體 Firebase (PROD)。
 * 透過 NUXT_PUBLIC_APP_MODE 環境變數進行設定。
 */
export type AppMode = "DEV" | "PROD";

export const APP_MODE: AppMode =
  (import.meta.env.NUXT_PUBLIC_APP_MODE as AppMode) || "DEV";

export const isDev = (): boolean => APP_MODE === "DEV";
export const isProd = (): boolean => APP_MODE === "PROD";
