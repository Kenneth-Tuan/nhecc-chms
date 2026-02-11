/**
 * Global Environment Configuration
 *
 * Controls whether the app uses local mock data (DEV) or Firebase (PROD).
 * Set via NUXT_PUBLIC_APP_MODE environment variable.
 */
export type AppMode = 'DEV' | 'PROD';

export const APP_MODE: AppMode =
  (import.meta.env.NUXT_PUBLIC_APP_MODE as AppMode) || 'DEV';

export const isDev = (): boolean => APP_MODE === 'DEV';
export const isProd = (): boolean => APP_MODE === 'PROD';
