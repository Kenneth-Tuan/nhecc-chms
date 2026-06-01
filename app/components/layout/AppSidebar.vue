<script setup lang="ts">
import type { NavMenuItem } from "~/types/navigation";
import AppSidebarFooter from "./AppSidebarFooter.vue";
import AppNavMenuList from "./AppNavMenuList.vue";

const props = withDefaults(
  defineProps<{
    menuItems: NavMenuItem[];
    subtitle?: string;
  }>(),
  {
    subtitle: undefined,
  },
);

const route = useRoute();

const appSubtitle = computed(
  () =>
    props.subtitle ??
    (route.path.startsWith("/dashboard") ? "內行管理系統" : "內行人學院"),
);
</script>

<template>
  <aside
    class="hidden md:flex flex-col flex-none h-full bg-white dark:bg-surface-900 border-r border-slate-200 dark:border-surface-700 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 overflow-hidden"
  >
    <div
      class="flex items-center justify-start p-6 border-b border-slate-100 dark:border-surface-700/50 cursor-pointer"
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
        <p class="text-xs text-slate-500 dark:text-surface-400">
          {{ appSubtitle }}
        </p>
      </div>
    </div>

    <div class="flex-1 p-1 overflow-y-auto">
      <AppNavMenuList :items="menuItems" />
    </div>

    <div class="p-1 border-t border-slate-100 dark:border-surface-700">
      <AppSidebarFooter />
    </div>
  </aside>
</template>
