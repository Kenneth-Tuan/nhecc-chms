<script setup lang="ts">
/**
 * 統一頁面容器 (ST015)
 * 控制頁面內容的最大寬度與外間距。已移除動畫確保渲染穩定。
 */
interface Props {
  variant?: "default" | "narrow" | "fluid";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
});

const containerClass = computed(() => {
  const base = "mx-auto w-full"; // 移除 animate-fade-in

  switch (props.variant) {
    case "narrow":
      return `${base} max-w-4xl`;
    case "fluid":
      return `${base} max-w-full`;
    default:
      return `${base} max-w-7xl`;
  }
});
</script>

<template>
  <div :class="containerClass">
    <slot />
  </div>
</template>
