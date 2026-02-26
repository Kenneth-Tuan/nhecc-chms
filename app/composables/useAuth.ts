/**
 * 身份驗證 Composable
 * 提供對 Auth Store 的存取，並包含自動初始化與 CASL 能力 (Ability) 整合。
 */
import { useAbility } from "@casl/vue";
import { useAuthStore } from "~/stores/auth.store";
import type { AppAbility } from "~/utils/casl/ability";

export function useAuth() {
  const store = useAuthStore();
  const { can } = useAbility<AppAbility>();

  if (!store.isInitialized && !store.isLoading) {
    store.loadContext();
  }

  return {
    userContext: computed(() => store.userContext),
    currentUserName: computed(() => store.currentUserName),
    currentScope: computed(() => store.currentScope),
    currentScopeLabel: computed(() => store.currentScopeLabel),
    isLoading: computed(() => store.isLoading),
    isInitialized: computed(() => store.isInitialized),
    can,
    loadContext: store.loadContext,
  };
}
