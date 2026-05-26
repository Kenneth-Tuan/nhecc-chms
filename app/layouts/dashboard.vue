<script setup lang="ts">
/**
 * Dashboard Layout
 * Admin layout with sidebar navigation (desktop) and drawer navigation (mobile).
 */
import AppSidebar from "~/components/layout/AppSidebar.vue";
import AppMobileAdminHeader from "~/components/layout/AppMobileAdminHeader.vue";
import AppMobileSidebarDrawer from "~/components/layout/AppMobileSidebarDrawer.vue";
import AppDashboardCourseSubNav from "~/components/layout/AppDashboardCourseSubNav.vue";

const auth = useAuth();
const {
  menuItems,
  menuGroups,
  courseSubNavItems,
  isCourseSection,
  pageTitle,
} = useDashboardNavigation();

const drawerVisible = ref(false);

onMounted(async () => {
  await auth.loadContext();
});
</script>

<template>
  <div
    class="flex h-screen overflow-hidden bg-slate-50 dark:bg-surface-950 text-slate-900 dark:text-surface-0 transition-colors duration-300"
  >
    <AppSidebar :menu-items="menuItems" />

    <div class="flex flex-1 flex-col min-w-0 overflow-hidden">
      <AppMobileAdminHeader
        :title="pageTitle"
        @toggle-menu="drawerVisible = true"
      />

      <AppMobileSidebarDrawer
        v-model:visible="drawerVisible"
        :menu-groups="menuGroups"
      />

      <AppDashboardCourseSubNav
        v-if="isCourseSection"
        :items="courseSubNavItems"
      />

      <main class="flex-1 overflow-y-auto p-4 md:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
