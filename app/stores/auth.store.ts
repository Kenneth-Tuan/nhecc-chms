/**
 * Auth Store
 * Manages the current user context and CASL ability.
 */
import { defineStore } from "pinia";
import { useAbility } from "@casl/vue";
import { unpackRules } from "@casl/ability/extra";
import type { UserContext, AuthContextResponse } from "~/types/auth";
import type { AppAbility } from "~/utils/casl/ability";

export const useAuthStore = defineStore("auth", () => {
  const userContext = ref<UserContext | null>(null);
  const isLoading = ref(false);
  const isInitialized = ref(false);

  const ability = useAbility<AppAbility>();

  const currentUserName = computed(
    () => userContext.value?.fullName || "未登入",
  );

  /** 有資料範圍上的「行政」scope（DAC admin） */
  const isAdmin = computed(() => {
    const admin = userContext.value?.accessScope?.admin;
    if (!admin) return false;
    return admin.isGlobal || admin.zone.length > 0 || admin.group.length > 0;
  });

  const hasAdminAccess = isAdmin;

  /**
   * 能否進入 /dashboard（middleware 用）。
   * 角色上的 dashboard:view 與 DAC admin scope 任一滿足即可，避免只靠 data_access 把人擋在門外。
   */
  const canAccessDashboard = computed(() => {
    if (userContext.value?.permissions?.["dashboard:view"]) return true;
    return isAdmin.value;
  });

  const hasFunctionsAccess = computed(() => {
    const fn = userContext.value?.accessScope?.functions;
    if (!fn) return false;
    return fn.isGlobal || Object.values(fn.targets).some((arr) => arr.length > 0);
  });

  async function loadContext(): Promise<void> {
    isLoading.value = true;
    try {
      // 在伺服器端執行時，需要手動轉發 Cookie 標頭
      const headers = useRequestHeaders(["cookie"]) as HeadersInit;

      const response = await $fetch<AuthContextResponse>("/api/auth/context", {
        headers,
      });

      userContext.value = response.user;
      ability.update(unpackRules(response.rules));
      isInitialized.value = true;
    } catch (error) {
      console.error("Failed to load auth context:", error);
      $reset();
      isInitialized.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  function $reset(): void {
    userContext.value = null;
    isInitialized.value = false;
    isLoading.value = false;
  }

  return {
    userContext,
    isLoading,
    isInitialized,
    currentUserName,
    isAdmin,
    canAccessDashboard,
    hasAdminAccess,
    hasFunctionsAccess,
    loadContext,
    $reset,
  };
});
