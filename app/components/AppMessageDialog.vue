<script setup lang="ts">
const dialogRef = inject("dialogRef") as any;

const params = computed(() => dialogRef.value.data || {});

const type = computed(() => params.value.type || "success");
const title = computed(() => params.value.title || "");
const message = computed(() => params.value.message || "");
const buttonLabel = computed(() => params.value.buttonLabel || "我知道了");

const closeDialog = () => {
  dialogRef.value.close();
};
</script>

<template>
  <div class="flex flex-col items-center py-4 text-center">
    <div
      v-if="type === 'success'"
      class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
    >
      <i class="pi pi-check text-4xl text-green-600" />
    </div>
    <div
      v-else-if="type === 'error'"
      class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4"
    >
      <i class="pi pi-times text-4xl text-red-600" />
    </div>
    <div
      v-else
      class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4"
    >
      <i class="pi pi-info-circle text-4xl text-blue-600" />
    </div>

    <p class="text-xl font-bold text-gray-900 mb-2">{{ title }}</p>
    <p class="text-gray-600 mb-6 text-base whitespace-pre-wrap">
      {{ message }}
    </p>

    <Button
      :label="buttonLabel"
      :severity="type === 'error' ? 'secondary' : 'primary'"
      class="w-full text-lg py-3"
      @click="closeDialog"
    />
  </div>
</template>
