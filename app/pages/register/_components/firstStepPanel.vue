<script setup lang="ts">
const props = defineProps<{
  activateCallback: (step: number) => void;
}>();
</script>

<template>
  <div
    class="flex flex-col gap-2 mx-auto"
    style="min-height: 16rem; max-width: 20rem"
  >
    <div class="text-center mt-4 mb-4 text-xl font-semibold">
      Create your account
    </div>
    <div class="field">
      <InputText
        id="input"
        v-model="name"
        type="text"
        placeholder="Name"
        fluid
      />
    </div>
    <div class="field">
      <InputText
        id="email"
        v-model="email"
        type="email"
        placeholder="Email"
        fluid
      />
    </div>
    <div class="field">
      <Password v-model="password" placeholder="Password" fluid />
    </div>
  </div>
  <div class="flex pt-6 justify-end">
    <Button
      label="Next"
      icon="pi pi-arrow-right"
      iconPos="right"
      @click="activateCallback(2)"
    />
  </div>
</template>
