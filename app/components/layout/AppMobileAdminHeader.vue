<script setup lang="ts">
defineProps<{
  title: string;
}>();

const emit = defineEmits<{
  toggleMenu: [];
}>();
</script>

<template>
  <header
    class="md:hidden sticky top-0 z-30 flex-shrink-0 bg-white dark:bg-surface-900 border-b border-slate-200 dark:border-surface-700 pt-safe"
  >
    <div class="grid grid-cols-[2.75rem_1fr_2.75rem] items-center h-14 px-3">
      <Button
        icon="pi pi-bars"
        severity="secondary"
        variant="text"
        rounded
        aria-label="開啟選單"
        class="!size-11"
        @click="emit('toggleMenu')"
      />

      <h1
        class="text-center text-base font-bold truncate text-slate-900 dark:text-white px-1"
      >
        {{ title }}
      </h1>

      <div aria-hidden="true" />
    </div>
  </header>
</template>

<style scoped>
.pt-safe {
  padding-top: env(safe-area-inset-top, 0px);
}
</style>
