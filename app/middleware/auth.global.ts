import { useAuthStore } from "~/stores/auth.store";

export default defineNuxtRouteMiddleware(async (to) => {
  const store = useAuthStore();

  // 1. 如果去的是登入頁，直接跳過（避免無限循環）
  if (
    to.path === "/login" ||
    to.path === "/liff" ||
    to.path.startsWith("/register")
  )
    return;

  // 2. 如果尚未初始化，先嘗試載入用戶上下文 (Session)
  if (!store.isInitialized && !store.isLoading) {
    await store.loadContext();
  }

  // 3. 如果初始化後仍然沒有用戶上下文，則視為未登入
  if (!store.userContext) {
    return navigateTo({
      path: "/login",
      query: {
        redirect: to.fullPath,
      },
    });
  }
});
