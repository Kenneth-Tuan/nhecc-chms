<script setup lang="ts">
/**
 * 預設佈局 (Default Layout)
 * 包含響應式導航欄：
 * - Mobile/Tablet: Bottom Navigation Bar (大字體、大 Icon)
 * - Desktop: Sidebar
 */
import AppSidebar from "~/components/layout/AppSidebar.vue";
import AppMobileNav from "~/components/layout/AppMobileNav.vue";
import { useAuthStore } from "~/stores/auth.store";

const authStore = useAuthStore();

onMounted(() => {
  if (!authStore.isInitialized) {
    authStore.loadContext();
  }
});

const menuItems = [
  { label: "首頁", icon: "pi pi-home", to: "/" },
  { label: "探索", icon: "pi pi-compass", to: "/explore" },
  { label: "學習", icon: "pi pi-book", to: "/learn" },
  { label: "個人", icon: "pi pi-user", to: "/profile" },
];
</script>

<template>
  <div
    class="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300"
  >
    <!-- Desktop Sidebar -->
    <AppSidebar :menu-items="menuItems" />

    <div class="flex flex-1 flex-col min-w-0 overflow-hidden">
      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto pt-4 px-4 pb-[88px] md:pb-0">
        <slot />
      </main>

      <!-- Mobile Bottom Navigation -->
      <AppMobileNav :menu-items="menuItems" />
    </div>
  </div>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
.pt-safe {
  padding-top: env(safe-area-inset-top, 20px);
}
</style>
