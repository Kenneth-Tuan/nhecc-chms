import { useAuthStore } from "~/stores/auth.store";

export default defineNuxtRouteMiddleware((to) => {
  const store = useAuthStore();

  // 如果已經初始化過但沒有用戶上下文（未登入），則導向登入頁
  if (store.isInitialized && !store.userContext) {
    return navigateTo({
      path: "/login",
      query: { redirect: to.fullPath },
    });
  }
});
