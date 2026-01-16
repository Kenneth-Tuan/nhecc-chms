<script setup lang="ts">
const { isDark, startViewTransition } = useTheme();
</script>

<template>
  <Button
    :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
    :icon="`pi pi-${isDark ? 'sun' : 'moon'}`"
    severity="contrast"
    variant="text"
    rounded
    @click="startViewTransition"
  />
</template>

<style></style>
