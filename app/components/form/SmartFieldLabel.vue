<script setup lang="ts">
interface Props {
  label?: string;
  fieldName: string;
  required?: boolean;
  icon?: string;
}
defineProps<Props>();
</script>

<template>
  <label
    v-if="label"
    :for="fieldName"
    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
  >
    <i v-if="icon" :class="[icon, 'text-slate-400']" />
    <span>
      {{ label }}
      <span v-if="required" class="text-primary">*</span>
    </span>
  </label>
</template>
