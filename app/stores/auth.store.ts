/**
 * Auth Store
 * Manages the current user context and CASL ability.
 */
import { defineStore } from "pinia";
import { useAbility } from "@casl/vue";
import { unpackRules } from "@casl/ability/extra";
import type {
  UserContext,
  MockTestUser,
  AuthContextResponse,
} from "~/types/auth";
import type { AppAbility } from "~/utils/casl/ability";

export const useAuthStore = defineStore("auth", () => {
  const userContext = ref<UserContext | null>(null);
  const availableTestUsers = ref<MockTestUser[]>([]);
  const isLoading = ref(false);
  const isInitialized = ref(false);

  const ability = useAbility<AppAbility>();

  const currentUserName = computed(
    () => userContext.value?.fullName || "未登入",
  );

  const scopeLabels: Record<string, string> = {
    Global: "全域",
    Zone: "牧區",
    Group: "小組",
    Self: "個人",
  };

  const currentScope = computed(() => userContext.value?.scope || "Self");

  const currentScopeLabel = computed(
    () => scopeLabels[userContext.value?.scope || "Self"] || "個人",
  );

  async function loadContext(): Promise<void> {
    isLoading.value = true;
    try {
      const response = await $fetch<AuthContextResponse>("/api/auth/context");
      userContext.value = response.user;
      availableTestUsers.value = response.availableTestUsers || [];
      ability.update(unpackRules(response.rules));
      isInitialized.value = true;
    } catch (error) {
      console.error("Failed to load auth context:", error);
    } finally {
      isLoading.value = false;
    }
  }

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
      ability.update(unpackRules(response.rules));
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
    loadContext,
    switchUser,
  };
});
