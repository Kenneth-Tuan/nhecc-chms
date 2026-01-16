<script setup lang="ts">
const { isDark, startViewTransition } = useTheme();
</script>

<template>
  <ClientOnly>
    <Button
      :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
      :icon="`pi pi-${isDark ? 'sun' : 'moon'}`"
      severity="contrast"
      variant="text"
      rounded
      @click="startViewTransition"
    />
  </ClientOnly>
</template>

<style></style>
