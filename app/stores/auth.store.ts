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
      ability.update(unpackRules(response.rules));
      isInitialized.value = true;
    } catch (error) {
      console.error("Failed to load auth context:", error);
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
    currentScope,
    currentScopeLabel,
    loadContext,
    $reset,
  };
});
