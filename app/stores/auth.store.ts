/**
 * Auth Store
 * Manages the current user context and permissions.
 */
import { defineStore } from "pinia";
import type {
  UserContext,
  MockTestUser,
  AuthContextResponse,
} from "~/types/auth";

export const useAuthStore = defineStore("auth", () => {
  const userContext = ref<UserContext | null>(null);
  const availableTestUsers = ref<MockTestUser[]>([]);
  const isLoading = ref(false);
  const isInitialized = ref(false);

  /** Current user's display name */
  const currentUserName = computed(
    () => userContext.value?.fullName || "未登入",
  );

  const scopeLabels: Record<string, string> = {
    Global: "全域",
    Zone: "牧區",
    Group: "小組",
    Self: "個人",
  };

  /** Current user's scope */
  const currentScope = computed(() => userContext.value?.scope || "Self");

  /** Current user's scope label (Chinese) */
  const currentScopeLabel = computed(
    () => scopeLabels[userContext.value?.scope || "Self"] || "個人",
  );

  /** Check a specific permission */
  function hasPermission(permission: string): boolean {
    if (!userContext.value) return false;
    return !!userContext.value.permissions[
      permission as keyof typeof userContext.value.permissions
    ];
  }

  /** Check reveal authority for a field */
  function canReveal(field: string): boolean {
    if (!userContext.value) return false;
    return !!userContext.value.revealAuthority[
      field as keyof typeof userContext.value.revealAuthority
    ];
  }

  /** Load auth context from API */
  async function loadContext(): Promise<void> {
    isLoading.value = true;
    try {
      const response = await $fetch<AuthContextResponse>("/api/auth/context");
      userContext.value = response.user;
      availableTestUsers.value = response.availableTestUsers || [];
      isInitialized.value = true;
    } catch (error) {
      console.error("Failed to load auth context:", error);
    } finally {
      isLoading.value = false;
    }
  }

  /** Switch to a different test user (DEV mode) */
  async function switchUser(userId: string): Promise<void> {
    isLoading.value = true;
    try {
      const response = await $fetch<AuthContextResponse & { success: boolean }>(
        "/api/auth/switch-user",
        {
          method: "POST",
          body: { userId },
        },
      );
      userContext.value = response.user;
      availableTestUsers.value = response.availableTestUsers || [];
    } catch (error) {
      console.error("Failed to switch user:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    userContext,
    availableTestUsers,
    isLoading,
    isInitialized,
    currentUserName,
    currentScope,
    currentScopeLabel,
    hasPermission,
    canReveal,
    loadContext,
    switchUser,
  };
});
