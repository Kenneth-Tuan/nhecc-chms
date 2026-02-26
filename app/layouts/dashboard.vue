<script setup lang="ts">
/**
 * Dashboard Layout
 * Admin layout with sidebar navigation.
 */
const route = useRoute();
const auth = useAuth();
const firebaseAuth = useFirebaseAuth();

const menuItems = [
  { label: "首頁", icon: "pi pi-home", to: "/dashboard" },
  { label: "會友管理", icon: "pi pi-users", to: "/dashboard/members" },
  { label: "組織架構", icon: "pi pi-sitemap", to: "/dashboard/organization" },
  { label: "角色管理", icon: "pi pi-shield", to: "/dashboard/roles" },
  // { label: "課程管理", icon: "pi pi-book", to: "/dashboard/courses" },
  // { label: "系統設定", icon: "pi pi-cog", to: "/dashboard/settings" },
];

const isActive = (path: string): boolean => {
  if (path === "/dashboard") return route.path === "/dashboard";
  return route.path.startsWith(path);
};

onMounted(async () => {
  await auth.loadContext();
});

async function handleLogout(): Promise<void> {
  await firebaseAuth.logout();
  navigateTo("/login");
}
</script>

<template>
  <div
    class="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300"
  >
    <!-- Desktop Sidebar -->
    <aside
      class="hidden md:flex flex-col fixed left-0 top-0 z-30 w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <!-- Logo -->
      <div
        class="flex items-center justify-start p-5 border-b border-slate-100 dark:border-slate-800/50"
      >
        <div class="flex items-center justify-center mr-3 w-10 h-10">
          <img
            src="@/assets/icons/NHECC_ICON-01.png"
            alt="Logo"
            class="object-contain"
          />
        </div>
        <div>
          <h1
            class="font-bold text-base leading-tight text-slate-800 dark:text-white"
          >
            NHECC ChMS
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">教會管理系統</p>
        </div>
      </div>

      <!-- Menu -->
      <nav class="flex-1 p-3 overflow-y-auto">
        <ul class="space-y-1">
          <li v-for="item in menuItems" :key="item.to">
            <NuxtLink
              :to="item.to"
              :class="[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm',
                isActive(item.to)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium',
              ]"
            >
              <i
                :class="[
                  item.icon,
                  'text-lg',
                  isActive(item.to) ? 'text-primary' : 'text-slate-400',
                ]"
              />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- User info -->
      <div class="p-3 border-t border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-3 px-3 py-2">
          <Avatar
            icon="pi pi-user"
            shape="circle"
            class="!bg-primary-100 dark:!bg-primary-900/30 !text-primary"
          />
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-semibold truncate text-slate-900 dark:text-white"
            >
              {{ auth.currentUserName.value }}
            </p>
            <p class="text-xs truncate text-slate-500">
              {{ auth.currentScopeLabel.value }}
            </p>
          </div>
          <Button
            icon="pi pi-sign-out"
            text
            rounded
            size="small"
            severity="secondary"
            @click="handleLogout"
          />
          <ColorModeButton />
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 md:ml-64 min-h-screen">
      <!-- Page Content -->
      <div class="p-6">
        <slot />
      </div>
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav
      class="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]"
    >
      <div class="grid grid-cols-4 h-[64px]">
        <NuxtLink
          v-for="item in menuItems.slice(0, 4)"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex flex-col items-center justify-center gap-0.5',
            isActive(item.to)
              ? 'text-primary'
              : 'text-slate-400 dark:text-slate-500',
          ]"
        >
          <i :class="[item.icon, 'text-xl']" />
          <span class="text-[10px] font-semibold">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 16px);
}
</style>
