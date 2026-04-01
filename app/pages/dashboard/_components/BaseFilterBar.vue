<script setup lang="ts">
/**
 * 統一篩選列容器 (ST015)
 * 控制列表頂部篩選區域的背景、圓角、陰影與開闊的網格間距。
 */
interface Props {
  columns?: number;
}

const props = withDefaults(defineProps<Props>(), {
  columns: 4,
});

const gridClass = computed(() => {
  switch (props.columns) {
    case 1: return "grid-cols-1";
    case 2: return "grid-cols-1 md:grid-cols-2";
    case 3: return "grid-cols-1 md:grid-cols-3";
    case 5: return "grid-cols-1 md:grid-cols-5";
    default: return "grid-cols-1 md:grid-cols-4";
  }
});
</script>

<template>
  <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-10">
    <div :class="['grid gap-6', gridClass]">
      <slot />
    </div>
    
    <div v-if="$slots.extra" class="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
      <slot name="extra" />
    </div>
  </div>
</template>
