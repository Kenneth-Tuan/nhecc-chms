/**
 * Auth composable
 * Provides access to auth store with automatic initialization and CASL ability.
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
    availableTestUsers: computed(() => store.availableTestUsers),
    isLoading: computed(() => store.isLoading),
    isInitialized: computed(() => store.isInitialized),
    can,
    loadContext: store.loadContext,
    switchUser: store.switchUser,
  };
}
