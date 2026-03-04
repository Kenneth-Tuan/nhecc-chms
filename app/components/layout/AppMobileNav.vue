<script setup lang="ts">
/**
 * Shared Mobile Bottom Navigation Component
 */
interface MenuItem {
  label: string;
  icon: string;
  to: string;
}

const props = defineProps<{
  menuItems: MenuItem[];
}>();

const route = useRoute();

const isActive = (path: string): boolean => {
  if (path === "/") return route.path === "/";
  if (path === "/dashboard") return route.path === "/dashboard";
  return route.path.startsWith(path);
};
</script>

<template>
  <nav
    class="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] transition-colors duration-300"
  >
    <div class="grid grid-cols-4 h-[72px]">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform duration-200',
          isActive(item.to)
            ? 'text-primary'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
        ]"
      >
        <div
          :class="[
            'px-5 py-1 rounded-2xl transition-colors duration-300',
            isActive(item.to)
              ? 'bg-primary-50 dark:bg-primary-900/20'
              : 'bg-transparent',
          ]"
        >
          <i :class="[item.icon, 'text-2xl']" />
        </div>
        <span class="text-[11px] font-bold tracking-wide">{{
          item.label
        }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
</style>
