<script setup lang="ts">
const props = defineProps<{
  activateCallback: (step: number) => void;
}>();
</script>

<template>
  <div
    class="flex flex-col gap-2 mx-auto"
    style="min-height: 16rem; max-width: 24rem"
  >
    <div class="text-center mt-4 mb-4 text-xl font-semibold">
      Choose your interests
    </div>
    <div class="flex flex-wrap justify-center gap-4">
      <ToggleButton v-model="option1" onLabel="Nature" offLabel="Nature" />
      <ToggleButton v-model="option2" onLabel="Art" offLabel="Art" />
      <ToggleButton v-model="option3" onLabel="Music" offLabel="Music" />
      <ToggleButton v-model="option4" onLabel="Design" offLabel="Design" />
      <ToggleButton
        v-model="option5"
        onLabel="Photography"
        offLabel="Photography"
      />
      <ToggleButton v-model="option6" onLabel="Movies" offLabel="Movies" />
      <ToggleButton v-model="option7" onLabel="Sports" offLabel="Sports" />
      <ToggleButton v-model="option8" onLabel="Gaming" offLabel="Gaming" />
      <ToggleButton
        v-model="option9"
        onLabel="Traveling"
        offLabel="Traveling"
      />
      <ToggleButton v-model="option10" onLabel="Dancing" offLabel="Dancing" />
    </div>
  </div>
  <div class="flex pt-6 justify-between">
    <Button
      label="Back"
      severity="secondary"
      icon="pi pi-arrow-left"
      @click="activateCallback(1)"
    />
    <Button
      label="Next"
      icon="pi pi-arrow-right"
      iconPos="right"
      @click="activateCallback(3)"
    />
  </div>
</template>
