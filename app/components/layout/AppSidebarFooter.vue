<script setup lang="ts">
import { useAuthStore } from "~/stores/auth.store";

const emit = defineEmits<{
  navigate: [];
}>();

const route = useRoute();
const authStore = useAuthStore();
const firebaseAuth = useFirebaseAuth();

const isManagerMode = computed(() => route.path.startsWith("/dashboard"));

const userDescription = computed(() => {
  if (authStore.isAdmin) return "您擁有管理員權限";
  return "一般使用者";
});

async function handleLogout(): Promise<void> {
  try {
    await firebaseAuth.logout();
    emit("navigate");
    navigateTo("/login");
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

function handleModeSwitch(): void {
  emit("navigate");
  navigateTo(isManagerMode.value ? "/" : "/dashboard");
}
</script>

<template>
  <div class="pb-safe">
    <div
      class="flex items-center gap-3 p-2 rounded-xl border border-slate-100 dark:border-surface-700"
    >
      <Avatar
        :image="authStore.userContext?.avatar || undefined"
        :icon="authStore.userContext?.avatar ? undefined : 'pi pi-user'"
        shape="circle"
        class="!bg-slate-200 dark:!bg-surface-700 !text-slate-500"
      />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold truncate text-slate-900 dark:text-white">
          {{ authStore.currentUserName }}
        </p>
        <p class="text-xs truncate text-slate-500 dark:text-surface-400">
          {{ userDescription }}
        </p>
      </div>

      <ColorModeButton />

      <Button
        icon="pi pi-sign-out"
        severity="danger"
        variant="text"
        rounded
        aria-label="登出"
        @click.stop="handleLogout"
      />
    </div>

    <Button
      v-if="authStore.isAdmin"
      :label="isManagerMode ? '返回一般模式' : '進入管理模式'"
      class="!text-sm !font-bold !text-white !w-full mt-2 !rounded-xl shadow-lg shadow-blue-500/20"
      :class="
        isManagerMode
          ? '!bg-gray-400 hover:!bg-gray-500 !border-none'
          : '!bg-blue-600 hover:!bg-blue-700 !border-none'
      "
      @click="handleModeSwitch"
    />
  </div>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 16px);
}
</style>
