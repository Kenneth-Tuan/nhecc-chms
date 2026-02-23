import { useAuthStore } from "~/stores/auth.store";

export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith("/dashboard")) return;

  const store = useAuthStore();

  if (store.isInitialized && !store.userContext) {
    return navigateTo("/login");
  }
});
