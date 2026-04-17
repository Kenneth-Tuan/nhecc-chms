import { useAuthStore } from "~/stores/auth.store";

/**
 * Dashboard Global Middleware
 * 自動對所有 /dashboard/* 路由進行身份驗證檢查。
 */
export default defineNuxtRouteMiddleware((to) => {
  // 僅針對 /dashboard 路徑進行攔截
  if (!to.path.startsWith("/dashboard")) return;

  const store = useAuthStore();

  // 如果已經完成初始化但沒有用戶上下文（未登入），則重導向登入頁
  if (store.isInitialized && !store.userContext) {
    return navigateTo({
      path: "/login",
      query: { redirect: to.fullPath },
    });
  }

  // 後台入口：dashboard:view 或 DAC admin scope
  if (store.isInitialized && store.userContext && !store.canAccessDashboard) {
    return navigateTo({
      path: "/",
      query: { error: "unauthorized" },
    });
  }
});
