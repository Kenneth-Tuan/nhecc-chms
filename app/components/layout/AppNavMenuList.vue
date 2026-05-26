<script setup lang="ts">
import type { NavMenuGroup, NavMenuItem } from "~/types/navigation";

const props = defineProps<{
  items?: NavMenuItem[];
  groups?: NavMenuGroup[];
  compact?: boolean;
}>();

const emit = defineEmits<{
  navigate: [];
}>();

const route = useRoute();

function isNavActive(path: string): boolean {
  return isNavItemActive(path, route.path);
}

const sections = computed((): NavMenuGroup[] => {
  if (props.groups?.length) return props.groups;
  if (props.items?.length) return [{ label: "", items: props.items }];
  return [];
});

function onNavigate(): void {
  emit("navigate");
}
</script>

<template>
  <div class="space-y-4">
    <section v-for="group in sections" :key="group.label || 'default'">
      <p
        v-if="group.label"
        class="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-surface-500"
      >
        {{ group.label }}
      </p>
      <ul class="space-y-1">
        <li v-for="item in group.items" :key="item.to">
          <NuxtLink
            :to="item.to"
            :class="[
              'flex items-center gap-3 rounded-xl transition-all duration-200 group',
              compact ? 'px-3 py-2.5' : 'px-3 py-2',
              isNavActive(item.to)
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary font-bold'
                : 'text-slate-600 dark:text-surface-400 font-medium hover:bg-slate-50 dark:hover:bg-surface-800',
            ]"
            @click="onNavigate"
          >
            <i
              :class="[
                'transition-colors',
                compact ? 'text-xl' : 'text-2xl',
                item.icon,
                isNavActive(item.to)
                  ? 'text-primary'
                  : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-surface-300',
              ]"
            />
            <span :class="compact ? 'text-sm' : 'text-base'">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
