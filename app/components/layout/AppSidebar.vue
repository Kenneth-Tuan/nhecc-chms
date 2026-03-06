<script setup lang="ts">
/**
 * Shared Sidebar Component
 */
import { useAuthStore } from "~/stores/auth.store";

interface MenuItem {
  label: string;
  icon: string;
  to: string;
}

const props = defineProps<{
  menuItems: MenuItem[];
}>();

const route = useRoute();
const authStore = useAuthStore();
const auth = useAuth(); // RBAC helper
const firebaseAuth = useFirebaseAuth();

const isActive = (path: string): boolean => {
  if (path === "/") return route.path === "/";
  if (path === "/dashboard") return route.path === "/dashboard";
  return route.path.startsWith(path);
};

const handleLogout = async () => {
  try {
    await firebaseAuth.logout();
    navigateTo("/login");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

const title = computed(() => {
  return route.fullPath.includes("/dashboard") ? "內行管理系統" : "內行人學院";
});

const userDescription = computed(() => {
  if (authStore.isAdmin) return `您擁有管理員權限`;

  return "一般使用者";
});

const isManagerMode = computed(() => route.path.startsWith("/dashboard"));
</script>

<template>
  <aside
    class="hidden md:flex flex-col flex-none w-72 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 overflow-hidden"
  >
    <!-- Logo -->
    <div
      class="flex items-center justify-start p-6 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer"
      @click="navigateTo('/')"
    >
      <div class="flex items-center justify-center mr-3 w-12 h-12">
        <img
          src="@/assets/icons/NHECC_ICON-01.png"
          alt="Logo"
          class="object-contain"
        />
      </div>
      <div>
        <h1
          class="font-bold text-lg leading-tight text-slate-800 dark:text-white"
        >
          NHECC ChMS
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ title }}</p>
      </div>
    </div>

    <!-- Menu -->
    <div class="flex-1 p-4 overflow-y-auto">
      <ul class="space-y-1">
        <li v-for="item in menuItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            :class="[
              'flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group',
              isActive(item.to)
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary font-bold'
                : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800',
            ]"
          >
            <i
              :class="[
                'text-2xl transition-colors',
                item.icon,
                isActive(item.to)
                  ? 'text-primary'
                  : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300',
              ]"
            />
            <span class="text-base">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- User info / Footer -->
    <div class="p-4 border-t border-slate-100 dark:border-slate-800">
      <div
        class="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800"
      >
        <Avatar
          :image="authStore.userContext?.avatar || undefined"
          :icon="authStore.userContext?.avatar ? undefined : 'pi pi-user'"
          shape="circle"
          class="!bg-slate-200 dark:!bg-slate-700 !text-slate-500"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold truncate text-slate-900 dark:text-white">
            {{ authStore.currentUserName }}
          </p>
          <p class="text-xs truncate text-slate-500">
            {{ userDescription }}
          </p>
        </div>

        <ColorModeButton />

        <i
          class="pi pi-sign-out text-slate-400 cursor-pointer hover:text-red-500 transition-colors ml-1"
          @click.stop="handleLogout"
        />
      </div>

      <Button
        v-if="authStore.isAdmin"
        :label="isManagerMode ? '返回一般模式' : '進入管理模式'"
        @click="navigateTo(isManagerMode ? '/' : '/dashboard')"
        :class="[
          '!text-sm !font-bold !text-white', // font
          '!w-full mt-2', // scaling
          isManagerMode
            ? '!bg-gray-400 hover:!bg-gray-500 !border-none'
            : '!bg-blue-600 hover:!bg-blue-700 !border-none', // border/color
          'shadow-lg shadow-blue-500/20', // shadow
          '!rounded-xl', // etc
        ]"
      />
    </div>
  </aside>
</template>
