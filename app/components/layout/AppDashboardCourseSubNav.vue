<script setup lang="ts">
import type { NavMenuItem } from "~/types/navigation";

defineProps<{
  items: NavMenuItem[];
}>();

const route = useRoute();

function isNavActive(path: string): boolean {
  return isNavItemActive(path, route.path);
}
</script>

<template>
  <nav
    v-if="items.length > 1"
    class="md:hidden sticky z-20 px-4 py-2 bg-slate-50/95 dark:bg-surface-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-surface-700 course-sub-nav"
  >
    <div
      class="flex p-1 rounded-xl bg-slate-200/70 dark:bg-surface-800/80 border border-slate-200 dark:border-surface-700"
    >
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200',
          isNavActive(item.to)
            ? 'bg-white dark:bg-surface-900 text-primary shadow-sm'
            : 'text-slate-500 dark:text-surface-400 hover:text-slate-700 dark:hover:text-surface-200',
        ]"
      >
        <i :class="[item.icon, 'text-sm']" />
        <span class="truncate">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.course-sub-nav {
  top: calc(3.5rem + env(safe-area-inset-top, 0px));
}
</style>
