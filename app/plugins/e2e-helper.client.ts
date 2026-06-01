export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("app:mounted", () => {
    (window as any).__NUXT_HYDRATED__ = true;
  });
});
