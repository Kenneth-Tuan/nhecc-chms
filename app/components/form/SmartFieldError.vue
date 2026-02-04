<script setup lang="ts">
interface Props {
  message?: string;
  show?: boolean;
}
defineProps<Props>();
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform -translate-y-2 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform -translate-y-2 opacity-0"
  >
    <Message
      v-if="show"
      severity="error"
      size="small"
      variant="simple"
      class="mt-1"
    >
      {{ message }}
    </Message>
  </Transition>
</template>
