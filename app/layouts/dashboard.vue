<script setup lang="ts">
/**
 * Dashboard Layout
 * Admin layout with sidebar navigation.
 */
import AppSidebar from "~/components/layout/AppSidebar.vue";
import AppMobileNav from "~/components/layout/AppMobileNav.vue";

const auth = useAuth();

const menuItems = computed(() =>
  [
    { label: "首頁", icon: "pi pi-home", to: "/dashboard", show: true },
    {
      label: "會友管理",
      icon: "pi pi-users",
      to: "/dashboard/members",
      show: auth.can("view", "Member"),
    },
    {
      label: "組織架構",
      icon: "pi pi-sitemap",
      to: "/dashboard/organization",
      show: auth.can("view", "Organization"),
    },
    {
      label: "角色管理",
      icon: "pi pi-shield",
      to: "/dashboard/roles",
      show: auth.can("manage", "System"),
    },
  ].filter((item) => item.show),
);

onMounted(async () => {
  await auth.loadContext();
});
</script>

<template>
  <div
    class="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300"
  >
    <!-- Desktop Sidebar -->
    <AppSidebar :menu-items="menuItems" />

    <div class="flex flex-1 flex-col min-w-0 overflow-hidden lt-md:pb-14">
      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>

      <!-- Mobile Bottom Navigation -->
      <AppMobileNav :menu-items="menuItems.slice(0, 4)" />
    </div>
  </div>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 16px);
}
</style>
