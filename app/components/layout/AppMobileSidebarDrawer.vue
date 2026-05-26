<script setup lang="ts">
import type { NavMenuGroup } from "~/types/navigation";
import AppSidebarFooter from "./AppSidebarFooter.vue";
import AppNavMenuList from "./AppNavMenuList.vue";

const visible = defineModel<boolean>("visible", { default: false });

defineProps<{
  menuGroups: NavMenuGroup[];
}>();

function closeDrawer(): void {
  visible.value = false;
}
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="left"
    class="!w-[min(85vw,320px)]"
    :pt="{
      root: {
        class:
          'bg-white dark:bg-surface-900 border-r border-slate-200 dark:border-surface-700',
      },
      content: { class: '!p-0 flex flex-col h-full overflow-hidden' },
      header: { class: '!hidden' },
    }"
  >
    <div class="flex flex-col h-full">
      <div
        class="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-surface-700/50"
      >
        <div
          class="flex items-center gap-3 min-w-0 cursor-pointer"
          @click="
            closeDrawer();
            navigateTo('/');
          "
        >
          <div class="flex items-center justify-center w-10 h-10 shrink-0">
            <img
              src="@/assets/icons/NHECC_ICON-01.png"
              alt="Logo"
              class="object-contain"
            />
          </div>
          <div class="min-w-0">
            <p
              class="font-bold text-base leading-tight text-slate-800 dark:text-white truncate"
            >
              NHECC ChMS
            </p>
            <p class="text-xs text-slate-500 dark:text-surface-400">
              內行管理系統
            </p>
          </div>
        </div>

        <Button
          icon="pi pi-times"
          severity="secondary"
          variant="text"
          rounded
          aria-label="關閉選單"
          @click="closeDrawer"
        />
      </div>

      <div class="flex-1 overflow-y-auto px-2 py-4">
        <AppNavMenuList :groups="menuGroups" compact @navigate="closeDrawer" />
      </div>

      <div class="px-3 pt-3 border-t border-slate-100 dark:border-surface-700">
        <AppSidebarFooter @navigate="closeDrawer" />
      </div>
    </div>
  </Drawer>
</template>
