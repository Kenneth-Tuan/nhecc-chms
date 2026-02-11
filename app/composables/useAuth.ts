/**
 * Auth composable
 * Provides access to auth store with automatic initialization.
 */
import { useAuthStore } from '~/stores/auth.store';

export function useAuth() {
  const store = useAuthStore();

  // Auto-initialize on first use
  if (!store.isInitialized && !store.isLoading) {
    store.loadContext();
  }

  return {
    userContext: computed(() => store.userContext),
    currentUserName: computed(() => store.currentUserName),
    currentScope: computed(() => store.currentScope),
    availableTestUsers: computed(() => store.availableTestUsers),
    isLoading: computed(() => store.isLoading),
    isInitialized: computed(() => store.isInitialized),
    hasPermission: store.hasPermission,
    canReveal: store.canReveal,
    loadContext: store.loadContext,
    switchUser: store.switchUser,
  };
}
