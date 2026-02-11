<script setup lang="ts">
/**
 * Reveal Button Component
 * Eye icon to toggle revealing a sensitive field.
 */
const props = defineProps<{
  memberId: string;
  field: string;
  maskedValue: string;
  canReveal: boolean;
}>();

const { isRevealing, revealFields, isFieldRevealed, getRevealedValue, maskFields } = useRevealSensitiveData();

const displayValue = computed(() => {
  if (isFieldRevealed(props.memberId, props.field)) {
    return getRevealedValue(props.memberId, props.field) || props.maskedValue;
  }
  return props.maskedValue;
});

const isRevealed = computed(() => isFieldRevealed(props.memberId, props.field));

async function toggleReveal(): Promise<void> {
  if (isRevealed.value) {
    maskFields(props.memberId, [props.field]);
  } else {
    await revealFields(props.memberId, [props.field]);
  }
}
</script>

<template>
  <div class="flex items-center gap-2 group">
    <span class="text-sm" :class="isRevealed ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'">
      {{ displayValue }}
    </span>
    <button
      v-if="canReveal"
      class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
      :disabled="isRevealing"
      @click.stop="toggleReveal"
    >
      <i
        :class="[
          isRevealed ? 'pi pi-eye-slash' : 'pi pi-eye',
          'text-xs text-slate-400 hover:text-primary',
        ]"
      />
    </button>
  </div>
</template>
